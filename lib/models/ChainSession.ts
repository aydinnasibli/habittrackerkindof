// lib/models/ChainSession.ts
import mongoose, { Schema, model, models } from 'mongoose';
import { IChainSession } from '@/lib/types';

const ChainSessionHabitSchema = new Schema({
    habitId: { type: String, required: true },
    habitName: { type: String, required: true },
    duration: { type: String, required: true },
    order: { type: Number, required: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
    status: {
        type: String,
        enum: ['pending', 'active', 'completed', 'skipped'],
        default: 'pending'
    },
    notes: { type: String }
}, { _id: false });

const ChainSessionSchema = new Schema<IChainSession>({
    clerkUserId: { type: String, required: true, index: true },
    chainId: { type: String, required: true },
    chainName: { type: String, required: true },
    status: {
        type: String,
        enum: ['active', 'completed', 'abandoned'],
        default: 'active'
    },
    startedAt: { type: Date, required: true, default: Date.now },
    completedAt: { type: Date },
    currentHabitIndex: { type: Number, default: 0 },
    totalHabits: { type: Number, required: true },
    habits: [ChainSessionHabitSchema],
    totalDuration: { type: String, required: true },
    actualDuration: { type: Number }, // in minutes
    pausedAt: { type: Date },
    pauseDuration: { type: Number, default: 0 }, // total pause time in minutes
    breakStartedAt: { type: Date },
    onBreak: { type: Boolean, default: false }
}, {
    timestamps: true
});

ChainSessionSchema.index({ clerkUserId: 1, status: 1 });
ChainSessionSchema.index({ clerkUserId: 1, createdAt: -1 });

export const ChainSession = models.ChainSession || model<IChainSession>('ChainSession', ChainSessionSchema);

// Additional types for the chain session system
export interface IChainSession {
    _id?: string;
    clerkUserId: string;
    chainId: string;
    chainName: string;
    status: 'active' | 'completed' | 'abandoned';
    startedAt: Date;
    completedAt?: Date;
    currentHabitIndex: number;
    totalHabits: number;
    habits: IChainSessionHabit[];
    totalDuration: string;
    actualDuration?: number;
    pausedAt?: Date;
    pauseDuration: number;
    breakStartedAt?: Date;
    onBreak: boolean;
    createdAt: Date;
    updatedAt: Date;
}

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