// lib/models/ChainSession.ts - Optimized Schema

import mongoose, { Schema, model, models } from 'mongoose';
import { IChainSession } from '@/lib/types';

const ChainSessionHabitSchema = new Schema({
    habitId: {
        type: String,
        required: true,
        index: true // Index for faster habit lookups
    },
    habitName: {
        type: String,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    order: {
        type: Number,
        required: true,
        min: 0
    },
    startedAt: {
        type: Date,
        index: true // Index for time-based queries
    },
    completedAt: {
        type: Date,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'completed', 'skipped'],
        default: 'pending',
        index: true // Index for status filtering
    },
    notes: {
        type: String,
        maxlength: 500 // Limit notes length
    }
}, {
    _id: false,
    minimize: false // Don't remove empty objects
});

const ChainSessionSchema = new Schema<IChainSession>({
    clerkUserId: {
        type: String,
        required: true,
        index: true,
        validate: {
            validator: function (v: string) {
                return v && v.length > 0;
            },
            message: 'clerkUserId is required'
        }
    },
    chainId: {
        type: String,
        required: true,
        validate: {
            validator: function (v: string) {
                return mongoose.Types.ObjectId.isValid(v);
            },
            message: 'chainId must be a valid ObjectId'
        }
    },
    chainName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'abandoned'],
        default: 'active',
        index: true
    },
    startedAt: {
        type: Date,
        required: true,
        default: Date.now,
        index: true
    },
    completedAt: {
        type: Date,
        index: true,
        validate: {
            validator: function (this: IChainSession, v: Date) {
                // Only validate if completedAt is set
                return !v || v >= this.startedAt;
            },
            message: 'completedAt must be after startedAt'
        }
    },
    currentHabitIndex: {
        type: Number,
        default: 0,
        min: 0
    },
    totalHabits: {
        type: Number,
        required: true,
        min: 1,
        max: 20 // Reasonable limit
    },
    habits: {
        type: [ChainSessionHabitSchema],
        validate: {
            validator: function (v: any[]) {
                return v.length > 0 && v.length <= 20;
            },
            message: 'Must have between 1 and 20 habits'
        }
    },
    totalDuration: {
        type: String,
        required: true
    },
    actualDuration: {
        type: Number,
        min: 0
    },
    pausedAt: {
        type: Date,
        index: true
    },
    pauseDuration: {
        type: Number,
        default: 0,
        min: 0
    },
    breakStartedAt: {
        type: Date
    },
    onBreak: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true,
    // Optimize for queries
    collection: 'chainsessions',
    // Enable automatic index creation
    autoIndex: process.env.NODE_ENV !== 'production',
    // Optimize document size
    minimize: false
});

// Compound indexes for better query performance
ChainSessionSchema.index({
    clerkUserId: 1,
    status: 1
}, {
    name: 'user_status_idx',
    background: true
});

ChainSessionSchema.index({
    clerkUserId: 1,
    createdAt: -1
}, {
    name: 'user_created_idx',
    background: true
});

ChainSessionSchema.index({
    clerkUserId: 1,
    status: 1,
    startedAt: -1
}, {
    name: 'user_status_started_idx',
    background: true
});

// Sparse index for active sessions (most common query)
ChainSessionSchema.index({
    clerkUserId: 1,
    status: 1
}, {
    partialFilterExpression: { status: 'active' },
    name: 'active_sessions_idx',
    background: true
});

// TTL index for old abandoned sessions (cleanup after 90 days)
ChainSessionSchema.index({
    updatedAt: 1
}, {
    expireAfterSeconds: 60 * 60 * 24 * 90, // 90 days
    partialFilterExpression: { status: 'abandoned' },
    name: 'abandoned_cleanup_idx',
    background: true
});

// Pre-save middleware for validation and optimization
ChainSessionSchema.pre('save', function (next) {
    // Ensure currentHabitIndex is within bounds
    if (this.currentHabitIndex >= this.habits.length) {
        this.currentHabitIndex = this.habits.length - 1;
    }

    // Auto-complete if all habits are done
    const allHabitsCompleted = this.habits.every(h =>
        h.status === 'completed' || h.status === 'skipped'
    );

    if (allHabitsCompleted && this.status === 'active') {
        this.status = 'completed';
        this.completedAt = this.completedAt || new Date();
    }

    next();
});

// Instance methods for better encapsulation
ChainSessionSchema.methods.getCurrentHabit = function () {
    return this.habits[this.currentHabitIndex];
};

ChainSessionSchema.methods.getCompletionRate = function () {
    const completed = this.habits.filter((h: any) => h.status === 'completed').length;
    return completed / this.habits.length;
};

ChainSessionSchema.methods.getTotalElapsedTime = function () {
    if (!this.completedAt && !this.pausedAt) {
        return Math.floor((Date.now() - this.startedAt.getTime()) / 60000);
    }

    const endTime = this.completedAt || this.pausedAt || new Date();
    return Math.floor((endTime.getTime() - this.startedAt.getTime()) / 60000);
};

// Static methods for common queries
ChainSessionSchema.statics.findActiveSession = function (clerkUserId: string) {
    return this.findOne({
        clerkUserId,
        status: 'active'
    }).lean();
};

ChainSessionSchema.statics.findRecentSessions = function (clerkUserId: string, limit = 10) {
    return this.find({
        clerkUserId,
        status: { $in: ['completed', 'abandoned'] }
    })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
};

export const ChainSession = models.ChainSession ||
    model<IChainSession>('ChainSession', ChainSessionSchema);

// Export additional types for better TypeScript support
export interface IChainSessionHabit {
    habitId: string;
    habitName: string;
    duration: string;
    order: number;
    startedAt?: Date;
    completedAt?: Date;
    status: 'pending' | 'active' | 'completed' | 'skipped';
    notes?: string;
}

// Type for lean queries
export type LeanChainSession = Omit<IChainSession, '_id'> & { _id: string };

// Helper function to create session with validation
export async function createChainSession(sessionData: Partial<IChainSession>) {
    const session = new ChainSession(sessionData);
    await session.validate();
    return session;
}