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

// Helper function to get user's date in their timezone (consistent formatting)
function getUserDateInTimezone(timezone: string = 'UTC'): Date {
    try {
        const now = new Date();
        // Use consistent ISO date format (YYYY-MM-DD)
        const userDateString = now.toLocaleDateString('sv-SE', { timeZone: timezone });
        const userDate = new Date(userDateString + 'T00:00:00.000Z');
        return userDate;
    } catch (error) {
        console.error('Error getting user date in timezone:', error);
        // Fallback to UTC
        const now = new Date();
        const utcDateString = now.toISOString().split('T')[0];
        return new Date(utcDateString + 'T00:00:00.000Z');
    }
}

// Helper function to format date consistently for storage
function formatDateForStorage(date: Date): Date {
    const formatted = new Date(date);
    formatted.setUTCHours(0, 0, 0, 0);
    return formatted;
}

// Helper function to check if two dates are the same day in a specific timezone
function isSameDayInTimezone(date1: Date, date2: Date, timezone: string): boolean {
    try {
        // Use consistent formatting for both frontend and backend
        const date1String = date1.toLocaleDateString('sv-SE', { timeZone: timezone });
        const date2String = date2.toLocaleDateString('sv-SE', { timeZone: timezone });
        return date1String === date2String;
    } catch (error) {
        console.error('Error comparing dates in timezone:', error);
        // Fallback to UTC comparison
        const utcDate1 = new Date(date1);
        const utcDate2 = new Date(date2);
        utcDate1.setUTCHours(0, 0, 0, 0);
        utcDate2.setUTCHours(0, 0, 0, 0);
        return utcDate1.getTime() === utcDate2.getTime();
    }
}

