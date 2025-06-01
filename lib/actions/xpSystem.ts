// lib/actions/xpSystem.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongoose';
import { Profile } from '@/lib/models/Profile';
import { Group } from '@/lib/models/Group';
import { RANK_REQUIREMENTS, XP_REWARDS, IXPEntry } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Calculate level from total XP
function calculateLevel(totalXP: number): { level: number; currentLevelXP: number; xpToNextLevel: number } {
    // Level progression: 100, 250, 500, 1000, 2000, 4000, 8000, 16000...
    let level = 1;
    let xpForCurrentLevel = 0;
    let xpForNextLevel = 100;

    while (totalXP >= xpForNextLevel) {
        xpForCurrentLevel = xpForNextLevel;
        level++;
        xpForNextLevel = Math.floor(xpForCurrentLevel * (level <= 5 ? 2.5 : 2.0));
    }

    const currentLevelXP = totalXP - xpForCurrentLevel;
    const xpToNextLevel = xpForNextLevel - totalXP;

    return { level, currentLevelXP, xpToNextLevel };
}

// Calculate rank from total XP
function calculateRank(totalXP: number): { title: string; level: number; progress: number } {
    for (let i = 8; i >= 1; i--) {
        const rank = RANK_REQUIREMENTS[i as keyof typeof RANK_REQUIREMENTS];
        if (totalXP >= rank.minXP) {
            const progress = rank.maxXP === Infinity ? 100 :
                Math.floor(((totalXP - rank.minXP) / (rank.maxXP - rank.minXP)) * 100);
            return { title: rank.title, level: i, progress };
        }
    }
    return { title: 'Novice', level: 1, progress: 0 };
}

// Award XP to user
export async function awardXP(
    clerkUserId: string,
    amount: number,
    source: IXPEntry['source'],
    description: string,
    groupId?: string
) {
    try {
        await connectToDatabase();

        const profile = await Profile.findOne({ clerkUserId });
        if (!profile) {
            throw new Error('Profile not found');
        }

        // Apply group multiplier if in a group
        let finalAmount = amount;
        if (groupId) {
            const group = await Group.findById(groupId);
            if (group && group.members.some(m => m.clerkUserId === clerkUserId)) {
                finalAmount = Math.floor(amount * group.settings.xpMultiplier);
            }
        }

        // Update XP
        const newTotalXP = profile.xp.total + finalAmount;
        const levelInfo = calculateLevel(newTotalXP);
        const rankInfo = calculateRank(newTotalXP);

        // Check for level up
        const leveledUp = levelInfo.level > profile.xp.currentLevel;
        const rankedUp = rankInfo.level > profile.rank.level;

        // Add XP entry to history
        const xpEntry: IXPEntry = {
            date: new Date(),
            amount: finalAmount,
            source,
            description
        };

        // Update profile
        await Profile.updateOne(
            { clerkUserId },
            {
                $set: {
                    'xp.total': newTotalXP,
                    'xp.currentLevel': levelInfo.level,
                    'xp.currentLevelXP': levelInfo.currentLevelXP,
                    'xp.xpToNextLevel': levelInfo.xpToNextLevel,
                    'rank.title': rankInfo.title,
                    'rank.level': rankInfo.level,
                    'rank.progress': rankInfo.progress,
                    updatedAt: new Date()
                },
                $push: {
                    xpHistory: {
                        $each: [xpEntry],
                        $slice: -100 // Keep only last 100 entries
                    }
                }
            }
        );

        // Update group stats if applicable
        if (groupId) {
            await Group.updateOne(
                { _id: groupId, 'members.clerkUserId': clerkUserId },
                {
                    $inc: { 'stats.totalXPEarned': finalAmount },
                    $set: { 'members.$.totalXP': newTotalXP, 'members.$.rank': rankInfo.title }
                }
            );

            // Add group activity
            await Group.updateOne(
                { _id: groupId },
                {
                    $push: {
                        recentActivity: {
                            $each: [{
                                type: source === 'habit_completion' ? 'habit_completed' :
                                    source === 'chain_completion' ? 'chain_completed' : 'daily_goal_achieved',
                                clerkUserId,
                                userName: profile.userName || `${profile.firstName} ${profile.lastName}`.trim(),
                                description,
                                xpEarned: finalAmount,
                                timestamp: new Date()
                            }],
                            $slice: -50 // Keep only last 50 activities
                        }
                    }
                }
            );
        }

        return {
            success: true,
            xpAwarded: finalAmount,
            newTotalXP,
            leveledUp,
            rankedUp,
            newLevel: levelInfo.level,
            newRank: rankInfo.title
        };
    } catch (error) {
        console.error('Error awarding XP:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to award XP'
        };
    }
}

