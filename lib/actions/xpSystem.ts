// lib/actions/xpSystem.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongoose';
import { Profile } from '@/lib/models/Profile';
import { Group } from '@/lib/models/Group';
import { RANK_REQUIREMENTS, XP_REWARDS, IXPEntry } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Define types for better type safety
interface GroupMember {
    clerkUserId: string;
    totalXP: number;
    rank: string;
    firstName?: string;
    lastName?: string;
    userName?: string;
    isActive: boolean;
    joinedAt: Date;
}

interface GroupWithMembers {
    _id: string;
    members: GroupMember[];
    settings: {
        xpMultiplier: number;
    };
    stats: {
        totalXPEarned: number;
    };
}

// Recalculate and sync XP/rank for a profile
export async function recalculateProfileXP(clerkUserId: string) {
    try {
        await connectToDatabase();

        const profile = await Profile.findOne({ clerkUserId });
        if (!profile) return { success: false, error: 'Profile not found' };

        // Recalculate rank based on current total XP
        const rankInfo = calculateRank(profile.xp.total);

        // Update the profile with correct rank info
        await Profile.updateOne(
            { clerkUserId },
            {
                $set: {
                    'rank.title': rankInfo.title,
                    'rank.level': rankInfo.level,
                    'rank.progress': rankInfo.progress,
                    updatedAt: new Date()
                }
            }
        );

        return { success: true, rankInfo };
    } catch (error) {
        console.error('Error recalculating XP:', error);
        return { success: false, error: 'Failed to recalculate XP' };
    }
}

