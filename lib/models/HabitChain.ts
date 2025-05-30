// lib/models/HabitChain.ts
import mongoose, { Schema, model, models } from 'mongoose';
import { IHabitChain } from '@/lib/types';

const HabitChainItemSchema = new Schema({
    habitId: { type: String, required: true },
    habitName: { type: String, required: true },
    duration: { type: String, required: true },
    order: { type: Number, required: true }
}, { _id: false });

const HabitChainSchema = new Schema<IHabitChain>({
    clerkUserId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    habits: [HabitChainItemSchema],
    timeOfDay: { type: String, required: true },
    totalTime: { type: String, required: true }
}, {
    timestamps: true
});

HabitChainSchema.index({ clerkUserId: 1, createdAt: -1 });

export const HabitChain = models.HabitChain || model<IHabitChain>('HabitChain', HabitChainSchema);