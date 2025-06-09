// lib/actions/leaderboard.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongoose';
import { Profile } from '@/lib/models/Profile';
import { Types } from 'mongoose';

export interface LeaderboardUser {
    _id: string;
    firstName?: string;
    lastName?: string;
    userName?: string;
    rankTitle: string;
    rankLevel: number;
    totalCompletions: number;
    longestStreak: number;
    joinedAt: string;
}

export interface UserProfile {
    _id: string;
    firstName?: string;
    lastName?: string;
    userName?: string;
    bio?: string;
    rankTitle: string;
    rankLevel: number;
    rankProgress: number;
    totalCompletions: number;
    longestStreak: number;
    totalHabitsCreated: number;
    totalChainsCompleted: number;
    dailyBonusesEarned: number;
    joinedAt: string;
}

// Type definition for lean query results
interface LeaderboardQueryResult {
    _id: Types.ObjectId;
    firstName?: string;
    lastName?: string;
    userName?: string;
    rank?: {
        title?: string;
        level?: number;
        progress?: number;
    };
    stats?: {
        totalCompletions?: number;
        longestStreak?: number;
        totalHabitsCreated?: number;
        totalChainsCompleted?: number;
        dailyBonusesEarned?: number;
    };
    createdAt?: Date;
    bio?: string;
}

export async function getLeaderboard(): Promise<{ success: boolean; users?: LeaderboardUser[]; error?: string }> {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        await connectToDatabase();

        const users = await Profile.find({ 'privacy.profileVisibility': 'public' })
            .select('firstName lastName userName rank stats createdAt')
            .sort({ 'xp.total': -1 })
            .limit(100)
            .lean<LeaderboardQueryResult[]>();

        const leaderboardUsers: LeaderboardUser[] = users.map((user) => ({
            _id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            userName: user.userName,
            rankTitle: user.rank?.title || 'Novice',
            rankLevel: user.rank?.level || 1,
            totalCompletions: user.stats?.totalCompletions || 0,
            longestStreak: user.stats?.longestStreak || 0,
            joinedAt: user.createdAt?.toISOString() || new Date().toISOString()
        }));

        return { success: true, users: leaderboardUsers };
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return { success: false, error: 'Failed to fetch leaderboard' };
    }
}

export async function getUserProfile(userId: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
        const { userId: currentUserId } = await auth();
        if (!currentUserId) {
            return { success: false, error: 'Not authenticated' };
        }

        await connectToDatabase();

        const user = await Profile.findOne({
            _id: userId,
            'privacy.profileVisibility': 'public'
        })
            .select('firstName lastName userName bio rank stats createdAt')
            .lean<LeaderboardQueryResult>();

        if (!user) {
            return { success: false, error: 'User not found or profile is private' };
        }

        const userProfile: UserProfile = {
            _id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            userName: user.userName,
            bio: user.bio,
            rankTitle: user.rank?.title || 'Novice',
            rankLevel: user.rank?.level || 1,
            rankProgress: user.rank?.progress || 0,
            totalCompletions: user.stats?.totalCompletions || 0,
            longestStreak: user.stats?.longestStreak || 0,
            totalHabitsCreated: user.stats?.totalHabitsCreated || 0,
            totalChainsCompleted: user.stats?.totalChainsCompleted || 0,
            dailyBonusesEarned: user.stats?.dailyBonusesEarned || 0,
            joinedAt: user.createdAt?.toISOString() || new Date().toISOString()
        };

        return { success: true, user: userProfile };
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return { success: false, error: 'Failed to fetch user profile' };
    }
}