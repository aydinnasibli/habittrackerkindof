// lib/models/Habit.ts
import mongoose, { Schema, model, models } from 'mongoose';
import { IHabit, IHabitCompletion } from '@/lib/types';

const HabitCompletionSchema = new Schema<IHabitCompletion>({
    date: { type: Date, required: true },
    completed: { type: Boolean, required: true },
    notes: { type: String }
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
    completions: [HabitCompletionSchema]
}, {
    timestamps: true
});

// Create indexes
HabitSchema.index({ clerkUserId: 1, status: 1 });
HabitSchema.index({ clerkUserId: 1, createdAt: -1 });
// Add this at the bottom of your Habit.ts file
HabitSchema.index({ clerkUserId: 1, status: 1, createdAt: -1 });
HabitSchema.index({ clerkUserId: 1, 'completions.date': -1 }, { sparse: true });
export const Habit = models.Habit || model<IHabit>('Habit', HabitSchema);
