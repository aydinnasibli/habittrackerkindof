// lib/models/ChainSession.ts - Production Optimized
import mongoose, { Schema, model, models, Document } from 'mongoose';
import { IChainSession, IChainSessionHabit } from '@/lib/types';

const ChainSessionHabitSchema = new Schema({
    habitId: { type: String, required: true, index: true },
    habitName: { type: String, required: true, maxlength: 100 },
    duration: { type: String, required: true, maxlength: 20 },
    durationMinutes: { type: Number, min: 1, max: 480, index: true }, // Index for time-based queries
    order: { type: Number, required: true, min: 0 },
    startedAt: { type: Date, sparse: true }, // Sparse index for optional dates
    completedAt: { type: Date, sparse: true },
    status: {
        type: String,
        enum: ['pending', 'active', 'completed', 'skipped'],
        default: 'pending',
        index: true
    },
    notes: { type: String, maxlength: 500 },
    timeSpent: { type: Number, min: 0, max: 480 }
}, {
    _id: false,
    // Optimize subdocument queries
    optimisticConcurrency: true
});

const ChainSessionSchema = new Schema<IChainSession>({
    clerkUserId: { type: String, required: true, index: true },
    chainId: { type: String, required: true, index: true },
    chainName: { type: String, required: true, maxlength: 100 },
    status: {
        type: String,
        enum: ['active', 'completed', 'abandoned'],
        default: 'active',
        index: true
    },
    startedAt: { type: Date, required: true, default: Date.now, index: true },
    completedAt: { type: Date, sparse: true }, // Sparse index for completed sessions only
    currentHabitIndex: { type: Number, default: 0, min: 0 },
    totalHabits: { type: Number, required: true, min: 1, max: 20 },
    habits: {
        type: [ChainSessionHabitSchema],
        required: true,
        validate: {
            validator: function (habits: IChainSessionHabit[]) {
                return habits.length > 0 && habits.length <= 20;
            },
            message: 'Chain must have between 1 and 20 habits'
        }
    },
    totalDuration: { type: String, required: true, maxlength: 30 },
    totalDurationMinutes: { type: Number, min: 1, max: 600, index: true }, // Index for duration queries
    actualDuration: { type: Number, min: 0, max: 600 },
    pausedAt: { type: Date, sparse: true },
    pauseDuration: { type: Number, default: 0, min: 0, max: 300 },
    breakStartedAt: { type: Date, sparse: true },
    onBreak: { type: Boolean, default: false, index: true },
    // Performance optimization fields
    completionRate: { type: Number, min: 0, max: 100, index: true }, // Index for leaderboards
    xpEarned: { type: Number, min: 0, default: 0, index: true }, // Index for XP queries
    // Additional performance fields
    isActive: { type: Boolean, default: true, index: true },
    lastActivityAt: { type: Date, default: Date.now, index: true },
    // Denormalized fields for faster queries
    completedHabitsCount: { type: Number, default: 0, min: 0 }, // Cache completed count
    dayOfWeek: { type: Number, min: 0, max: 6 }, // Cache for analytics (0=Sunday)
    hourOfDay: { type: Number, min: 0, max: 23 }, // Cache for time-based analytics
}, {
    timestamps: true,
    // Production optimizations
    optimisticConcurrency: true, // Enable versioning for concurrent updates
    selectPopulatedPaths: false, // Don't auto-select populated paths
    minimize: false, // Keep empty objects for consistency
    // Optimize JSON output
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            delete ret.__v;
            delete ret.dayOfWeek; // Hide internal cache fields
            delete ret.hourOfDay;
            return ret;
        }
    },
    toObject: {
        virtuals: true
    }
});

ChainSessionSchema.index({
    clerkUserId: 1,
    status: 1,
    lastActivityAt: -1
}, {
    name: 'user_status_activity',
    background: true
});

ChainSessionSchema.index({
    clerkUserId: 1,
    completedAt: -1
}, {
    partialFilterExpression: { status: 'completed' },
    name: 'user_completed_sessions',
    background: true
});

