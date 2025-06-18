// lib/actions/feedback.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { ensureConnection } from '@/lib/mongoose';
import { Habit } from '@/lib/models/Habit';
import { IHabitFeedback, IFeedbackSubmission } from '@/lib/types';
import { Types } from 'mongoose';

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

// Get day of week (0 = Sunday, 1 = Monday, etc.)
function getDayOfWeek(dateString: string): number {
    const date = new Date(dateString + 'T12:00:00.000Z');
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

// Submit daily feedback for habits
export async function submitDailyFeedback(
    feedbacks: IFeedbackSubmission[],
    timezone: string = 'UTC'
) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error('User not authenticated');

        await ensureConnection();

        const today = getTodayString(timezone);
        const todayDate = new Date(today + 'T00:00:00.000Z');

        // Validate all habit IDs belong to the user
        const habitIds = feedbacks.map(f => f.habitId);
        const validHabits = await Habit.find({
            _id: { $in: habitIds.map(id => new Types.ObjectId(id)) },
            clerkUserId: userId
        }).select('_id completions frequency').lean();

        if (validHabits.length !== habitIds.length) {
            throw new Error('Some habits not found or unauthorized');
        }

        // Process each feedback
        const updatePromises = feedbacks.map(async (feedbackData) => {
            const habit = validHabits.find(h => h._id.toString() === feedbackData.habitId);
            if (!habit) return;

            // Check if habit was completed today
            const completedToday = habit.completions?.some((completion: any) =>
                completion.completed && getDateString(new Date(completion.date), timezone) === today
            ) || false;

            const newFeedback: IHabitFeedback = {
                date: todayDate,
                feedback: feedbackData.feedback.trim(),
                completed: completedToday,
                mood: feedbackData.mood,
                createdAt: new Date()
            };

            // Remove existing feedback for today (if any) and add new one
            await Habit.updateOne(
                { _id: new Types.ObjectId(feedbackData.habitId) },
                {
                    $pull: { feedbacks: { date: todayDate } },
                    $set: { updatedAt: new Date() }
                }
            );

            // Add new feedback and maintain 90-entry limit
            await Habit.updateOne(
                { _id: new Types.ObjectId(feedbackData.habitId) },
                {
                    $push: {
                        feedbacks: {
                            $each: [newFeedback],
                            $sort: { date: -1 }, // Sort by date descending
                            $slice: 90 // Keep only the latest 90 entries
                        }
                    },
                    $set: { updatedAt: new Date() }
                }
            );
        });

        await Promise.all(updatePromises);

        revalidatePath('/habits');
        return { success: true };
    } catch (error) {
        console.error('Error submitting daily feedback:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to submit feedback'
        };
    }
}

// Get today's habits that should be done (for feedback modal)
export async function getTodaysHabitsForFeedback(timezone: string = 'UTC') {
    try {
        const { userId } = await auth();
        if (!userId) return [];

        await ensureConnection();

        const today = getTodayString(timezone);
        const dayOfWeek = getDayOfWeek(today);

        // Get active habits
        const habits = await Habit.find({
            clerkUserId: userId,
            status: 'active'
        }).select('_id name description category priority completions feedbacks frequency').lean();

        // Filter habits that should be done today
        const todaysHabits = habits.filter(habit =>
            shouldDoHabitOnDay(habit.frequency, dayOfWeek)
        );

        // Check completion status and existing feedback for today
        return todaysHabits.map(habit => {
            const completedToday = habit.completions?.some((completion: any) =>
                completion.completed && getDateString(new Date(completion.date), timezone) === today
            ) || false;

            const todaysFeedback = habit.feedbacks?.find((feedback: any) =>
                getDateString(new Date(feedback.date), timezone) === today
            );

            return {
                _id: habit._id.toString(),
                name: habit.name,
                description: habit.description,
                category: habit.category,
                priority: habit.priority,
                completedToday,
                hasFeedback: !!todaysFeedback,
                existingFeedback: todaysFeedback || null
            };
        });
    } catch (error) {
        console.error('Error getting today\'s habits for feedback:', error);
        return [];
    }
}

// Check if user can submit feedback (within 22:00-00:00)
export async function canSubmitFeedback(timezone: string = 'UTC'): Promise<{
    canSubmit: boolean;
    timeUntilAvailable?: string;
    timeUntilExpires?: string;
}> {
    try {
        const { userId } = await auth();
        if (!userId) return { canSubmit: false };

        // Get current time in user's timezone
        const now = new Date();
        const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        const hours = userTime.getHours();
        const minutes = userTime.getMinutes();

        // Check if current time is between 22:00 and 23:59
        const canSubmit = hours >= 12;

        if (canSubmit) {
            // Calculate time until window expires (midnight)
            const midnight = new Date(userTime);
            midnight.setHours(24, 0, 0, 0);
            const msUntilExpiry = midnight.getTime() - userTime.getTime();
            const minutesUntilExpiry = Math.floor(msUntilExpiry / (1000 * 60));
            const hoursUntilExpiry = Math.floor(minutesUntilExpiry / 60);
            const remainingMinutes = minutesUntilExpiry % 60;

            return {
                canSubmit: true,
                timeUntilExpires: `${hoursUntilExpiry}h ${remainingMinutes}m`
            };
        } else {
            // Calculate time until 22:00
            const feedbackTime = new Date(userTime);
            if (hours < 12) {
                // Same day 22:00
                feedbackTime.setHours(22, 0, 0, 0);
            } else {
                // Next day 22:00 (this shouldn't happen in current logic but just in case)
                feedbackTime.setDate(feedbackTime.getDate() + 1);
                feedbackTime.setHours(22, 0, 0, 0);
            }

            const msUntilAvailable = feedbackTime.getTime() - userTime.getTime();
            const minutesUntilAvailable = Math.floor(msUntilAvailable / (1000 * 60));
            const hoursUntilAvailable = Math.floor(minutesUntilAvailable / 60);
            const remainingMinutes = minutesUntilAvailable % 60;

            return {
                canSubmit: false,
                timeUntilAvailable: `${hoursUntilAvailable}h ${remainingMinutes}m`
            };
        }
    } catch (error) {
        console.error('Error checking feedback availability:', error);
        return { canSubmit: false };
    }
}

