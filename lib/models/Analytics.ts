import mongoose from 'mongoose';

const AnalyticsSchema = new mongoose.Schema({
    clerkUserId: { type: String, required: true, index: true },
    period: { type: String, required: true }, // 'weekly', 'monthly'
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    // Core metrics
    metrics: {
        totalHabits: { type: Number, default: 0 },
        activeHabits: { type: Number, default: 0 },
        completionRate: { type: Number, default: 0 },
        averageStreak: { type: Number, default: 0 },
        longestStreak: { type: Number, default: 0 },
        totalCompletions: { type: Number, default: 0 },
        consistencyScore: { type: Number, default: 0 },
        motivationScore: { type: Number, default: 0 },
        diversityScore: { type: Number, default: 0 }
    },

    // Daily breakdown
    dailyData: [{
        date: Date,
        completed: Number,
        total: Number,
        percentage: Number,
        newHabits: Number
    }],

    // Category insights
    categoryInsights: [{
        name: String,
        value: Number,
        percentage: Number,
        completionRate: Number,
        averageStreak: Number,
        trend: { type: String, enum: ['up', 'down', 'stable'] },
        trendValue: Number
    }],

    // Habit performance
    habitPerformance: [{
        habitId: String,
        name: String,
        category: String,
        completionRate: Number,
        currentStreak: Number,
        longestStreak: Number,
        consistency: Number,
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'] }
    }],

    // Time patterns
    timePatterns: [{
        timeSlot: String,
        completionRate: Number,
        totalHabits: Number
    }],

    // Streak analysis
    streakData: [{
        habitName: String,
        currentStreak: Number,
        longestStreak: Number,
        streakHistory: [Number]
    }],

    // AI insights cache
    aiInsights: [{
        type: { type: String, enum: ['success', 'warning', 'tip', 'achievement'] },
        title: String,
        description: String,
        action: String,
        priority: { type: String, enum: ['high', 'medium', 'low'] },
        generatedAt: Date
    }],

    // Metadata
    lastUpdated: { type: Date, default: Date.now },
    version: { type: String, default: '1.0' },
    dataHash: String // Hash of habit data to detect changes
}, {
    timestamps: true
});

// Compound indexes for efficient queries
AnalyticsSchema.index({ clerkUserId: 1, period: 1, startDate: -1 });
AnalyticsSchema.index({ clerkUserId: 1, lastUpdated: -1 });

export const Analytics = mongoose.models.Analytics || mongoose.model('Analytics', AnalyticsSchema);