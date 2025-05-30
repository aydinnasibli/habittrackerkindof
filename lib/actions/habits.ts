// lib/actions/habits.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/mongoose';
import { Habit } from '@/lib/models/Habit';
import { HabitChain } from '@/lib/models/HabitChain';
import { IHabit, IHabitChain, IHabitCompletion } from '@/lib/types';
import { Types, FlattenMaps } from 'mongoose';

type LeanHabit = FlattenMaps<IHabit> & { _id: Types.ObjectId };
type LeanHabitChain = FlattenMaps<IHabitChain> & { _id: Types.ObjectId };

export async function createHabit(formData: FormData) {
    try {
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

        const habit = new Habit(habitData);
        await habit.save();

        revalidatePath('/habits');
        return { success: true, id: habit._id.toString() };
    } catch (error) {
        console.error('Error creating habit:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create habit' };
    }
}

export async function getUserHabits(): Promise<IHabit[]> {
    try {
        const { userId } = await auth();

        if (!userId) {
            console.log('No authenticated user found');
            return [];
        }

        await connectToDatabase();

        const habits = await Habit
            .find({ clerkUserId: userId })
            .sort({ createdAt: -1 })
            .lean<LeanHabit[]>()
            .exec();

        if (!habits || !Array.isArray(habits)) {
            console.log('No habits found or invalid data structure');
            return [];
        }

        return habits.map(habit => ({
            _id: habit._id?.toString() || '',
            clerkUserId: habit.clerkUserId || '',
            name: habit.name || '',
            description: habit.description || '',
            category: habit.category || 'Health',
            frequency: habit.frequency || 'Daily',
            timeOfDay: habit.timeOfDay || 'Morning',
            timeToComplete: habit.timeToComplete || '5 minutes',
            priority: habit.priority || 'Medium',
            streak: habit.streak || 0,
            status: habit.status || 'active',
            completions: Array.isArray(habit.completions) ? habit.completions : [],
            createdAt: habit.createdAt || new Date(),
            updatedAt: habit.updatedAt || new Date(),
        })) as IHabit[];
    } catch (error) {
        console.error('Error fetching habits:', error);
        return [];
    }
}

export async function updateHabitStatus(habitId: string, status: 'active' | 'paused' | 'archived') {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        if (!Types.ObjectId.isValid(habitId)) {
            throw new Error('Invalid habit ID');
        }

        await connectToDatabase();

        const result = await Habit.updateOne(
            { _id: new Types.ObjectId(habitId), clerkUserId: userId },
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
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update habit status' };
    }
}