// Helper function to get day of week in specific timezone (0 = Sunday, 1 = Monday, etc.)
function getDayOfWeekInTimezone(date: Date, timezone: string): number {
    try {
        // Create a date string in the user's timezone and parse it
        const dateString = date.toLocaleDateString('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const [month, day, year] = dateString.split('/');
        const userDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return userDate.getDay();
    } catch (error) {
        console.error('Error getting day of week in timezone:', error);
        // Fallback to UTC
        return date.getUTCDay();
    }
}

// Helper function to check if habit should be done on a specific day
function shouldDoHabitOnDay(frequency: string, dayOfWeek: number): boolean {
    switch (frequency) {
        case 'Daily':
            return true;
        case 'Weekdays':
            return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
        case 'Weekends':
            return dayOfWeek === 0 || dayOfWeek === 6; // Saturday and Sunday
        case 'Mon, Wed, Fri':
            return dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5; // Monday, Wednesday, Friday
        case 'Tue, Thu':
            return dayOfWeek === 2 || dayOfWeek === 4; // Tuesday, Thursday
        default:
            // Handle custom frequencies
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayName = dayNames[dayOfWeek];
            return frequency.toLowerCase().includes(dayName);
    }
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

export async function getUserHabits(timezone: string = 'UTC'): Promise<IHabit[]> {
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

export async function getHabitAnalytics(days: number = 7, timezone: string = 'UTC') {
    try {
        const { userId } = await auth();

        if (!userId) {
            return { totalHabits: 0, completionRate: 0, streakSum: 0, weeklyData: [] };
        }

        await connectToDatabase();

        const habits = await Habit.find({ clerkUserId: userId, status: 'active' }).lean();

        if (!habits || habits.length === 0) {
            return { totalHabits: 0, completionRate: 0, streakSum: 0, weeklyData: [] };
        }

        // Get the current date in user's timezone
        const endDateInUserTz = getUserDateInTimezone(timezone);
        const startDateInUserTz = new Date(endDateInUserTz);
        startDateInUserTz.setDate(startDateInUserTz.getDate() - days + 1);

        const weeklyData = [];
        let totalCompletions = 0;
        let totalPossible = 0;

        for (let i = 0; i < days; i++) {
            const date = new Date(startDateInUserTz);
            date.setDate(date.getDate() + i);

            let dayCompletions = 0;
            let dayPossible = 0;

            // Get the day of week for this date in the user's timezone
            const dayOfWeek = getDayOfWeekInTimezone(date, timezone);

            habits.forEach(habit => {
                const shouldDoToday = shouldDoHabitOnDay(habit.frequency, dayOfWeek);

                if (shouldDoToday) {
                    dayPossible++;

                    // Check if habit was completed on this day
                    const completed = habit.completions?.some((completion: any) => {
                        return completion.completed && isSameDayInTimezone(new Date(completion.date), date, timezone);
                    });

                    if (completed) {
                        dayCompletions++;
                    }
                }
            });

            weeklyData.push({
                date: date.toLocaleDateString('sv-SE', { timeZone: timezone }),
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

        // Get user's current date in their timezone
        const userDate = getUserDateInTimezone(timezone);
        const todayForStorage = formatDateForStorage(userDate);

        const habit = await Habit.findOne({
            _id: new Types.ObjectId(habitId),
            clerkUserId: userId
        }).lean<LeanHabit>();

        if (!habit) {
            throw new Error('Habit not found');
        }

        const completions = habit.completions || [];

        // Check if already completed today using timezone-aware comparison
        const alreadyCompleted = completions.some((completion: IHabitCompletion) => {
            return completion.completed && isSameDayInTimezone(new Date(completion.date), userDate, timezone);
        });

        if (alreadyCompleted) {
            throw new Error('Habit already completed today');
        }

        // Add today's completion to the completions array for streak calculation
        const updatedCompletions = [...completions, {
            date: todayForStorage,
            completed: true
        }];

        // Calculate new streak with today's completion included
        const newStreak = calculateStreakFromCompletions(updatedCompletions, userDate, timezone, habit.frequency);

        const result = await Habit.updateOne(
            { _id: new Types.ObjectId(habitId), clerkUserId: userId },
            {
                $push: {
                    completions: {
                        date: todayForStorage,
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

        // Get user's current date in their timezone
        const userDate = getUserDateInTimezone(timezone);

        const habit = await Habit.findOne({
            _id: new Types.ObjectId(habitId),
            clerkUserId: userId
        }).lean<LeanHabit>();

        if (!habit) {
            throw new Error('Habit not found');
        }

        const completions = habit.completions || [];

        // Check if habit was completed today using timezone-aware comparison
        const completedToday = completions.some((completion: IHabitCompletion) => {
            return completion.completed && isSameDayInTimezone(new Date(completion.date), userDate, timezone);
        });

        if (!completedToday) {
            throw new Error('Habit was not completed today');
        }

        // Remove today's completion
        const updatedCompletions = completions.filter((completion: IHabitCompletion) => {
            return !(completion.completed && isSameDayInTimezone(new Date(completion.date), userDate, timezone));
        });

        // Calculate new streak after removing today's completion
        const newStreak = calculateStreakFromCompletions(updatedCompletions, userDate, timezone, habit.frequency);

        // Update habit with filtered completions and new streak
        const result = await Habit.updateOne(
            { _id: new Types.ObjectId(habitId), clerkUserId: userId },
            {
                $set: {
                    completions: updatedCompletions,
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

// Helper function to calculate accurate streak with timezone awareness
function calculateStreakFromCompletions(
    completions: IHabitCompletion[],
    currentUserDate: Date,
    timezone: string,
    frequency: string
): number {
    if (!completions || completions.length === 0) {
        return 0;
    }

    // Filter completed habits and sort by date descending
    const validCompletions = completions
        .filter((completion: IHabitCompletion) => completion.completed)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (validCompletions.length === 0) {
        return 0;
    }

    let streak = 0;
    let checkDate = new Date(currentUserDate);

    // Check if today is completed first
    const todayCompleted = validCompletions.some(completion =>
        isSameDayInTimezone(new Date(completion.date), checkDate, timezone)
    );

    if (todayCompleted) {
        const todayDayOfWeek = getDayOfWeekInTimezone(checkDate, timezone);
        if (shouldDoHabitOnDay(frequency, todayDayOfWeek)) {
            streak = 1;
        }
    }

    // Start checking from yesterday if today is completed, or from today if not
    if (todayCompleted) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    // Check backwards day by day, but only count days when habit should be done
    for (let daysBack = 0; daysBack < 365; daysBack++) { // Max 365 days to prevent infinite loops
        const dayOfWeek = getDayOfWeekInTimezone(checkDate, timezone);
        const shouldDoOnThisDay = shouldDoHabitOnDay(frequency, dayOfWeek);

        if (shouldDoOnThisDay) {
            // Check if there's a completion for this day
            const hasCompletionForDate = validCompletions.some(completion =>
                isSameDayInTimezone(new Date(completion.date), checkDate, timezone)
            );

            if (hasCompletionForDate) {
                if (!todayCompleted || daysBack > 0) { // Don't double count today
                    streak++;
                }
            } else {
                break; // Streak is broken - habit should have been done but wasn't
            }
        }
        // If habit shouldn't be done on this day, continue checking previous days

        checkDate.setDate(checkDate.getDate() - 1); // Move to previous day
    }

    return streak;
}