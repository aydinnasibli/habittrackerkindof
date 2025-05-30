// lib/actions/habits.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/mongoose';
import { Habit } from '@/lib/models/Habit';
import { HabitChain } from '@/lib/models/HabitChain';
import { IHabit } from '@/lib/types';

export async function createHabit(formData: FormData) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('User not authenticated');
    }

    await connectToDatabase();

    const habitData = {
        clerkUserId: userId,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        category: formData.get('category') as string,
        frequency: formData.get('frequency') as string,
        timeOfDay: formData.get('timeOfDay') as string,
        timeToComplete: formData.get('timeToComplete') as string,
        priority: formData.get('priority') as string,
        streak: 0,
        status: 'active' as const,
        completions: []
    };

    try {
        const habit = new Habit(habitData);
        await habit.save();

        revalidatePath('/habits');
        return { success: true, id: habit._id.toString() };
    } catch (error) {
        console.error('Error creating habit:', error);
        throw new Error('Failed to create habit');
    }
}

export async function getUserHabits(): Promise<IHabit[]> {
    const { userId } = await auth();

    if (!userId) {
        return [];
    }

    await connectToDatabase();

    try {
        const habits = await Habit
            .find({ clerkUserId: userId })
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        return habits.map(habit => ({
            ...habit,
            _id: habit._id?.toString(),
            createdAt: habit.createdAt,
            updatedAt: habit.updatedAt,
        }));
    } catch (error) {
        console.error('Error fetching habits:', error);
        return [];
    }
}

export async function updateHabitStatus(habitId: string, status: 'active' | 'paused' | 'archived') {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('User not authenticated');
    }

    await connectToDatabase();

    try {
        const result = await Habit.updateOne(
            { _id: habitId, clerkUserId: userId },
            {
                status,
                updatedAt: new Date()
            }
        );

        if (result.matchedCount === 0) {
            throw new Error('Habit not found or unauthorized');
        }

        revalidatePath('/habits');
        return { success: true };
    } catch (error) {
        console.error('Error updating habit status:', error);
        throw new Error('Failed to update habit status');
    }
}

export async function completeHabit(habitId: string) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('User not authenticated');
    }

    await connectToDatabase();

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // First, get the current habit to check if already completed today
        const habit = await Habit.findOne({ _id: habitId, clerkUserId: userId });

        if (!habit) {
            throw new Error('Habit not found');
        }

        // Check if already completed today
        const alreadyCompleted = habit.completions.some(completion => {
            const completionDate = new Date(completion.date);
            completionDate.setHours(0, 0, 0, 0);
            return completionDate.getTime() === today.getTime() && completion.completed;
        });

        if (alreadyCompleted) {
            throw new Error('Habit already completed today');
        }

        // Add completion and increment streak
        const result = await Habit.updateOne(
            { _id: habitId, clerkUserId: userId },
            {
                $push: {
                    completions: {
                        date: today,
                        completed: true
                    }
                },
                $inc: { streak: 1 },
                $set: { updatedAt: new Date() }
            }
        );

        if (result.matchedCount === 0) {
            throw new Error('Habit not found or unauthorized');
        }

        revalidatePath('/habits');
        return { success: true };
    } catch (error) {
        console.error('Error completing habit:', error);
        throw new Error('Failed to complete habit');
    }
}

export async function skipHabit(habitId: string) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('User not authenticated');
    }

    await connectToDatabase();

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const result = await Habit.updateOne(
            { _id: habitId, clerkUserId: userId },
            {
                $push: {
                    completions: {
                        date: today,
                        completed: false
                    }
                },
                $set: {
                    streak: 0,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            throw new Error('Habit not found or unauthorized');
        }

        revalidatePath('/habits');
        return { success: true };
    } catch (error) {
        console.error('Error skipping habit:', error);
        throw new Error('Failed to skip habit');
    }
}

export async function deleteHabit(habitId: string) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('User not authenticated');
    }

    await connectToDatabase();

    try {
        const result = await Habit.deleteOne({ _id: habitId, clerkUserId: userId });

        if (result.deletedCount === 0) {
            throw new Error('Habit not found or unauthorized');
        }

        revalidatePath('/habits');
        return { success: true };
    } catch (error) {
        console.error('Error deleting habit:', error);
        throw new Error('Failed to delete habit');
    }
}

// Habit Chain Actions
export async function createHabitChain(data: {
    name: string;
    description: string;
    habits: { habitId: string; habitName: string; duration: string; order: number }[];
    timeOfDay: string;
    totalTime: string;
}) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('User not authenticated');
    }

    await connectToDatabase();

    try {
        const habitChain = new HabitChain({
            clerkUserId: userId,
            ...data
        });

        await habitChain.save();

        revalidatePath('/habits');
        return { success: true, id: habitChain._id.toString() };
    } catch (error) {
        console.error('Error creating habit chain:', error);
        throw new Error('Failed to create habit chain');
    }
}

export async function getUserHabitChains() {
    const { userId } = await auth();

    if (!userId) {
        return [];
    }

    await connectToDatabase();

    try {
        const chains = await HabitChain
            .find({ clerkUserId: userId })
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        return chains.map(chain => ({
            ...chain,
            _id: chain._id?.toString(),
            createdAt: chain.createdAt,
            updatedAt: chain.updatedAt,
        }));
    } catch (error) {
        console.error('Error fetching habit chains:', error);
        return [];
    }
}

export async function deleteHabitChain(chainId: string) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('User not authenticated');
    }

    await connectToDatabase();

    try {
        const result = await HabitChain.deleteOne({ _id: chainId, clerkUserId: userId });

        if (result.deletedCount === 0) {
            throw new Error('Habit chain not found or unauthorized');
        }

        revalidatePath('/habits');
        return { success: true };
    } catch (error) {
        console.error('Error deleting habit chain:', error);
        throw new Error('Failed to delete habit chain');
    }
}