export async function completeHabit(habitId: string) {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        if (!Types.ObjectId.isValid(habitId)) {
            throw new Error('Invalid habit ID');
        }

        await connectToDatabase();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const habit = await Habit.findOne({
            _id: new Types.ObjectId(habitId),
            clerkUserId: userId
        }).lean<LeanHabit>();

        if (!habit) {
            throw new Error('Habit not found');
        }

        const completions = habit.completions || [];
        const alreadyCompleted = completions.some((completion: IHabitCompletion) => {
            const completionDate = new Date(completion.date);
            completionDate.setHours(0, 0, 0, 0);
            return completionDate.getTime() === today.getTime() && completion.completed;
        });

        if (alreadyCompleted) {
            throw new Error('Habit already completed today');
        }

        // Calculate new streak
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const wasCompletedYesterday = completions.some((completion: IHabitCompletion) => {
            const completionDate = new Date(completion.date);
            completionDate.setHours(0, 0, 0, 0);
            return completionDate.getTime() === yesterday.getTime() && completion.completed;
        });

        const newStreak = wasCompletedYesterday || habit.streak === 0 ? habit.streak + 1 : 1;

        const result = await Habit.updateOne(
            { _id: new Types.ObjectId(habitId), clerkUserId: userId },
            {
                $push: {
                    completions: {
                        date: today,
                        completed: true
                    }
                },
                $set: {
                    streak: newStreak,
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
        console.error('Error completing habit:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to complete habit' };
    }
}

export async function skipHabit(habitId: string) {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        if (!Types.ObjectId.isValid(habitId)) {
            throw new Error('Invalid habit ID');
        }

        await connectToDatabase();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Remove today's completion if it exists, instead of adding a false completion
        const result = await Habit.updateOne(
            { _id: new Types.ObjectId(habitId), clerkUserId: userId },
            {
                $pull: {
                    completions: {
                        date: {
                            $gte: today,
                            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                        }
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
        return { success: false, error: error instanceof Error ? error.message : 'Failed to skip habit' };
    }
}

export async function deleteHabit(habitId: string) {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        if (!Types.ObjectId.isValid(habitId)) {
            throw new Error('Invalid habit ID');
        }

        await connectToDatabase();

        const result = await Habit.deleteOne({
            _id: new Types.ObjectId(habitId),
            clerkUserId: userId
        });

        if (result.deletedCount === 0) {
            throw new Error('Habit not found or unauthorized');
        }

        revalidatePath('/habits');
        return { success: true };
    } catch (error) {
        console.error('Error deleting habit:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete habit' };
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
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        await connectToDatabase();

        const habitChain = new HabitChain({
            clerkUserId: userId,
            ...data
        });

        await habitChain.save();

        revalidatePath('/habits');
        return { success: true, id: habitChain._id.toString() };
    } catch (error) {
        console.error('Error creating habit chain:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create habit chain' };
    }
}

export async function getUserHabitChains(): Promise<IHabitChain[]> {
    try {
        const { userId } = await auth();

        if (!userId) {
            return [];
        }

        await connectToDatabase();

        const chains = await HabitChain
            .find({ clerkUserId: userId })
            .sort({ createdAt: -1 })
            .lean<LeanHabitChain[]>()
            .exec();

        return chains.map(chain => ({
            _id: chain._id?.toString() || '',
            clerkUserId: chain.clerkUserId,
            name: chain.name,
            description: chain.description,
            habits: chain.habits || [],
            timeOfDay: chain.timeOfDay,
            totalTime: chain.totalTime,
            createdAt: chain.createdAt || new Date(),
            updatedAt: chain.updatedAt || new Date(),
        })) as IHabitChain[];
    } catch (error) {
        console.error('Error fetching habit chains:', error);
        return [];
    }
}

export async function deleteHabitChain(chainId: string) {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        if (!Types.ObjectId.isValid(chainId)) {
            throw new Error('Invalid chain ID');
        }

        await connectToDatabase();

        const result = await HabitChain.deleteOne({
            _id: new Types.ObjectId(chainId),
            clerkUserId: userId
        });

        if (result.deletedCount === 0) {
            throw new Error('Habit chain not found or unauthorized');
        }

        revalidatePath('/habits');
        return { success: true };
    } catch (error) {
        console.error('Error deleting habit chain:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete habit chain' };
    }
}

export async function updateHabit(habitId: string, updateData: {
    name: string;
    description: string;
    category: string;
    frequency: string;
    timeOfDay: string;
    timeToComplete: string;
    priority: string;
}) {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        if (!Types.ObjectId.isValid(habitId)) {
            throw new Error('Invalid habit ID');
        }

        await connectToDatabase();

        const result = await Habit.updateOne(
            { _id: new Types.ObjectId(habitId), clerkUserId: userId },
            {
                ...updateData,
                updatedAt: new Date()
            }
        );

        if (result.matchedCount === 0) {
            throw new Error('Habit not found or unauthorized');
        }

        revalidatePath('/habits');
        return { success: true };
    } catch (error) {
        console.error('Error updating habit:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update habit' };
    }
}

// New function to get habit analytics
export async function getHabitAnalytics(days: number = 7) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return { totalHabits: 0, completionRate: 0, streakSum: 0, weeklyData: [] };
        }

        await connectToDatabase();

        const habits = await Habit.find({ clerkUserId: userId, status: 'active' }).lean();

        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days + 1);
        startDate.setHours(0, 0, 0, 0);

        const weeklyData = [];
        let totalCompletions = 0;
        let totalPossible = 0;

        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            date.setHours(0, 0, 0, 0);

            let dayCompletions = 0;
            let dayPossible = 0;

            habits.forEach(habit => {
                // Check if habit should be done on this day based on frequency
                const dayOfWeek = date.getDay();
                let shouldDoToday = false;

                switch (habit.frequency) {
                    case 'Daily':
                        shouldDoToday = true;
                        break;
                    case 'Weekdays':
                        shouldDoToday = dayOfWeek >= 1 && dayOfWeek <= 5;
                        break;
                    case 'Weekends':
                        shouldDoToday = dayOfWeek === 0 || dayOfWeek === 6;
                        break;
                    case 'Mon, Wed, Fri':
                        shouldDoToday = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
                        break;
                    case 'Tue, Thu':
                        shouldDoToday = dayOfWeek === 2 || dayOfWeek === 4;
                        break;
                }

                if (shouldDoToday) {
                    dayPossible++;
                    const completed = habit.completions?.some((completion: any) => {
                        const compDate = new Date(completion.date);
                        compDate.setHours(0, 0, 0, 0);
                        return compDate.getTime() === date.getTime() && completion.completed;
                    });
                    if (completed) dayCompletions++;
                }
            });

            weeklyData.push({
                date: date.toISOString().split('T')[0],
                completed: dayCompletions,
                total: dayPossible,
                rate: dayPossible > 0 ? Math.round((dayCompletions / dayPossible) * 100) : 0
            });

            totalCompletions += dayCompletions;
            totalPossible += dayPossible;
        }

        return {
            totalHabits: habits.length,
            completionRate: totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0,
            streakSum: habits.reduce((sum, habit) => sum + (habit.streak || 0), 0),
            weeklyData
        };
    } catch (error) {
        console.error('Error getting habit analytics:', error);
        return { totalHabits: 0, completionRate: 0, streakSum: 0, weeklyData: [] };
    }
}