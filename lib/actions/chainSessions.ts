// lib/actions/chainSessions.ts
'use server';
import { awardXP } from './xpSystem';
import { updateProfileStats } from './profile';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/mongoose';
import { ChainSession } from '@/lib/models/ChainSession';
import { HabitChain } from '@/lib/models/HabitChain';
import { Habit } from '@/lib/models/Habit';
import { IChainSession } from '@/lib/types';
import { Types, FlattenMaps } from 'mongoose';

type LeanChainSession = FlattenMaps<IChainSession> & { _id: Types.ObjectId };
interface ChainHabit {
    habitId: string;
    habitName: string;
    duration: number;
    order: number;
}
export async function startHabitChain(chainId: string) {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        if (!Types.ObjectId.isValid(chainId)) {
            throw new Error('Invalid chain ID');
        }

        await connectToDatabase();

        // Check if user already has an active chain session
        const activeSession = await ChainSession.findOne({
            clerkUserId: userId,
            status: 'active'
        });

        if (activeSession) {
            return {
                success: false,
                error: 'You already have an active chain session. Please complete or abandon it first.',
                activeSessionId: activeSession._id.toString()
            };
        }

        // Get the chain details
        const chain = await HabitChain.findOne({
            _id: new Types.ObjectId(chainId),
            clerkUserId: userId
        });

        if (!chain) {
            throw new Error('Chain not found or unauthorized');
        }

        // Create new chain session
        const chainSession = new ChainSession({
            clerkUserId: userId,
            chainId: chain._id.toString(),
            chainName: chain.name,
            status: 'active',
            startedAt: new Date(),
            currentHabitIndex: 0,
            totalHabits: chain.habits.length,
            habits: chain.habits.map((habit: ChainHabit) => ({
                habitId: habit.habitId,
                habitName: habit.habitName,
                duration: habit.duration,
                order: habit.order,
                status: 'pending' as const
            })),
            totalDuration: chain.totalTime,
            pauseDuration: 0,
            onBreak: false
        });

        // Set first habit as active
        if (chainSession.habits.length > 0) {
            chainSession.habits[0].status = 'active';
            chainSession.habits[0].startedAt = new Date();
        }

        await chainSession.save();

        revalidatePath('/habits');
        return {
            success: true,
            sessionId: chainSession._id.toString(),
            message: `Started ${chain.name} chain successfully!`
        };
    } catch (error) {
        console.error('Error starting habit chain:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to start habit chain'
        };
    }
}

export async function getActiveChainSession(): Promise<IChainSession | null> {
    try {
        const { userId } = await auth();

        if (!userId) {
            return null;
        }

        await connectToDatabase();

        const session = await ChainSession
            .findOne({
                clerkUserId: userId,
                status: 'active'
            })
            .lean<LeanChainSession>()
            .exec();

        if (!session) {
            return null;
        }

        return {
            _id: session._id?.toString() || '',
            clerkUserId: session.clerkUserId,
            chainId: session.chainId,
            chainName: session.chainName,
            status: session.status,
            startedAt: session.startedAt,
            completedAt: session.completedAt,
            currentHabitIndex: session.currentHabitIndex,
            totalHabits: session.totalHabits,
            habits: session.habits || [],
            totalDuration: session.totalDuration,
            actualDuration: session.actualDuration,
            pausedAt: session.pausedAt,
            pauseDuration: session.pauseDuration || 0,
            breakStartedAt: session.breakStartedAt,
            onBreak: session.onBreak || false,
            createdAt: session.createdAt || new Date(),
            updatedAt: session.updatedAt || new Date(),
        } as IChainSession;
    } catch (error) {
        console.error('Error fetching active chain session:', error);
        return null;
    }
}

