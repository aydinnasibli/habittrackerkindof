// lib/models/Habit.ts
import mongoose, { Schema, model, models } from 'mongoose';
import { IHabit, IHabitCompletion } from '@/lib/types';
interface IHabitModel extends mongoose.Model<IHabit> {
    markCompleted(
        habitId: string,
        clerkUserId: string,
        date: Date,
        notes?: string,
        timeSpent?: number
    ): Promise<void>;
    getHabitsWithCompletions(
        clerkUserId: string,
        startDate: Date,
        endDate: Date,
        filters?: { status?: string; category?: string; priority?: string }
    ): Promise<IHabit[]>;
}
// NEW: Separate HabitCompletion model for better performance
const HabitCompletionSchema = new Schema({
    habitId: { type: Schema.Types.ObjectId, ref: 'Habit', required: true, index: true },
    clerkUserId: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    completed: { type: Boolean, required: true, index: true },
    notes: { type: String, maxlength: 500 },
    completedAt: { type: Date },
    timeSpent: { type: Number, min: 0 }
}, {
    collection: 'habit_completions',
    timestamps: false
});

// Optimized compound indexes
HabitCompletionSchema.index({
    habitId: 1,
    date: -1
}, {
    name: 'habit_completion_timeline',
    background: true
});

HabitCompletionSchema.index({
    clerkUserId: 1,
    date: -1,
    completed: 1
}, {
    name: 'user_completion_stats',
    background: true
});

// TTL index for automatic cleanup (optional - keep 2 years of data)
HabitCompletionSchema.index({
    date: 1
}, {
    expireAfterSeconds: 63072000, // 2 years
    name: 'completion_cleanup',
    background: true
});


const HabitSchema = new Schema<IHabit>({
    clerkUserId: { type: String, required: true, index: true },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
        index: 'text' // For text search
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    category: {
        type: String,
        required: true,
        enum: ['Mindfulness', 'Health', 'Learning', 'Productivity', 'Digital Wellbeing'],
        index: true
    },
    frequency: {
        type: String,
        required: true,
        enum: ['Daily', 'Weekdays', 'Weekends', 'Mon, Wed, Fri', 'Tue, Thu'],
        index: true
    },
    timeOfDay: {
        type: String,
        required: true,
        enum: ['Morning', 'Afternoon', 'Evening', 'Throughout day'],
        index: true
    },
    timeToComplete: { type: String, required: true },
    timeToCompleteMinutes: {
        type: Number,
        min: 1,
        index: true // For sorting by duration
    },
    priority: {
        type: String,
        required: true,
        enum: ['High', 'Medium', 'Low'],
        index: true
    },
    streak: {
        type: Number,
        default: 0,
        min: 0,
        index: true // For leaderboard queries
    },
    status: {
        type: String,
        enum: ['active', 'paused', 'archived'],
        default: 'active',
        index: true
    },
    completions: [{
        date: { type: Date, required: true },
        completed: { type: Boolean, required: true },
        notes: { type: String, maxlength: 500 },
        completedAt: { type: Date },
        timeSpent: { type: Number, min: 0 }
    }],
    completionStats: {
        total: { type: Number, default: 0 },
        thisWeek: { type: Number, default: 0 },
        thisMonth: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now }
    },
    // Performance cache fields
    lastCompletedAt: {
        type: Date,
        index: true // For "recently completed" queries
    },
    totalCompletions: {
        type: Number,
        default: 0,
        min: 0,
        index: true // For completion-based sorting
    },
    averageCompletionTime: {
        type: Number,
        min: 0 // in minutes
    }
}, {
    timestamps: true,
    // Optimize for common queries
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            // Remove sensitive or unnecessary fields from JSON output
            delete ret.__v;
            return ret;
        }
    }
});

