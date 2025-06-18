// lib/models/Habit.ts
import mongoose, { Schema, model, models } from 'mongoose';
import { IHabit, IHabitCompletion, IHabitFeedback } from '@/lib/types';

const HabitCompletionSchema = new Schema<IHabitCompletion>({
    date: { type: Date, required: true },
    completed: { type: Boolean, required: true },
    notes: { type: String }
}, { _id: false });

const HabitFeedbackSchema = new Schema<IHabitFeedback>({
    date: { type: Date, required: true },
    feedback: { type: String, required: true, maxlength: 500 },
    completed: { type: Boolean, required: true }, // Whether habit was completed that day
    mood: {
        type: String,
        enum: ['very_negative', 'negative', 'neutral', 'positive', 'very_positive'],
        default: 'neutral'
    },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const HabitSchema = new Schema<IHabit>({
    clerkUserId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
        type: String,
        required: true,
        enum: ['Mindfulness', 'Health', 'Learning', 'Productivity', 'Digital Wellbeing']
    },
    frequency: {
        type: String,
        required: true,
        enum: ['Daily', 'Weekdays', 'Weekends', 'Mon, Wed, Fri', 'Tue, Thu']
    },
    timeOfDay: {
        type: String,
        required: true,
        enum: ['Morning', 'Afternoon', 'Evening', 'Throughout day']
    },
    timeToComplete: { type: String, required: true },
    priority: {
        type: String,
        required: true,
        enum: ['High', 'Medium', 'Low']
    },
    streak: { type: Number, default: 0, min: 0 },
    status: {
        type: String,
        enum: ['active', 'paused', 'archived'],
        default: 'active'
    },
    // AI-generated impact score
    impactScore: {
        type: Number,
        required: true,
        min: 1,
        max: 10,
        default: 5
    },
    completions: [HabitCompletionSchema],
    // New feedback system - stores last 90 entries
    feedbacks: {
        type: [HabitFeedbackSchema],
        validate: {
            validator: function (feedbacks: IHabitFeedback[]) {
                return feedbacks.length <= 90;
            },
            message: 'Cannot store more than 90 feedback entries per habit'
        },
        default: []
    }
}, {
    timestamps: true
});

// Create indexes
HabitSchema.index({ clerkUserId: 1, status: 1 });
HabitSchema.index({ clerkUserId: 1, createdAt: -1 });
HabitSchema.index({ clerkUserId: 1, status: 1, createdAt: -1 });
HabitSchema.index({ clerkUserId: 1, 'completions.date': -1 }, { sparse: true });
HabitSchema.index({ clerkUserId: 1, impactScore: -1 });
// Index for feedback queries
HabitSchema.index({ clerkUserId: 1, 'feedbacks.date': -1 }, { sparse: true });

export const Habit = models.Habit || model<IHabit>('Habit', HabitSchema);