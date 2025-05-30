// lib/actions/habits.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/mongoose';
import { Habit } from '@/lib/models/Habit';
import { HabitChain } from '@/lib/models/HabitChain';
import { IHabit, IHabitChain, IHabitCompletion } from '@/lib/types';
import { Types, FlattenMaps } from 'mongoose';



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
type LeanHabit = FlattenMaps<IHabit> & { _id: Types.ObjectId };
type LeanHabitChain = FlattenMaps<IHabitChain> & { _id: Types.ObjectId };

// Helper function to get user's local date string (YYYY-MM-DD format)
function getUserLocalDateString(timezone: string): string {
    const now = new Date();
    return now.toLocaleDateString('sv-SE', { timeZone: timezone }); // sv-SE gives YYYY-MM-DD format
}

// Helper function to get start and end of day in user's timezone
function getUserDayBounds(dateString: string, timezone: string) {
    const startOfDay = new Date(`${dateString}T00:00:00.000`);
    const endOfDay = new Date(`${dateString}T23:59:59.999`);

    // Convert to UTC for database storage
    const startUTC = new Date(startOfDay.toLocaleString('en-US', { timeZone: timezone }));
    const endUTC = new Date(endOfDay.toLocaleString('en-US', { timeZone: timezone }));

    return { startUTC, endUTC };
}

// Helper function to check if dates are the same day in user's timezone
function isSameDayInTimezone(date1: Date, date2: Date, timezone: string): boolean {
    const dateStr1 = date1.toLocaleDateString('sv-SE', { timeZone: timezone });
    const dateStr2 = date2.toLocaleDateString('sv-SE', { timeZone: timezone });
    return dateStr1 === dateStr2;
}

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