export async function completeCurrentHabit(sessionId: string, notes?: string) {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        if (!Types.ObjectId.isValid(sessionId)) {
            throw new Error('Invalid session ID');
        }

        await connectToDatabase();

        const session = await ChainSession.findOne({
            _id: new Types.ObjectId(sessionId),
            clerkUserId: userId,
            status: 'active'
        });

        if (!session) {
            throw new Error('Active session not found');
        }

        const currentHabit = session.habits[session.currentHabitIndex];
        if (!currentHabit) {
            throw new Error('No current habit found');
        }

        // Mark current habit as completed
        currentHabit.status = 'completed';
        currentHabit.completedAt = new Date();
        if (notes) {
            currentHabit.notes = notes;
        }

        // Complete the actual habit (add to habit completions)
        const habit = await Habit.findOne({
            _id: new Types.ObjectId(currentHabit.habitId),
            clerkUserId: userId
        });

        if (habit) {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);

            // Check if already completed today
            const alreadyCompleted = habit.completions?.some((completion: any) => {
                const completionDate = new Date(completion.date);
                return completion.completed &&
                    completionDate.toDateString() === today.toDateString();
            });

            if (!alreadyCompleted) {
                habit.completions = habit.completions || [];
                habit.completions.push({
                    date: today,
                    completed: true,
                    notes: notes || `Completed via chain: ${session.chainName}`
                });
                habit.streak = (habit.streak || 0) + 1;
                await habit.save();

                // Award XP for individual habit completion based on priority
                let habitXP = 20; // Default chain habit XP
                if (habit.priority === 'high') {
                    habitXP = 30;
                } else if (habit.priority === 'medium') {
                    habitXP = 25;
                } else {
                    habitXP = 20;
                }

                await awardXP(
                    userId,
                    habitXP,
                    'habit_completion',
                    `Completed habit in chain: ${currentHabit.habitName}`
                );
            }
        }

        // Move to next habit or complete chain
        if (session.currentHabitIndex < session.habits.length - 1) {
            session.currentHabitIndex += 1;
            const nextHabit = session.habits[session.currentHabitIndex];
            nextHabit.status = 'active';
            nextHabit.startedAt = new Date();
        } else {
            // Chain completed - calculate completion rate and award XP accordingly
            const completedHabits = session.habits.filter(h => h.status === 'completed').length;
            const skippedHabits = session.habits.filter(h => h.status === 'skipped').length;
            const completionRate = completedHabits / session.habits.length;

            session.status = 'completed';
            session.completedAt = new Date();

            // Calculate actual duration
            const totalMinutes = Math.floor((session.completedAt.getTime() - session.startedAt.getTime()) / (1000 * 60));
            session.actualDuration = totalMinutes - session.pauseDuration;

            // Award chain completion XP based on completion rate
            let chainCompletionXP = 0;
            if (completionRate === 1.0) {
                // Perfect completion - full bonus
                chainCompletionXP = 100 + (completedHabits * 15);
            } else if (completionRate >= 0.8) {
                // Good completion (80%+) - reduced bonus
                chainCompletionXP = 60 + (completedHabits * 10);
            } else if (completionRate >= 0.5) {
                // Partial completion (50%+) - minimal bonus
                chainCompletionXP = 30 + (completedHabits * 5);
            }
            // No bonus for less than 50% completion

            if (chainCompletionXP > 0) {
                await awardXP(
                    userId,
                    chainCompletionXP,
                    'chain_completion',
                    `Completed chain: ${session.chainName} (${completedHabits}/${session.habits.length} habits)`
                );
            }
        }

        await session.save();

        // Update profile stats
        await updateProfileStats();

        revalidatePath('/habits');
        return {
            success: true,
            isChainCompleted: session.status === 'completed',
            message: session.status === 'completed'
                ? 'Congratulations! Chain completed successfully!'
                : 'Habit completed! Moving to next habit.'
        };
    } catch (error) {
        console.error('Error completing current habit:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to complete habit'
        };
    }
}

export async function skipCurrentHabit(sessionId: string, reason?: string) {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        if (!Types.ObjectId.isValid(sessionId)) {
            throw new Error('Invalid session ID');
        }

        await connectToDatabase();

        const session = await ChainSession.findOne({
            _id: new Types.ObjectId(sessionId),
            clerkUserId: userId,
            status: 'active'
        });

        if (!session) {
            throw new Error('Active session not found');
        }

        const currentHabit = session.habits[session.currentHabitIndex];
        if (!currentHabit) {
            throw new Error('No current habit found');
        }

        // Mark current habit as skipped
        currentHabit.status = 'skipped';
        currentHabit.completedAt = new Date();
        if (reason) {
            currentHabit.notes = reason;
        }

        // Move to next habit or complete chain
        if (session.currentHabitIndex < session.habits.length - 1) {
            session.currentHabitIndex += 1;
            const nextHabit = session.habits[session.currentHabitIndex];
            nextHabit.status = 'active';
            nextHabit.startedAt = new Date();
        } else {
            // Chain completed - calculate completion rate and award XP accordingly
            const completedHabits = session.habits.filter(h => h.status === 'completed').length;
            const skippedHabits = session.habits.filter(h => h.status === 'skipped').length;
            const completionRate = completedHabits / session.habits.length;

            session.status = 'completed';
            session.completedAt = new Date();

            // Calculate actual duration
            const totalMinutes = Math.floor((session.completedAt.getTime() - session.startedAt.getTime()) / (1000 * 60));
            session.actualDuration = totalMinutes - session.pauseDuration;

            // Award chain completion XP based on completion rate (same logic as complete)
            let chainCompletionXP = 0;
            if (completionRate === 1.0) {
                // This shouldn't happen when skipping, but just in case
                chainCompletionXP = 100 + (completedHabits * 15);
            } else if (completionRate >= 0.8) {
                chainCompletionXP = 60 + (completedHabits * 10);
            } else if (completionRate >= 0.5) {
                chainCompletionXP = 30 + (completedHabits * 5);
            }

            if (chainCompletionXP > 0) {
                await awardXP(
                    userId,
                    chainCompletionXP,
                    'chain_completion',
                    `Partially completed chain: ${session.chainName} (${completedHabits}/${session.habits.length} habits)`
                );
            }
        }

        await session.save();

        revalidatePath('/habits');
        return {
            success: true,
            isChainCompleted: session.status === 'completed',
            message: session.status === 'completed'
                ? `Chain completed! ${session.habits.filter(h => h.status === 'completed').length}/${session.habits.length} habits completed.`
                : 'Habit skipped. Moving to next habit.'
        };
    } catch (error) {
        console.error('Error skipping current habit:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to skip habit'
        };
    }
}