// Check and award daily bonus
export async function checkDailyBonus(clerkUserId: string, completedHabitsToday: number, totalHabitsToday: number) {
    try {
        const profile = await Profile.findOne({ clerkUserId });
        if (!profile) return { success: false, error: 'Profile not found' };

        // Check if all habits completed today
        if (completedHabitsToday < totalHabitsToday) {
            return { success: false, message: 'Not all habits completed yet' };
        }

        // Check if daily bonus already awarded today
        const today = new Date().toDateString();
        const alreadyAwarded = profile.xpHistory.some(entry =>
            entry.source === 'daily_bonus' &&
            entry.date.toDateString() === today
        );

        if (alreadyAwarded) {
            return { success: false, message: 'Daily bonus already awarded' };
        }

        // Calculate bonus XP
        const baseBonus = XP_REWARDS.DAILY_BONUS.BASE;
        const streakBonus = Math.floor(baseBonus * (profile.stats.longestStreak * 0.1)); // 10% per streak day
        const totalBonus = baseBonus + streakBonus;

        // Award XP
        const result = await awardXP(
            clerkUserId,
            totalBonus,
            'daily_bonus',
            `Daily bonus: ${completedHabitsToday}/${totalHabitsToday} habits completed`
        );

        if (result.success) {
            // Update daily bonus counter
            await Profile.updateOne(
                { clerkUserId },
                { $inc: { 'stats.dailyBonusesEarned': 1 } }
            );
        }

        return result;
    } catch (error) {
        console.error('Error checking daily bonus:', error);
        return { success: false, error: 'Failed to check daily bonus' };
    }
}

// Award streak milestone XP
export async function checkStreakMilestone(clerkUserId: string, newStreak: number) {
    try {
        const milestones = Object.keys(XP_REWARDS.STREAK_MILESTONES).map(Number);
        const milestone = milestones.find(m => m === newStreak);

        if (!milestone) {
            return { success: false, message: 'No milestone reached' };
        }

        const xpReward = XP_REWARDS.STREAK_MILESTONES[milestone as keyof typeof XP_REWARDS.STREAK_MILESTONES];

        return await awardXP(
            clerkUserId,
            xpReward,
            'streak_milestone',
            `${milestone}-day streak milestone reached!`
        );
    } catch (error) {
        console.error('Error checking streak milestone:', error);
        return { success: false, error: 'Failed to check streak milestone' };
    }
}

// Get leaderboard
export async function getGlobalLeaderboard(limit: number = 10) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Not authenticated' };

        await connectToDatabase();

        const leaderboard = await Profile.find({ 'privacy.profileVisibility': 'public' })
            .select('firstName lastName userName xp rank stats')
            .sort({ 'xp.total': -1 })
            .limit(limit)
            .lean();

        // Get current user's rank
        const userRank = await Profile.countDocuments({
            'privacy.profileVisibility': 'public',
            'xp.total': { $gt: (await Profile.findOne({ clerkUserId: userId }))?.xp.total || 0 }
        }) + 1;

        return {
            success: true,
            leaderboard: leaderboard.map((profile, index) => ({
                rank: index + 1,
                name: profile.userName || `${profile.firstName} ${profile.lastName}`.trim(),
                totalXP: profile.xp.total,
                rankTitle: profile.rank.title,
                totalCompletions: profile.stats.totalCompletions
            })),
            userRank
        };
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        return { success: false, error: 'Failed to get leaderboard' };
    }
}

// Get group leaderboard
export async function getGroupLeaderboard(groupId: string) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Not authenticated' };

        await connectToDatabase();

        const group = await Group.findById(groupId)
            .select('members')
            .lean();

        if (!group) {
            return { success: false, error: 'Group not found' };
        }

        // Check if user is member
        const isMember = group.members.some(m => m.clerkUserId === userId);
        if (!isMember) {
            return { success: false, error: 'Not a member of this group' };
        }

        // Sort members by XP
        const leaderboard = group.members
            .filter(m => m.isActive)
            .sort((a, b) => b.totalXP - a.totalXP)
            .map((member, index) => ({
                rank: index + 1,
                name: member.userName || `${member.firstName} ${member.lastName}`.trim(),
                totalXP: member.totalXP,
                rankTitle: member.rank,
                joinedAt: member.joinedAt
            }));

        return { success: true, leaderboard };
    } catch (error) {
        console.error('Error getting group leaderboard:', error);
        return { success: false, error: 'Failed to get group leaderboard' };
    }
}