// Calculate rank from total XP using RANK_REQUIREMENTS
function calculateRank(totalXP: number): { title: string; level: number; progress: number } {
    // Find the appropriate rank based on total XP
    for (let i = 8; i >= 1; i--) {
        const rank = RANK_REQUIREMENTS[i as keyof typeof RANK_REQUIREMENTS];
        if (totalXP >= rank.minXP) {
            // Calculate progress within current rank
            const progress = rank.maxXP === Infinity ? 100 :
                Math.min(100, Math.floor(((totalXP - rank.minXP) / (rank.maxXP - rank.minXP)) * 100));

            return {
                title: rank.title,
                level: i,
                progress
            };
        }
    }

    // Default to lowest rank if somehow no match
    return {
        title: RANK_REQUIREMENTS[1].title,
        level: 1,
        progress: Math.min(100, Math.floor((totalXP / RANK_REQUIREMENTS[1].maxXP) * 100))
    };
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

        // Store previous rank for comparison
        const previousRank = profile.rank;

        // Apply group multiplier if in a group
        let finalAmount = amount;
        if (groupId) {
            const group = await Group.findById(groupId) as GroupWithMembers | null;
            if (group && group.members.some((m: GroupMember) => m.clerkUserId === clerkUserId)) {
                finalAmount = Math.floor(amount * group.settings.xpMultiplier);
            }
        }

        // Calculate new total XP
        const newTotalXP = profile.xp.total + finalAmount;

        // Calculate new rank based on total XP
        const rankInfo = calculateRank(newTotalXP);

        // Check for rank up
        const rankedUp = rankInfo.level > previousRank.level;

        // Add XP entry to history
        const xpEntry: IXPEntry = {
            date: new Date(),
            amount: finalAmount,
            source,
            description
        };

        // Update profile with new XP and rank
        await Profile.updateOne(
            { clerkUserId },
            {
                $set: {
                    'xp.total': newTotalXP,
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
                    $set: {
                        'members.$.totalXP': newTotalXP,
                        'members.$.rank': rankInfo.title
                    }
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
            rankedUp,
            newRank: rankInfo.title,
            rankLevel: rankInfo.level,
            rankProgress: rankInfo.progress,
            previousRank: previousRank.title
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

        // Calculate bonus XP based on XP_REWARDS
        const baseBonus = XP_REWARDS.DAILY_BONUS.BASE;
        const streakMultiplier = XP_REWARDS.DAILY_BONUS.STREAK_MULTIPLIER;
        const streakBonus = profile.stats.longestStreak > 0 ?
            Math.floor(baseBonus * ((profile.stats.longestStreak / 10) * (streakMultiplier - 1))) : 0;
        const totalBonus = baseBonus + streakBonus;

        // Award XP
        const result = await awardXP(
            clerkUserId,
            totalBonus,
            'daily_bonus',
            `Daily bonus: ${completedHabitsToday}/${totalHabitsToday} habits completed${streakBonus > 0 ? ` (${profile.stats.longestStreak} day streak bonus)` : ''}`
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
        // Get milestone keys and check if current streak matches any milestone
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
            `${milestone}-day streak milestone achieved!`
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

        // Get current user's profile to find their rank
        const currentUserProfile = await Profile.findOne({ clerkUserId: userId }).select('xp');
        const userTotalXP = currentUserProfile?.xp?.total || 0;

        // Calculate user's rank among public profiles
        const userRank = await Profile.countDocuments({
            'privacy.profileVisibility': 'public',
            'xp.total': { $gt: userTotalXP }
        }) + 1;

        return {
            success: true,
            leaderboard: leaderboard.map((profile, index) => ({
                rank: index + 1,
                name: profile.userName || `${profile.firstName} ${profile.lastName}`.trim(),
                totalXP: profile.xp.total,
                rankTitle: profile.rank.title,
                rankLevel: profile.rank.level,
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
            .lean() as { members: GroupMember[] } | null;

        if (!group) {
            return { success: false, error: 'Group not found' };
        }

        // Check if user is member
        const isMember = group.members.some((m: GroupMember) => m.clerkUserId === userId);
        if (!isMember) {
            return { success: false, error: 'Not a member of this group' };
        }

        // Sort members by XP and create leaderboard
        const leaderboard = group.members
            .filter((m: GroupMember) => m.isActive)
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

// Utility function to get user's current rank info
export async function getUserRankInfo(clerkUserId: string) {
    try {
        await connectToDatabase();

        const profile = await Profile.findOne({ clerkUserId })
            .select('xp rank')
            .lean();

        if (!profile) {
            return { success: false, error: 'Profile not found' };
        }

        // Recalculate rank to ensure consistency
        const rankInfo = calculateRank(profile.xp.total);

        return {
            success: true,
            totalXP: profile.xp.total,
            rank: rankInfo
        };
    } catch (error) {
        console.error('Error getting user rank info:', error);
        return { success: false, error: 'Failed to get rank info' };
    }
}

// Remove XP from user (for habit unmarking, etc.)
export async function removeXP(
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

        // Store previous rank for comparison
        const previousRank = profile.rank;

        // Apply group multiplier if in a group (same as when awarding)
        let finalAmount = amount;
        if (groupId) {
            const group = await Group.findById(groupId) as GroupWithMembers | null;
            if (group && group.members.some((m: GroupMember) => m.clerkUserId === clerkUserId)) {
                finalAmount = Math.floor(amount * group.settings.xpMultiplier);
            }
        }

        // Calculate new total XP (ensure it doesn't go below 0)
        const newTotalXP = Math.max(0, profile.xp.total - finalAmount);

        // Calculate new rank based on total XP
        const rankInfo = calculateRank(newTotalXP);

        // Check for rank down
        const rankedDown = rankInfo.level < previousRank.level;

        // Add negative XP entry to history
        const xpEntry: IXPEntry = {
            date: new Date(),
            amount: -finalAmount, // Negative amount to show XP removal
            source,
            description
        };

        // Update profile with new XP and rank
        await Profile.updateOne(
            { clerkUserId },
            {
                $set: {
                    'xp.total': newTotalXP,
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
                    $inc: { 'stats.totalXPEarned': -finalAmount }, // Decrease group XP
                    $set: {
                        'members.$.totalXP': newTotalXP,
                        'members.$.rank': rankInfo.title
                    }
                }
            );

            // Add group activity for XP removal
            await Group.updateOne(
                { _id: groupId },
                {
                    $push: {
                        recentActivity: {
                            $each: [{
                                type: source === 'habit_completion' ? 'habit_completed' : 'daily_goal_achieved',
                                clerkUserId,
                                userName: profile.userName || `${profile.firstName} ${profile.lastName}`.trim(),
                                description,
                                xpEarned: -finalAmount, // Negative to show removal
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
            xpRemoved: finalAmount,
            newTotalXP,
            rankedDown,
            newRank: rankInfo.title,
            rankLevel: rankInfo.level,
            rankProgress: rankInfo.progress,
            previousRank: previousRank.title
        };
    } catch (error) {
        console.error('Error removing XP:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to remove XP'
        };
    }
}