ChainSessionSchema.index({
    completionRate: -1,
    xpEarned: -1
}, {
    partialFilterExpression: { status: 'completed' },
    name: 'leaderboard_performance',
    background: true
});



// Virtual for session duration calculation (cached for performance)
ChainSessionSchema.virtual('sessionDuration').get(function () {
    if (this.completedAt && this.startedAt) {
        const totalMinutes = Math.round((this.completedAt.getTime() - this.startedAt.getTime()) / (1000 * 60));
        return Math.max(0, totalMinutes - this.pauseDuration);
    }
    return null;
});

// Virtual for progress percentage (uses cached completedHabitsCount)
ChainSessionSchema.virtual('progressPercentage').get(function () {
    return Math.round((this.completedHabitsCount / this.totalHabits) * 100);
});

// Utility function to parse time strings to minutes (optimized)
const TIME_CACHE = new Map<string, number>();
function parseTimeToMinutes(timeStr: string): number {
    if (TIME_CACHE.has(timeStr)) {
        return TIME_CACHE.get(timeStr)!;
    }

    const matches = timeStr.match(/(\d+)\s*(min|minute|minutes|hr|hour|hours)/i);
    if (!matches) {
        TIME_CACHE.set(timeStr, 0);
        return 0;
    }

    const value = parseInt(matches[1]);
    const unit = matches[2].toLowerCase();
    const minutes = unit.startsWith('hr') || unit.startsWith('hour') ? value * 60 : value;

    TIME_CACHE.set(timeStr, minutes);
    return minutes;
}
// Utility function to parse time strings to minutes (optimized)
const TIME_CACHE = new Map<string, number>();
function parseTimeToMinutes(timeStr: string): number {
    if (TIME_CACHE.has(timeStr)) {
        return TIME_CACHE.get(timeStr)!;
    }

    const matches = timeStr.match(/(\d+)\s*(min|minute|minutes|hr|hour|hours)/i);
    if (!matches) {
        TIME_CACHE.set(timeStr, 0);
        return 0;
    }

    const value = parseInt(matches[1]);
    const unit = matches[2].toLowerCase();
    const minutes = unit.startsWith('hr') || unit.startsWith('hour') ? value * 60 : value;

    TIME_CACHE.set(timeStr, minutes);
    return minutes;
}