export async function getUserHabits(timezone?: string): Promise<IHabit[]> {
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

export async function completeHabit(habitId: string, timezone: string = 'UTC') {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        if (!Types.ObjectId.isValid(habitId)) {
            throw new Error('Invalid habit ID');
        }

        await connectToDatabase();

        const userToday = getUserLocalDateString(timezone);
        const { startUTC, endUTC } = getUserDayBounds(userToday, timezone);

        const habit = await Habit.findOne({
            _id: new Types.ObjectId(habitId),
            clerkUserId: userId
        }).lean<LeanHabit>();

        if (!habit) {
            throw new Error('Habit not found');
        }

        const completions = habit.completions || [];
        const alreadyCompleted = completions.some((completion: IHabitCompletion) => {
            return isSameDayInTimezone(new Date(completion.date), new Date(), timezone) && completion.completed;
        });

        if (alreadyCompleted) {
            throw new Error('Habit already completed today');
        }

        // Calculate new streak
        let newStreak = 1;

        // Check if habit was completed yesterday in user's timezone
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayString = yesterdayDate.toLocaleDateString('sv-SE', { timeZone: timezone });

        const completedYesterday = completions.some((completion: IHabitCompletion) => {
            const completionDateString = new Date(completion.date).toLocaleDateString('sv-SE', { timeZone: timezone });
            return completionDateString === yesterdayString && completion.completed;
        });

        if (completedYesterday && habit.streak > 0) {
            newStreak = habit.streak + 1;
        } else {
            newStreak = 1; // Start new streak
        }

        // Use current time but we'll track which day it belongs to in user's timezone
        const completionDate = new Date();

        const result = await Habit.updateOne(
            { _id: new Types.ObjectId(habitId), clerkUserId: userId },
            {
                $push: {
                    completions: {
                        date: completionDate,
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
        return { success: true, newStreak };
    } catch (error) {
        console.error('Error completing habit:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to complete habit' };
    }
}

export async function skipHabit(habitId: string, timezone: string = 'UTC') {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        if (!Types.ObjectId.isValid(habitId)) {
            throw new Error('Invalid habit ID');
        }

        await connectToDatabase();

        const userToday = getUserLocalDateString(timezone);

        const habit = await Habit.findOne({
            _id: new Types.ObjectId(habitId),
            clerkUserId: userId
        }).lean<LeanHabit>();

        if (!habit) {
            throw new Error('Habit not found');
        }

        const completions = habit.completions || [];

        // Check if habit was completed today in user's timezone
        const completedToday = completions.some((completion: IHabitCompletion) => {
            return isSameDayInTimezone(new Date(completion.date), new Date(), timezone) && completion.completed;
        });

        if (!completedToday) {
            throw new Error('Habit was not completed today');
        }

        // Calculate new streak after removing today's completion
        const completionsWithoutToday = completions.filter((completion: IHabitCompletion) => {
            return !isSameDayInTimezone(new Date(completion.date), new Date(), timezone) && completion.completed;
        });

        const newStreak = calculateStreakFromCompletions(completionsWithoutToday, timezone);

        // Remove today's completion
        const result = await Habit.updateOne(
            { _id: new Types.ObjectId(habitId), clerkUserId: userId },
            {
                $pull: {
                    completions: {
                        date: {
                            $gte: new Date(new Date().toLocaleDateString('sv-SE', { timeZone: timezone }) + 'T00:00:00.000Z'),
                            $lt: new Date(new Date().toLocaleDateString('sv-SE', { timeZone: timezone }) + 'T23:59:59.999Z')
                        }
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
        return { success: true, newStreak };
    } catch (error) {
        console.error('Error skipping habit:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to skip habit' };
    }
}

export async function getHabitAnalytics(days: number = 7, timezone: string = 'UTC') {
    try {
        const { userId } = await auth();

        if (!userId) {
            return { totalHabits: 0, completionRate: 0, streakSum: 0, weeklyData: [] };
        }

        await connectToDatabase();

        const habits = await Habit.find({ clerkUserId: userId, status: 'active' }).lean();

        const weeklyData = [];
        let totalCompletions = 0;
        let totalPossible = 0;

        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toLocaleDateString('sv-SE', { timeZone: timezone });

            let dayCompletions = 0;
            let dayPossible = 0;

            habits.forEach(habit => {
                // Check if habit should be done on this day based on frequency
                const dayOfWeek = new Date(dateString + 'T12:00:00').getDay();
                let shouldDoToday = shouldShowForDay(habit.frequency, dayOfWeek);

                if (shouldDoToday) {
                    dayPossible++;
                    const completed = habit.completions?.some((completion: any) => {
                        const completionDateString = new Date(completion.date).toLocaleDateString('sv-SE', { timeZone: timezone });
                        return completionDateString === dateString && completion.completed;
                    });
                    if (completed) dayCompletions++;
                }
            });

            weeklyData.push({
                date: dateString,
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
            weeklyData: weeklyData.reverse() // Show chronologically
        };
    } catch (error) {
        console.error('Error getting habit analytics:', error);
        return { totalHabits: 0, completionRate: 0, streakSum: 0, weeklyData: [] };
    }
}

// Helper function to check if habit should show for a specific day
function shouldShowForDay(frequency: string, dayOfWeek: number): boolean {
    switch (frequency) {
        case 'Daily':
            return true;
        case 'Weekdays':
            return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
        case 'Weekends':
            return dayOfWeek === 0 || dayOfWeek === 6; // Saturday and Sunday
        case 'Mon, Wed, Fri':
            return dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
        case 'Tue, Thu':
            return dayOfWeek === 2 || dayOfWeek === 4;
        default:
            return true;
    }
}

// Helper function to calculate streak considering timezone
function calculateStreakFromCompletions(completions: IHabitCompletion[], timezone: string): number {
    if (!completions || completions.length === 0) return 0;

    // Group completions by date in user's timezone
    const completionsByDate = new Map<string, boolean>();

    completions.forEach(completion => {
        if (completion.completed) {
            const dateString = new Date(completion.date).toLocaleDateString('sv-SE', { timeZone: timezone });
            completionsByDate.set(dateString, true);
        }
    });

    if (completionsByDate.size === 0) return 0;

    let streak = 0;
    const today = new Date();

    // Start from yesterday and work backwards
    for (let i = 1; i <= 365; i++) { // Max reasonable streak
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateString = checkDate.toLocaleDateString('sv-SE', { timeZone: timezone });

        if (completionsByDate.has(dateString)) {
            streak++;
        } else {
            break; // Streak is broken
        }
    }

    return streak;
}

// Keep other existing functions unchanged...
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

// Habit Chain functions remain the same...
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