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
        showProgress: { type: Boolean, default: true }
    },
    goals: {
        dailyHabitTarget: { type: Number, default: 3, min: 1, max: 20 },
        weeklyGoal: { type: Number, default: 21, min: 1, max: 140 }
    },
    stats: {
        totalHabitsCreated: { type: Number, default: 0 },
        totalCompletions: { type: Number, default: 0 },
        longestStreak: { type: Number, default: 0 },
        totalChainsCompleted: { type: Number, default: 0 },
        joinedAt: { type: Date, default: Date.now() }
    }
}, {
    timestamps: true
});

// Create indexes
ProfileSchema.index({ clerkUserId: 1 });
ProfileSchema.index({ email: 1 });

export const Profile = models.Profile || model<IProfile>('Profile', ProfileSchema);