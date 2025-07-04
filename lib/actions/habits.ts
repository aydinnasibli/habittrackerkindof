// lib/actions/habits.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { ensureConnection } from '@/lib/mongoose';
import { Habit } from '@/lib/models/Habit';
import { HabitChain } from '@/lib/models/HabitChain';
import { IHabit, IHabitChain, IHabitCompletion, XP_REWARDS } from '@/lib/types';
import { Types, FlattenMaps } from 'mongoose';
import { awardXP, checkStreakMilestone, checkDailyBonus, removeXP } from './xpSystem';
import { updateProfileStats } from './profile';
import { generateHabitImpactScore, HabitImpactData } from '@/lib/services/impact-score-service';

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

// Calculate XP amount based on habit priority
function getHabitXP(priority: string): number {
    switch (priority.toLowerCase()) {
        case 'high':
            return XP_REWARDS.HABIT_COMPLETION.HIGH;
        case 'medium':
            return XP_REWARDS.HABIT_COMPLETION.MEDIUM;
        case 'low':
            return XP_REWARDS.HABIT_COMPLETION.LOW;
        default:
            return XP_REWARDS.HABIT_COMPLETION.MEDIUM;
    }
}

// Simplified streak calculation
function calculateStreak(completions: IHabitCompletion[], frequency: string, timezone: string): number {
    if (!completions?.length) return 0;

    // Get unique completion dates (YYYY-MM-DD format)
    const completedDates = new Set(
        completions
            .filter((c: IHabitCompletion) => c.completed)
            .map((c: IHabitCompletion) => getDateString(new Date(c.date), timezone))
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

// Validate habit form data
function validateHabitData(formData: FormData): HabitImpactData {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const frequency = formData.get('frequency') as string;
    const timeOfDay = formData.get('timeOfDay') as string;
    const timeToComplete = formData.get('timeToComplete') as string;
    const priority = formData.get('priority') as string;

    // Validate required fields
    if (!name?.trim()) throw new Error('Habit name is required');
    if (!description?.trim()) throw new Error('Habit description is required');

    // Validate enum values
    const validCategories = ['Mindfulness', 'Health', 'Learning', 'Productivity', 'Digital Wellbeing'];
    const validFrequencies = ['Daily', 'Weekdays', 'Weekends', 'Mon, Wed, Fri', 'Tue, Thu'];
    const validTimeOfDay = ['Morning', 'Afternoon', 'Evening', 'Throughout day'];
    const validPriorities = ['High', 'Medium', 'Low'];

    if (!validCategories.includes(category)) {
        throw new Error('Invalid category selected');
    }
    if (!validFrequencies.includes(frequency)) {
        throw new Error('Invalid frequency selected');
    }
    if (!validTimeOfDay.includes(timeOfDay)) {
        throw new Error('Invalid time of day selected');
    }
    if (!validPriorities.includes(priority)) {
        throw new Error('Invalid priority selected');
    }

    return {
        name: name.trim(),
        description: description.trim(),
        category: category as any,
        frequency: frequency as any,
        timeOfDay: timeOfDay as any,
        timeToComplete: timeToComplete || '5 minutes',
        priority: priority as any,
    };
}

export async function createHabit(formData: FormData) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error('User not authenticated');

        await ensureConnection();

        // Validate and extract habit data
        const habitData = validateHabitData(formData);

        // Generate AI impact score
        console.log('Generating impact score for habit:', habitData.name);
        const impactResult = await generateHabitImpactScore(habitData);
        console.log('Generated impact score:', impactResult.score, 'for habit:', habitData.name);

        // Create habit document with impact score
        const habitDocument = {
            clerkUserId: userId,
            name: habitData.name,
            description: habitData.description,
            category: habitData.category,
            frequency: habitData.frequency,
            timeOfDay: habitData.timeOfDay,
            timeToComplete: habitData.timeToComplete,
            priority: habitData.priority,
            impactScore: impactResult.score, // AI-generated impact score
            streak: 0,
            status: 'active' as const,
            completions: []
        };

        const habit = new Habit(habitDocument);
        await habit.save();

        // Log the impact score details for debugging
        console.log('Habit created with impact analysis:', {
            habitId: habit._id.toString(),
            name: habitData.name,
            impactScore: impactResult.score,
            reasoning: impactResult.reasoning,
            factors: impactResult.factors
        });

        revalidatePath('/habits');
        return {
            success: true,
            id: habit._id.toString(),
            impactScore: impactResult.score,
            impactReasoning: impactResult.reasoning
        };
    } catch (error) {
        console.error('Error creating habit:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create habit'
        };
    }
}

