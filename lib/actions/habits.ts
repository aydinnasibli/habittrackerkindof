// lib/actions/habits.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/mongoose';
import { Habit } from '@/lib/models/Habit';
import { HabitChain } from '@/lib/models/HabitChain';
import { IHabit, IHabitChain, IHabitCompletion } from '@/lib/types';
import { Types, FlattenMaps } from 'mongoose';
// Add this import at the top
import { awardXP, checkStreakMilestone, checkDailyBonus } from './xpSystem';
import { updateProfileStats } from './profile';
type LeanHabit = FlattenMaps<IHabit> & { _id: Types.ObjectId };
type LeanHabitChain = FlattenMaps<IHabitChain> & { _id: Types.ObjectId };

// Simplified date handling - always use YYYY-MM-DD format
function getDateString(date: Date, timezone: string = 'UTC'): string {
    try {
        return date.toLocaleDateString('sv-SE', { timeZone: timezone });
    } catch {
        return date.toISOString().split('T')[0];
    }
}

function getTodayString(timezone: string = 'UTC'): string {
    return getDateString(new Date(), timezone);
}

function getYesterdayString(timezone: string = 'UTC'): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return getDateString(yesterday, timezone);
}

// Get day of week (0 = Sunday, 1 = Monday, etc.)
function getDayOfWeek(dateString: string): number {
    const date = new Date(dateString + 'T12:00:00.000Z'); // Use noon to avoid timezone issues
    return date.getUTCDay();
}

// Check if habit should be done on specific day
function shouldDoHabitOnDay(frequency: string, dayOfWeek: number): boolean {
    switch (frequency) {
        case 'Daily':
            return true;
        case 'Weekdays':
            return dayOfWeek >= 1 && dayOfWeek <= 5;
        case 'Weekends':
            return dayOfWeek === 0 || dayOfWeek === 6;
        case 'Mon, Wed, Fri':
            return [1, 3, 5].includes(dayOfWeek);
        case 'Tue, Thu':
            return [2, 4].includes(dayOfWeek);
        default:
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            return frequency.toLowerCase().includes(dayNames[dayOfWeek]);
    }
}

// Simplified streak calculation
function calculateStreak(completions: IHabitCompletion[], frequency: string, timezone: string): number {
    if (!completions?.length) return 0;

    // Get unique completion dates (YYYY-MM-DD format)
    const completedDates = new Set(
        completions
            .filter(c => c.completed)
            .map(c => getDateString(new Date(c.date), timezone))
    );

    if (completedDates.size === 0) return 0;

    const today = getTodayString(timezone);
    const yesterday = getYesterdayString(timezone);

    // Check if we have today's completion
    const hasToday = completedDates.has(today);

    // Start checking from today if completed, otherwise from yesterday
    let checkDate = hasToday ? today : yesterday;
    let streak = 0;

    // If we don't have today or yesterday, streak is 0
    if (!hasToday && !completedDates.has(yesterday)) {
        return 0;
    }

    // Count consecutive days working backwards
    for (let i = 0; i < 365; i++) { // Max 365 days to prevent infinite loops
        const dayOfWeek = getDayOfWeek(checkDate);

        // Only count days when habit should be done
        if (shouldDoHabitOnDay(frequency, dayOfWeek)) {
            if (completedDates.has(checkDate)) {
                streak++;
            } else {
                break; // Streak broken
            }
        }

        // Move to previous day
        const date = new Date(checkDate + 'T12:00:00.000Z');
        date.setUTCDate(date.getUTCDate() - 1);
        checkDate = getDateString(date, timezone);
    }

    return streak;
}

export async function createHabit(formData: FormData) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error('User not authenticated');

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
        if (!userId) return [];

        await connectToDatabase();

        const habits = await Habit
            .find({ clerkUserId: userId })
            .sort({ createdAt: -1 })
            .lean<LeanHabit[]>()
            .exec();

        if (!habits?.length) return [];

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
            streak: calculateStreak(habit.completions || [], habit.frequency || 'Daily', timezone),
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