// Pre-save middleware with performance optimizations
ChainSessionSchema.pre('save', function (next) {
    // Pre-save middleware with performance optimizations
    ChainSessionSchema.pre('save', function (next) {
        const now = new Date();

        // Cache duration in minutes for habits (only if missing)
        this.habits.forEach(habit => {
            if (!habit.durationMinutes && habit.duration) {
                habit.durationMinutes = parseTimeToMinutes(habit.duration);
            }
        });

        // Cache total duration in minutes (only if missing)
        if (!this.totalDurationMinutes && this.totalDuration) {
            this.totalDurationMinutes = parseTimeToMinutes(this.totalDuration);
        }

        // Calculate and cache completed habits count
        this.completedHabitsCount = this.habits.filter(h => h.status === 'completed').length;

        // Calculate completion rate from cached count
        this.completionRate = Math.round((this.completedHabitsCount / this.totalHabits) * 100);

        // Update isActive flag
        this.isActive = this.status === 'active';

        // Cache time-based analytics fields
        if (this.isNew || this.isModified('startedAt')) {
            this.dayOfWeek = this.startedAt.getDay();
            this.hourOfDay = this.startedAt.getHours();
        }

        // Update last activity timestamp only when necessary
        if (this.isModified('currentHabitIndex') || this.isModified('habits') || this.isModified('status')) {
            this.lastActivityAt = now;
        }

        // Calculate actual duration for completed sessions (only once)
        if (this.status === 'completed' && this.completedAt && this.startedAt && !this.actualDuration) {
            this.actualDuration = Math.round((this.completedAt.getTime() - this.startedAt.getTime()) / (1000 * 60)) - this.pauseDuration;
        }

        // Validate and fix habit order consistency
        this.habits.forEach((habit, index) => {
            if (habit.order !== index) {
                habit.order = index;
            }
        });

        next();
    });

    // OPTIMIZED STATIC METHODS

    ChainSessionSchema.statics.createSession = async function (
        clerkUserId: string,
        chainId: string,
        chainName: string,
        habits: Omit<IChainSessionHabit, 'status' | 'order'>[]
    ) {
        const sessionHabits = habits.map((habit, index) => ({
            ...habit,
            order: index,
            status: 'pending' as const,
            durationMinutes: parseTimeToMinutes(habit.duration)
        }));

        const totalDurationMinutes = sessionHabits.reduce((sum, habit) => sum + (habit.durationMinutes || 0), 0);
        const totalDuration = totalDurationMinutes >= 60
            ? `${Math.floor(totalDurationMinutes / 60)}hr ${totalDurationMinutes % 60}min`
            : `${totalDurationMinutes}min`;

        const now = new Date();
        return this.create({
            clerkUserId,
            chainId,
            chainName,
            habits: sessionHabits,
            totalHabits: habits.length,
            totalDuration,
            totalDurationMinutes,
            status: 'active',
            isActive: true,
            lastActivityAt: now,
            completedHabitsCount: 0,
            dayOfWeek: now.getDay(),
            hourOfDay: now.getHours()
        });
    };

    ChainSessionSchema.statics.getActiveSession = function (clerkUserId: string) {
        return this.findOne({
            clerkUserId,
            status: 'active'
        })
            .select('-habits.notes -__v') // Exclude heavy fields for list queries
            .lean({ virtuals: true });
    };

    ChainSessionSchema.statics.getUserSessions = function (
        clerkUserId: string,
        options: { page?: number; limit?: number; status?: string } = {}
    ) {
        const { page = 1, limit = 20, status } = options;
        const skip = (page - 1) * limit;

        const query: any = { clerkUserId };
        if (status) query.status = status;

        return this.find(query)
            .select('-habits.notes -__v')
            .sort({ startedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean({ virtuals: true });
    };

    ChainSessionSchema.statics.startHabit = async function (sessionId: string, habitIndex: number) {
        const now = new Date();

        // Use findByIdAndUpdate for atomic operation
        const session = await this.findByIdAndUpdate(
            sessionId,
            {
                $set: {
                    [`habits.${habitIndex}.status`]: 'active',
                    [`habits.${habitIndex}.startedAt`]: now,
                    currentHabitIndex: habitIndex,
                    lastActivityAt: now
                }
            },
            { new: true, runValidators: true }
        );

        if (!session) throw new Error('Session not found');
        if (habitIndex >= session.habits.length) throw new Error('Invalid habit index');

        return session;
    };

    ChainSessionSchema.statics.completeHabit = async function (
        sessionId: string,
        habitIndex: number,
        notes?: string,
        timeSpent?: number
    ) {
        const session = await this.findById(sessionId);
        if (!session) throw new Error('Session not found');
        if (habitIndex >= session.habits.length) throw new Error('Invalid habit index');

        const now = new Date();

        // Complete current habit
        const habit = session.habits[habitIndex];
        habit.status = 'completed';
        habit.completedAt = now;
        if (notes) habit.notes = notes;
        if (timeSpent !== undefined) habit.timeSpent = timeSpent;

        // Update cached completed count
        session.completedHabitsCount = session.habits.filter(h => h.status === 'completed' || h.status === 'skipped').length;

        // Check if all habits are completed
        const allCompleted = session.habits.every(h => h.status === 'completed' || h.status === 'skipped');
        if (allCompleted) {
            session.status = 'completed';
            session.completedAt = now;
            session.isActive = false;
        } else {
            // Move to next habit
            const nextIndex = session.habits.findIndex((h, i) => i > habitIndex && h.status === 'pending');
            if (nextIndex !== -1) {
                session.currentHabitIndex = nextIndex;
            }
        }

        session.lastActivityAt = now;
        return session.save();
    };

    ChainSessionSchema.statics.getSessionStats = function (clerkUserId: string, days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return this.aggregate([
            {
                $match: {
                    clerkUserId,
                    startedAt: { $gte: startDate }
                }
            },
            {
                $facet: {
                    sessionStats: [
                        {
                            $group: {
                                _id: null,
                                totalSessions: { $sum: 1 },
                                completedSessions: {
                                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                                },
                                avgCompletionRate: { $avg: '$completionRate' },
                                totalXPEarned: { $sum: '$xpEarned' },
                                avgDuration: { $avg: '$actualDuration' },
                                bestCompletionRate: { $max: '$completionRate' },
                                totalTimeSpent: { $sum: '$actualDuration' }
                            }
                        }
                    ],
                    dailyBreakdown: [
                        {
                            $group: {
                                _id: { $dayOfYear: '$startedAt' },
                                sessionsCount: { $sum: 1 },
                                completedCount: {
                                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                                }
                            }
                        },
                        { $sort: { '_id': -1 } },
                        { $limit: days }
                    ]
                }
            }
        ]).allowDiskUse(true);
    };

    ChainSessionSchema.statics.getTopPerformers = function (days: number = 7, limit: number = 10) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return this.aggregate([
            {
                $match: {
                    completedAt: { $gte: startDate },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: '$clerkUserId',
                    totalSessions: { $sum: 1 },
                    avgCompletionRate: { $avg: '$completionRate' },
                    totalXP: { $sum: '$xpEarned' },
                    bestSession: { $max: '$completionRate' }
                }
            },
            {
                $sort: { totalXP: -1, avgCompletionRate: -1 }
            },
            {
                $limit: limit
            }
        ]).allowDiskUse(true);
    };

    ChainSessionSchema.statics.cleanupAbandonedSessions = async function (hoursOld: number = 24) {
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - hoursOld);

        try {
            const result = await this.updateMany(
                {
                    status: 'active',
                    lastActivityAt: { $lt: cutoffDate }
                },
                {
                    $set: {
                        status: 'abandoned',
                        isActive: false,
                        completedAt: new Date() // Set completion time for abandoned sessions
                    }
                }
            );

            console.log(`Cleaned up ${result.modifiedCount} abandoned sessions`);
            return result;
        } catch (error) {
            console.error('Error cleaning up abandoned sessions:', error);
            throw error;
        }
    };

    // Performance monitoring method
    ChainSessionSchema.statics.getPerformanceMetrics = function () {
        return this.aggregate([
            {
                $facet: {
                    totalSessions: [{ $count: 'count' }],
                    activeSessions: [
                        { $match: { status: 'active' } },
                        { $count: 'count' }
                    ],
                    avgSessionDuration: [
                        { $match: { actualDuration: { $exists: true } } },
                        { $group: { _id: null, avg: { $avg: '$actualDuration' } } }
                    ],
                    popularChains: [
                        { $group: { _id: '$chainId', count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 5 }
                    ]
                }
            }
        ]);
    };
    // Add this method before the export
    ChainSessionSchema.methods.calculateXP = function () {
        if (this.status !== 'completed') return 0;

        let totalXP = 0;
        const completedHabits = this.habits.filter(h => h.status === 'completed');

        // Individual habit XP
        completedHabits.forEach(habit => {
            // Assuming priority is stored in habit metadata or default to medium
            totalXP += 25; // Base XP per completed habit
        });

        // Chain completion bonus
        if (this.completionRate >= 100) {
            totalXP += 100 + (this.totalHabits * 15); // Perfect completion bonus
        } else if (this.completionRate >= 80) {
            totalXP += 60 + (completedHabits.length * 10); // Good completion bonus
        } else if (this.completionRate >= 50) {
            totalXP += 30 + (completedHabits.length * 5); // Partial completion bonus
        }

        this.xpEarned = totalXP;
        return totalXP;
    };
    export const ChainSession = models.ChainSession || model<IChainSession>('ChainSession', ChainSessionSchema);