export async function getUserHabits(timezone: string = 'UTC'): Promise<IHabit[]> {
    try {
        const { userId } = await auth();
        if (!userId) return [];

        await ensureConnection();

        // Optimized query with projection to reduce data transfer
        const habits = await Habit
            .find({ clerkUserId: userId })
            .select('clerkUserId name description category frequency timeOfDay timeToComplete priority status impactScore completions createdAt updatedAt')
            .sort({ createdAt: -1 })
            .lean<LeanHabit[]>()
            .exec();

        if (!habits?.length) return [];

        // Batch process streak calculations to avoid repeated timezone operations
        const todayString = getTodayString(timezone);
        const yesterdayString = getYesterdayString(timezone);

        return habits.map(habit => {
            // Pre-compute completion dates for faster streak calculation
            const completionDates = new Set(
                (habit.completions || [])
                    .filter(c => c.completed)
                    .map(c => getDateString(new Date(c.date), timezone))
            );

            const streak = calculateStreakOptimized(completionDates, habit.frequency || 'Daily', timezone, todayString, yesterdayString);

            return {
                _id: habit._id?.toString() || '',
                clerkUserId: habit.clerkUserId || '',
                name: habit.name || '',
                description: habit.description || '',
                category: habit.category || 'Health',
                frequency: habit.frequency || 'Daily',
                timeOfDay: habit.timeOfDay || 'Morning',
                timeToComplete: habit.timeToComplete || '5 minutes',
                priority: habit.priority || 'Medium',
                impactScore: habit.impactScore || 5, // Include impact score in response
                streak,
                status: habit.status || 'active',
                completions: Array.isArray(habit.completions) ? habit.completions : [],
                createdAt: habit.createdAt || new Date(),
                updatedAt: habit.updatedAt || new Date(),
            };
        }) as IHabit[];
    } catch (error) {
        console.error('Error fetching habits:', error);
        return [];
    }
}

// Optimized streak calculation that reuses pre-computed values
function calculateStreakOptimized(
    completionDates: Set<string>,
    frequency: string,
    timezone: string,
    todayString: string,
    yesterdayString: string
): number {
    if (completionDates.size === 0) return 0;

    const hasToday = completionDates.has(todayString);
    const hasYesterday = completionDates.has(yesterdayString);

    // Quick exit if no recent activity
    if (!hasToday && !hasYesterday) return 0;

    let checkDate = hasToday ? todayString : yesterdayString;
    let streak = 0;

    // Limit iterations and cache day-of-week calculations
    for (let i = 0; i < 365; i++) {
        const dayOfWeek = getDayOfWeek(checkDate);

        if (shouldDoHabitOnDay(frequency, dayOfWeek)) {
            if (completionDates.has(checkDate)) {
                streak++;
            } else {
                break;
            }
        }

        // Move to previous day
        const date = new Date(checkDate + 'T12:00:00.000Z');
        date.setUTCDate(date.getUTCDate() - 1);
        checkDate = getDateString(date, timezone);
    }

    return streak;
}