// Replace the completeHabit function with this updated version:
export async function completeHabit(habitId: string, timezone: string = 'UTC') {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error('User not authenticated');
        if (!Types.ObjectId.isValid(habitId)) throw new Error('Invalid habit ID');

        await connectToDatabase();

        const habit = await Habit.findOne({
            _id: new Types.ObjectId(habitId),
            clerkUserId: userId
        }).lean<LeanHabit>();

        if (!habit) throw new Error('Habit not found');

        const today = getTodayString(timezone);
        const todayDate = new Date(today + 'T00:00:00.000Z');

        // Check if already completed today
        const alreadyCompleted = habit.completions?.some(c =>
            c.completed && getDateString(new Date(c.date), timezone) === today
        );

        if (alreadyCompleted) {
            throw new Error('Habit already completed today');
        }

        // Add completion for today
        const newCompletion = {
            date: todayDate,
            completed: true
        };

        const updatedCompletions = [...(habit.completions || []), newCompletion];
        const newStreak = calculateStreak(updatedCompletions, habit.frequency, timezone);

        await Habit.updateOne(
            { _id: new Types.ObjectId(habitId), clerkUserId: userId },
            {
                $push: { completions: newCompletion },
                $set: {
                    streak: newStreak,
                    updatedAt: new Date()
                }
            }
        );

        // Award XP for habit completion
        await awardXP(
            userId,
            25, // Base XP for habit completion
            'habit_completion',
            `Completed habit: ${habit.name}`
        );

        // Check for streak milestone
        if (newStreak > (habit.streak || 0)) {
            await checkStreakMilestone(userId, newStreak);
        }

        // Check for daily bonus
        const allHabits = await Habit.find({ clerkUserId: userId, status: 'active' }).lean();
        const todayCompletions = allHabits.filter(h =>
            h.completions?.some(c =>
                c.completed && getDateString(new Date(c.date), timezone) === today
            )
        ).length;

        await checkDailyBonus(userId, todayCompletions, allHabits.length);

        // Update profile stats
        await updateProfileStats();

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
        if (!userId) throw new Error('User not authenticated');
        if (!Types.ObjectId.isValid(habitId)) throw new Error('Invalid habit ID');

        await connectToDatabase();

        const habit = await Habit.findOne({
            _id: new Types.ObjectId(habitId),
            clerkUserId: userId
        }).lean<LeanHabit>();

        if (!habit) throw new Error('Habit not found');

        const today = getTodayString(timezone);

        // Check if completed today
        const completedToday = habit.completions?.some(c =>
            c.completed && getDateString(new Date(c.date), timezone) === today
        );

        if (!completedToday) {
            throw new Error('Habit was not completed today');
        }

        // Remove today's completion
        const updatedCompletions = habit.completions?.filter(c =>
            !(c.completed && getDateString(new Date(c.date), timezone) === today)
        ) || [];

        const newStreak = calculateStreak(updatedCompletions, habit.frequency, timezone);

        await Habit.updateOne(
            { _id: new Types.ObjectId(habitId), clerkUserId: userId },
            {
                $set: {
                    completions: updatedCompletions,
                    streak: newStreak,
                    updatedAt: new Date()
                }
            }
        );

        revalidatePath('/habits');
        return { success: true, newStreak };
    } catch (error) {
        console.error('Error skipping habit:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to skip habit' };
    }
}

export async function updateHabitStatus(habitId: string, status: 'active' | 'paused' | 'archived') {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error('User not authenticated');
        if (!Types.ObjectId.isValid(habitId)) throw new Error('Invalid habit ID');

        await connectToDatabase();

        const result = await Habit.updateOne(
            { _id: new Types.ObjectId(habitId), clerkUserId: userId },
            { status, updatedAt: new Date() }
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
        if (!userId) throw new Error('User not authenticated');
        if (!Types.ObjectId.isValid(habitId)) throw new Error('Invalid habit ID');

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
        if (!userId) throw new Error('User not authenticated');
        if (!Types.ObjectId.isValid(habitId)) throw new Error('Invalid habit ID');

        await connectToDatabase();

        const result = await Habit.updateOne(
            { _id: new Types.ObjectId(habitId), clerkUserId: userId },
            { ...updateData, updatedAt: new Date() }
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
        if (!habits?.length) {
            return { totalHabits: 0, completionRate: 0, streakSum: 0, weeklyData: [] };
        }

        const today = getTodayString(timezone);
        const weeklyData = [];
        let totalCompletions = 0;
        let totalPossible = 0;

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today + 'T12:00:00.000Z');
            date.setUTCDate(date.getUTCDate() - i);
            const dateString = getDateString(date, timezone);
            const dayOfWeek = getDayOfWeek(dateString);

            let dayCompletions = 0;
            let dayPossible = 0;

            habits.forEach(habit => {
                if (shouldDoHabitOnDay(habit.frequency, dayOfWeek)) {
                    dayPossible++;

                    const completed = habit.completions?.some(c =>
                        c.completed && getDateString(new Date(c.date), timezone) === dateString
                    );

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

        const streakSum = habits.reduce((sum, habit) =>
            sum + calculateStreak(habit.completions || [], habit.frequency, timezone), 0
        );

        return {
            totalHabits: habits.length,
            completionRate: totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0,
            streakSum,
            weeklyData
        };
    } catch (error) {
        console.error('Error getting habit analytics:', error);
        return { totalHabits: 0, completionRate: 0, streakSum: 0, weeklyData: [] };
    }
}

// Habit Chain Actions (keeping existing implementation)
export async function createHabitChain(data: {
    name: string;
    description: string;
    habits: { habitId: string; habitName: string; duration: string; order: number }[];
    timeOfDay: string;
    totalTime: string;
}) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error('User not authenticated');

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
        if (!userId) return [];

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
        if (!userId) throw new Error('User not authenticated');
        if (!Types.ObjectId.isValid(chainId)) throw new Error('Invalid chain ID');

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