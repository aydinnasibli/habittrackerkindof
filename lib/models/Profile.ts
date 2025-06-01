// lib/models/Profile.ts
import mongoose, { Schema, model, models } from 'mongoose';
import { IProfile } from '@/lib/types';

const ProfileSchema = new Schema<IProfile>({
    clerkUserId: { type: String, required: true, unique: true, },
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
        enum: ['light', 'dark', 'system', 'midnight', 'forest', 'ocean', 'sunset', 'lavender'],
        default: 'system'
    },
    notifications: {
        type: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
            habitReminders: { type: Boolean, default: true },
            weeklyReports: { type: Boolean, default: true }
        },
        default: () => ({
            email: true,
            push: true,
            habitReminders: true,
            weeklyReports: true
        })
    },
    privacy: {
        type: {
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
        default: () => ({
            profileVisibility: 'private',
            showStreak: true,
            showProgress: true,
            showXP: true,
            showRank: true
        })
    },
    goals: {
        type: {
            dailyHabitTarget: { type: Number, default: 3 },
            weeklyGoal: { type: Number, default: 21 }
        },
        default: () => ({
            dailyHabitTarget: 3,
            weeklyGoal: 21
        })
    },
    // Simplified XP System - only total XP matters
    xp: {
        type: {
            total: { type: Number, default: 0 }
        },
        default: () => ({
            total: 0
        })
    },
    // Rank based on total XP using RANK_REQUIREMENTS
    rank: {
        type: {
            title: {
                type: String,
                enum: ['Novice', 'Beginner', 'Apprentice', 'Practitioner', 'Expert', 'Master', 'Grandmaster', 'Legend'],
                default: 'Novice'
            },
            level: { type: Number, default: 1 }, // 1-8 corresponding to rank titles
            progress: { type: Number, default: 0 } // 0-100% progress within current rank
        },
        default: () => ({
            title: 'Novice',
            level: 1,
            progress: 0
        })
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
        type: {
            totalHabitsCreated: { type: Number, default: 0 },
            totalCompletions: { type: Number, default: 0 },
            longestStreak: { type: Number, default: 0 },
            totalChainsCompleted: { type: Number, default: 0 },
            dailyBonusesEarned: { type: Number, default: 0 },
            totalGroupsJoined: { type: Number, default: 0 },
            joinedAt: { type: Date, default: Date.now }
        },
        default: () => ({
            totalHabitsCreated: 0,
            totalCompletions: 0,
            longestStreak: 0,
            totalChainsCompleted: 0,
            dailyBonusesEarned: 0,
            totalGroupsJoined: 0,
            joinedAt: new Date()
        })
    }
}, {
    timestamps: true
});

// Pre-save middleware to ensure proper initialization and rank calculation
ProfileSchema.pre('save', function (next) {
    // Initialize XP if it doesn't exist
    if (!this.xp) {
        this.xp = { total: 0 };
    }

    // Initialize rank if it doesn't exist
    if (!this.rank) {
        this.rank = {
            title: 'Novice',
            level: 1,
            progress: 0
        };
    }

    // Initialize other nested objects if they don't exist
    if (!this.stats) {
        this.stats = {
            totalHabitsCreated: 0,
            totalCompletions: 0,
            longestStreak: 0,
            totalChainsCompleted: 0,
            dailyBonusesEarned: 0,
            totalGroupsJoined: 0,
            joinedAt: new Date()
        };
    }

    if (!this.notifications) {
        this.notifications = {
            email: true,
            push: true,
            habitReminders: true,
            weeklyReports: true
        };
    }

    if (!this.privacy) {
        this.privacy = {
            profileVisibility: 'private',
            showStreak: true,
            showProgress: true,
            showXP: true,
            showRank: true
        };
    }

    if (!this.goals) {
        this.goals = {
            dailyHabitTarget: 3,
            weeklyGoal: 21
        };
    }

    next();
});

// Create indexes for efficient queries
ProfileSchema.index({ clerkUserId: 1 });
ProfileSchema.index({ email: 1 });
ProfileSchema.index({ 'xp.total': -1 }); // For leaderboard queries
ProfileSchema.index({ 'rank.level': -1, 'xp.total': -1 }); // For ranking queries
ProfileSchema.index({ 'groups.groupId': 1 }); // For group queries

export const Profile = models.Profile || model<IProfile>('Profile', ProfileSchema);