// lib/models/Group.ts
import mongoose, { Schema, model, models } from 'mongoose';
import { IGroup } from '@/lib/types';

const GroupMemberSchema = new Schema({
    clerkUserId: { type: String, required: true },
    userName: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    joinedAt: { type: Date, default: Date.now },
    role: {
        type: String,
        enum: ['member', 'admin', 'owner'],
        default: 'member'
    },
    isActive: { type: Boolean, default: true },
    totalXP: { type: Number, default: 0 }, // Cached XP for leaderboard
    rank: { type: String, default: 'Novice' } // Cached rank for display
}, { _id: false });

const GroupInviteSchema = new Schema({
    inviteCode: { type: String, required: true, unique: true },
    createdBy: { type: String, required: true }, // clerkUserId
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    maxUses: { type: Number, default: -1 }, // -1 for unlimited
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { _id: false });

const GroupActivitySchema = new Schema({
    type: {
        type: String,
        enum: ['member_joined', 'member_left', 'habit_completed', 'chain_completed', 'daily_goal_achieved'],
        required: true
    },
    clerkUserId: { type: String, required: true },
    userName: { type: String, required: true },
    description: { type: String, required: true },
    xpEarned: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

const GroupSchema = new Schema<IGroup>({
    name: { type: String, required: true, trim: true, maxlength: 50 },
    description: { type: String, trim: true, maxlength: 200 },
    owner: { type: String, required: true }, // clerkUserId of owner
    isPrivate: { type: Boolean, default: false },

    // Group settings
    settings: {
        allowInvites: { type: Boolean, default: true },
        requireApproval: { type: Boolean, default: false },
        maxMembers: { type: Number, default: 50 },
        xpMultiplier: { type: Number, default: 1.0, min: 0.5, max: 2.0 }, // Bonus XP for group activities
    },

    // Members
    members: [GroupMemberSchema],
    memberCount: { type: Number, default: 1 },

    // Invites
    invites: [GroupInviteSchema],

    // Recent activity feed
    recentActivity: [GroupActivitySchema],

    // Group stats
    stats: {
        totalHabitsCompleted: { type: Number, default: 0 },
        totalChainsCompleted: { type: Number, default: 0 },
        totalXPEarned: { type: Number, default: 0 },
        mostActiveDay: { type: String }, // Day of week
        averageDailyActivity: { type: Number, default: 0 }
    },

    // Group challenges (future feature)
    challenges: [{
        title: { type: String, required: true },
        description: { type: String },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        targetType: {
            type: String,
            enum: ['habit_completions', 'total_xp', 'streak_days'],
            required: true
        },
        targetValue: { type: Number, required: true },
        xpReward: { type: Number, default: 0 },
        participants: [{
            clerkUserId: String,
            progress: { type: Number, default: 0 },
            completed: { type: Boolean, default: false }
        }],
        isActive: { type: Boolean, default: true }
    }]
}, {
    timestamps: true
});

// Create indexes
GroupSchema.index({ owner: 1 });
GroupSchema.index({ 'members.clerkUserId': 1 });
GroupSchema.index({ 'invites.inviteCode': 1 });
GroupSchema.index({ isPrivate: 1, createdAt: -1 }); // For public group discovery
GroupSchema.index({ memberCount: -1 }); // For popular groups

export const Group = models.Group || model<IGroup>('Group', GroupSchema);