export async function completeHabit(habitId: string, timezone: string = 'UTC') {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error('User not authenticated');
        if (!Types.ObjectId.isValid(habitId)) throw new Error('Invalid habit ID');

        await ensureConnection();

        const habit = await Habit.findOne({
            _id: new Types.ObjectId(habitId),
            clerkUserId: userId
        }).lean<LeanHabit>();

        if (!habit) throw new Error('Habit not found');

        const today = getTodayString(timezone);
        const todayDate = new Date(today + 'T00:00:00.000Z');

        // Check if already completed today
        const alreadyCompleted = habit.completions?.some((c: IHabitCompletion) =>
            c.completed && getDateString(new Date(c.date), timezone) === today
        );

        if (alreadyCompleted) {
            throw new Error('Habit already completed today');
        }

        // Store previous streak for comparison
        const previousStreak = calculateStreak(habit.completions || [], habit.frequency, timezone);

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

        // Award XP based on habit priority
        const xpAmount = getHabitXP(habit.priority);
        await awardXP(
            userId,
            xpAmount,
            'habit_completion',
            `Completed habit: ${habit.name}`
        );

        // Check for streak milestone only if streak increased
        if (newStreak > previousStreak) {
            await checkStreakMilestone(userId, newStreak);
        }

        // Check for daily bonus
        const allHabits = await Habit.find({ clerkUserId: userId, status: 'active' }).lean();
        const todayCompletions = allHabits.filter(h =>
            h.completions?.some((c: IHabitCompletion) =>
                c.completed && getDateString(new Date(c.date), timezone) === today
            )
        ).length;

        await checkDailyBonus(userId, todayCompletions, allHabits.length);

        // Update profile stats
        await updateProfileStats();

        revalidatePath('/habits');
        return { success: true, newStreak, xpAwarded: xpAmount };
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

        await ensureConnection();

        const habit = await Habit.findOne({
            _id: new Types.ObjectId(habitId),
            clerkUserId: userId
        }).lean<LeanHabit>();

        if (!habit) throw new Error('Habit not found');

        const today = getTodayString(timezone);

        // Check if completed today
        const todayCompletion = habit.completions?.find((c: IHabitCompletion) =>
            c.completed && getDateString(new Date(c.date), timezone) === today
        );

        if (!todayCompletion) {
            throw new Error('Habit was not completed today');
        }

        // Store previous streak for comparison
        const previousStreak = calculateStreak(habit.completions || [], habit.frequency, timezone);

        // Remove today's completion
        const updatedCompletions = habit.completions?.filter((c: IHabitCompletion) =>
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

        // Remove XP that was awarded for this habit completion
        const xpAmount = getHabitXP(habit.priority);
        await removeXP(
            userId,
            xpAmount,
            'habit_completion',
            `Removed completion for habit: ${habit.name}`
        );

        // If streak decreased, we might need to handle streak milestone reversals
        // This is complex as we'd need to track which milestones were awarded
        // For now, we'll leave milestone XP as is since it's hard to track retroactively

        // Check if we need to remove daily bonus
        // This is also complex as we'd need to check if this was the completion that triggered the bonus
        // For now, we'll leave daily bonus XP as is

        // Update profile stats
        await updateProfileStats();

        revalidatePath('/habits');
        return { success: true, newStreak, xpRemoved: xpAmount };
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

        await ensureConnection();

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

        await ensureConnection();

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

        await ensureConnection();

        // Validate the update data
        const validatedData = {
            name: updateData.name?.trim(),
            description: updateData.description?.trim(),
            category: updateData.category,
            frequency: updateData.frequency,
            timeOfDay: updateData.timeOfDay,
            timeToComplete: updateData.timeToComplete,
            priority: updateData.priority
        };

        // Generate new impact score for the updated habit
        const habitImpactData: HabitImpactData = {
            name: validatedData.name,
            description: validatedData.description,
            category: validatedData.category as any,
            frequency: validatedData.frequency as any,
            timeOfDay: validatedData.timeOfDay as any,
            timeToComplete: validatedData.timeToComplete,
            priority: validatedData.priority as any,
        };

        console.log('Regenerating impact score for updated habit:', validatedData.name);
        const impactResult = await generateHabitImpactScore(habitImpactData);
        console.log('Updated impact score:', impactResult.score, 'for habit:', validatedData.name);

        const result = await Habit.updateOne(
            { _id: new Types.ObjectId(habitId), clerkUserId: userId },
            {
                ...validatedData,
                impactScore: impactResult.score, // Update impact score
                updatedAt: new Date()
            }
        );

        if (result.matchedCount === 0) {
            throw new Error('Habit not found or unauthorized');
        }

        console.log('Habit updated with new impact analysis:', {
            habitId,
            name: validatedData.name,
            impactScore: impactResult.score,
            reasoning: impactResult.reasoning
        });

        revalidatePath('/habits');
        return {
            success: true,
            impactScore: impactResult.score,
            impactReasoning: impactResult.reasoning
        };
    } catch (error) {
        console.error('Error updating habit:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update habit' };
    }
}