// Compound indexes for common query patterns
HabitSchema.index({ clerkUserId: 1, status: 1, category: 1 });
HabitSchema.index({ clerkUserId: 1, status: 1, timeOfDay: 1 });
HabitSchema.index({ clerkUserId: 1, status: 1, priority: 1 });
HabitSchema.index({ clerkUserId: 1, lastCompletedAt: -1 }); // Recent activity
HabitSchema.index({ clerkUserId: 1, streak: -1 }); // Best streaks
HabitSchema.index({ clerkUserId: 1, totalCompletions: -1 }); // Most completed
HabitSchema.index({ clerkUserId: 1, createdAt: -1 }); // Recently created
HabitSchema.index({ clerkUserId: 1, 'completions.date': -1 }); // Recent completions

// Virtual for completion rate calculation
HabitSchema.virtual('completionRate').get(function () {
    if (this.completions.length === 0) return 0;
    const completedCount = this.completions.filter(c => c.completed).length;
    return Math.round((completedCount / this.completions.length) * 100);
});

// Virtual for current streak calculation
HabitSchema.virtual('currentStreak').get(function () {
    return this.streak;
});

// Pre-save middleware to update cache fields
HabitSchema.pre('save', function (next) {
    // Update totalCompletions
    this.totalCompletions = this.completions.filter(c => c.completed).length;

    // Update lastCompletedAt
    const lastCompletion = this.completions
        .filter(c => c.completed)
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

    if (lastCompletion) {
        this.lastCompletedAt = lastCompletion.completedAt || lastCompletion.date;
    }

    // Update averageCompletionTime
    const completionsWithTime = this.completions.filter(c => c.completed && c.timeSpent);
    if (completionsWithTime.length > 0) {
        const totalTime = completionsWithTime.reduce((sum, c) => sum + (c.timeSpent || 0), 0);
        this.averageCompletionTime = Math.round(totalTime / completionsWithTime.length);
    }

    // Parse timeToComplete to minutes for sorting/filtering
    if (this.timeToComplete && !this.timeToCompleteMinutes) {
        this.timeToCompleteMinutes = parseTimeToMinutes(this.timeToComplete);
    }

    next();
});

HabitSchema.statics.markCompleted = async function (
    habitId: string,
    clerkUserId: string,
    date: Date,
    notes?: string,
    timeSpent?: number
) {
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            // Create completion record
            await mongoose.model('HabitCompletion').create([{
                habitId,
                clerkUserId,
                date,
                completed: true,
                completedAt: new Date(),
                notes,
                timeSpent
            }], { session });

            // Update habit cache fields atomically
            await mongoose.model('Habit').findByIdAndUpdate(
                habitId,
                {
                    $inc: {
                        totalCompletions: 1,
                        'completionStats.total': 1
                    },
                    $set: {
                        lastCompletedAt: new Date(),
                        'completionStats.lastUpdated': new Date()
                    }
                },
                { session }
            );
        });
    } finally {
        await session.endSession();
    }
};


// Static method for getting habits with completion status for a date range
HabitSchema.statics.getHabitsWithCompletions = async function (
    clerkUserId: string,
    startDate: Date,
    endDate: Date,
    filters?: { status?: string; category?: string; priority?: string }
) {
    const query: any = {
        clerkUserId,
        status: filters?.status || 'active'
    };

    if (filters?.category) query.category = filters.category;
    if (filters?.priority) query.priority = filters.priority;

    return this.find(query)
        .select('name category priority timeOfDay timeToComplete streak totalCompletions completions')
        .lean() // Use lean() for better performance when you don't need full mongoose documents
        .exec();
};

// Utility function to parse time strings to minutes
function parseTimeToMinutes(timeStr: string): number {
    const matches = timeStr.match(/(\d+)\s*(min|minute|minutes|hr|hour|hours)/i);
    if (!matches) return 0;

    const value = parseInt(matches[1]);
    const unit = matches[2].toLowerCase();

    if (unit.startsWith('hr') || unit.startsWith('hour')) {
        return value * 60;
    }
    return value;
}

export const HabitCompletion = models.HabitCompletion || model('HabitCompletion', HabitCompletionSchema);
export const Habit = (models.Habit || model<IHabit, IHabitModel>('Habit', HabitSchema)) as IHabitModel;