export async function pauseChainSession(sessionId: string) {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        await connectToDatabase();

        const result = await ChainSession.updateOne(
            {
                _id: new Types.ObjectId(sessionId),
                clerkUserId: userId,
                status: 'active'
            },
            {
                pausedAt: new Date()
            }
        );

        if (result.matchedCount === 0) {
            throw new Error('Active session not found');
        }

        revalidatePath('/habits');
        return { success: true, message: 'Chain session paused' };
    } catch (error) {
        console.error('Error pausing chain session:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to pause session'
        };
    }
}

export async function resumeChainSession(sessionId: string) {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        await connectToDatabase();

        const session = await ChainSession.findOne({
            _id: new Types.ObjectId(sessionId),
            clerkUserId: userId,
            status: 'active'
        });

        if (!session || !session.pausedAt) {
            throw new Error('Session not found or not paused');
        }

        // Calculate pause duration
        const pauseTime = Math.floor((new Date().getTime() - session.pausedAt.getTime()) / (1000 * 60));
        session.pauseDuration += pauseTime;
        session.pausedAt = undefined;

        await session.save();

        revalidatePath('/habits');
        return { success: true, message: 'Chain session resumed' };
    } catch (error) {
        console.error('Error resuming chain session:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to resume session'
        };
    }
}

export async function abandonChainSession(sessionId: string) {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        await connectToDatabase();

        const result = await ChainSession.updateOne(
            {
                _id: new Types.ObjectId(sessionId),
                clerkUserId: userId,
                status: 'active'
            },
            {
                status: 'abandoned',
                completedAt: new Date()
            }
        );

        if (result.matchedCount === 0) {
            throw new Error('Active session not found');
        }

        // No XP awarded for abandoned chains
        revalidatePath('/habits');
        return { success: true, message: 'Chain session abandoned' };
    } catch (error) {
        console.error('Error abandoning chain session:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to abandon session'
        };
    }
}

export async function startBreak(sessionId: string, duration: number) {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        await connectToDatabase();

        const result = await ChainSession.updateOne(
            {
                _id: new Types.ObjectId(sessionId),
                clerkUserId: userId,
                status: 'active'
            },
            {
                onBreak: true,
                breakStartedAt: new Date()
            }
        );

        if (result.matchedCount === 0) {
            throw new Error('Active session not found');
        }

        revalidatePath('/habits');
        return { success: true, message: `Break started for ${duration} minutes` };
    } catch (error) {
        console.error('Error starting break:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to start break'
        };
    }
}

export async function endBreak(sessionId: string) {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        await connectToDatabase();

        const session = await ChainSession.findOne({
            _id: new Types.ObjectId(sessionId),
            clerkUserId: userId,
            status: 'active'
        });

        if (!session || !session.onBreak || !session.breakStartedAt) {
            throw new Error('Session not found or not on break');
        }

        // Calculate break duration
        const breakTime = Math.floor((new Date().getTime() - session.breakStartedAt.getTime()) / (1000 * 60));
        session.pauseDuration += breakTime;
        session.onBreak = false;
        session.breakStartedAt = undefined;

        await session.save();

        revalidatePath('/habits');
        return { success: true, message: 'Break ended. Ready to continue!' };
    } catch (error) {
        console.error('Error ending break:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to end break'
        };
    }
}

export async function getPastChainSessions(): Promise<IChainSession[]> {
    try {
        const { userId } = await auth();

        if (!userId) {
            return [];
        }

        await connectToDatabase();

        const sessions = await ChainSession
            .find({
                clerkUserId: userId,
                status: { $in: ['completed', 'abandoned'] }
            })
            .sort({ createdAt: -1 }) // Most recent first
            .limit(50) // Limit to last 50 sessions
            .lean<LeanChainSession[]>()
            .exec();

        return sessions.map(session => ({
            _id: session._id?.toString() || '',
            clerkUserId: session.clerkUserId,
            chainId: session.chainId,
            chainName: session.chainName,
            status: session.status,
            startedAt: session.startedAt,
            completedAt: session.completedAt,
            currentHabitIndex: session.currentHabitIndex,
            totalHabits: session.totalHabits,
            habits: session.habits || [],
            totalDuration: session.totalDuration,
            actualDuration: session.actualDuration,
            pausedAt: session.pausedAt,
            pauseDuration: session.pauseDuration || 0,
            breakStartedAt: session.breakStartedAt,
            onBreak: session.onBreak || false,
            createdAt: session.createdAt || new Date(),
            updatedAt: session.updatedAt || new Date(),
        } as IChainSession));
    } catch (error) {
        console.error('Error fetching past chain sessions:', error);
        return [];
    }
}