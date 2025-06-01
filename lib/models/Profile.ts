// lib/models/Profile.ts
import mongoose, { Schema, model, models } from 'mongoose';
import { IProfile } from '@/lib/types';

const ProfileSchema = new Schema<IProfile>({
    clerkUserId: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    userName: { type: String },
    email: { type: String, required: true, trim: true, lowercase: true },
    bio: { type: String, trim: true, maxlength: 500 },
    timezone: { type: String, default: 'UTC' },
    dateFormat: {
        type: String,
        enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
        default: 'MM/DD/YYYY'
    },
    timeFormat: {
        type: String,
        enum: ['12h', '24h'],
        default: '12h'
    },
    theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system'
    },
    notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        habitReminders: { type: Boolean, default: true },
        weeklyReports: { type: Boolean, default: true }
    },
    privacy: {
        profileVisibility: {
            type: String,
            enum: ['public', 'private'],
            default: 'private'
        },
        showStreak: { type: Boolean, default: true },
        showProgress: { type: Boolean, default: true },
        showXP: { type: Boolean, default: true },
        showRank: { type: Boolean, default: true }
    },
    goals: {
        dailyHabitTarget: { type: Number, default: 3 },
        weeklyGoal: { type: Number, default: 21 }
    },
    // XP and Ranking System
    xp: {
        total: { type: Number, default: 0 },
        currentLevel: { type: Number, default: 1 },
        currentLevelXP: { type: Number, default: 0 }, // XP in current level
        xpToNextLevel: { type: Number, default: 100 }, // XP needed for next level
    },
    rank: {
        title: {
            type: String,
            enum: ['Novice', 'Beginner', 'Apprentice', 'Practitioner', 'Expert', 'Master', 'Grandmaster', 'Legend'],
            default: 'Novice'
        },
        level: { type: Number, default: 1 }, // 1-8 corresponding to rank titles
        progress: { type: Number, default: 0 }, // 0-100% progress to next rank
    },
    // XP History for analytics
    xpHistory: [{
        date: { type: Date, required: true },
        amount: { type: Number, required: true },
        source: {
            type: String,
            enum: ['habit_completion', 'daily_bonus', 'chain_completion', 'streak_milestone', 'group_activity'],
            required: true
        },
        description: { type: String, required: true }
    }],
    // Group memberships
    groups: [{
        groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
        joinedAt: { type: Date, default: Date.now },
        role: {
            type: String,
            enum: ['member', 'admin', 'owner'],
            default: 'member'
        }
    }],
    stats: {
        totalHabitsCreated: { type: Number, default: 0 },
        totalCompletions: { type: Number, default: 0 },
        longestStreak: { type: Number, default: 0 },
        totalChainsCompleted: { type: Number, default: 0 },
        dailyBonusesEarned: { type: Number, default: 0 },
        totalGroupsJoined: { type: Number, default: 0 },
        joinedAt: { type: Date, default: Date.now }
    }
}, {
    timestamps: true
});

// Create indexes
ProfileSchema.index({ clerkUserId: 1 });
ProfileSchema.index({ email: 1 });
ProfileSchema.index({ 'xp.total': -1 }); // For leaderboard queries
ProfileSchema.index({ 'rank.level': -1, 'xp.total': -1 }); // For ranking queries
ProfileSchema.index({ 'groups.groupId': 1 }); // For group queries

export const Profile = models.Profile || model<IProfile>('Profile', ProfileSchema);