export async function getHabitAnalytics(days: number = 7, timezone: string = 'UTC') {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { totalHabits: 0, completionRate: 0, streakSum: 0, weeklyData: [], averageImpactScore: 0 };
        }

        await ensureConnection();

        const habits = await Habit.find({ clerkUserId: userId, status: 'active' }).lean();
        if (!habits?.length) {
            return { totalHabits: 0, completionRate: 0, streakSum: 0, weeklyData: [], averageImpactScore: 0 };
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

                    const completed = habit.completions?.some((c: IHabitCompletion) =>
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

        // Calculate average impact score
        const averageImpactScore = habits.length > 0
            ? Math.round(habits.reduce((sum, habit) => sum + (habit.impactScore || 5), 0) / habits.length * 10) / 10
            : 0;

        return {
            totalHabits: habits.length,
            completionRate: totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0,
            streakSum,
            weeklyData,
            averageImpactScore
        };
    } catch (error) {
        console.error('Error getting habit analytics:', error);
        return { totalHabits: 0, completionRate: 0, streakSum: 0, weeklyData: [], averageImpactScore: 0 };
    }
}

// Get habits sorted by impact score (highest impact first)
export async function getHabitsByImpact(timezone: string = 'UTC'): Promise<IHabit[]> {
    try {
        const { userId } = await auth();
        if (!userId) return [];

        await ensureConnection();

        const habits = await Habit
            .find({ clerkUserId: userId, status: 'active' })
            .sort({ impactScore: -1, createdAt: -1 }) // Sort by impact score descending
            .lean<LeanHabit[]>()
            .exec();

        if (!habits?.length) return [];

        const todayString = getTodayString(timezone);
        const yesterdayString = getYesterdayString(timezone);

        return habits.map(habit => {
            const completionDates = new Set(
                (habit.completions || [])
                    .filter(c => c.completed)
                    .map(c => getDateString(new Date(c.date), timezone))
            );

            const streak = calculateStreakOptimized(completionDates, habit.frequency || 'Daily', timezone, todayString, yesterdayString);

            return {
                _id: habit._id?.toString() || '',
                clerkUserId: habit.clerkUserId || '',
                name: habit.name || '',
                description: habit.description || '',
                category: habit.category || 'Health',
                frequency: habit.frequency || 'Daily',
                timeOfDay: habit.timeOfDay || 'Morning',
                timeToComplete: habit.timeToComplete || '5 minutes',
                priority: habit.priority || 'Medium',
                impactScore: habit.impactScore || 5,
                streak,
                status: habit.status || 'active',
                completions: Array.isArray(habit.completions) ? habit.completions : [],
                createdAt: habit.createdAt || new Date(),
                updatedAt: habit.updatedAt || new Date(),
            };
        }) as IHabit[];
    } catch (error) {
        console.error('Error fetching habits by impact:', error);
        return [];
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

        await ensureConnection();

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

        await ensureConnection();

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

        await ensureConnection();

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