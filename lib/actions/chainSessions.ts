// lib/actions/chainSessions.ts
'use server';
import { awardXP } from './xpSystem';
import { updateProfileStats } from './profile';
import { startSession } from 'mongoose';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { ensureConnection } from '@/lib/mongoose';
import { ChainSession } from '@/lib/models/ChainSession';
import { HabitChain } from '@/lib/models/HabitChain';
import { Habit } from '@/lib/models/Habit';
import { IChainSession } from '@/lib/types';
import { Types, FlattenMaps } from 'mongoose';
import { z } from 'zod';



interface ChainHabit {
    habitId: string;
    habitName: string;
    duration: number;
    order: number;
}

// Define the habit session type for better type safety
interface HabitSessionItem {
    habitId: string;
    habitName: string;
    duration: number;
    order: number;
    status: 'pending' | 'active' | 'completed' | 'skipped';
    startedAt?: Date;
    completedAt?: Date;
    notes?: string;
}

export class ChainSessionError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'ChainSessionError';
    }
}

const sessionIdSchema = z.string().refine(
    (id) => Types.ObjectId.isValid(id),
    { message: 'Invalid session ID format' }
);

const chainIdSchema = z.string().refine(
    (id) => Types.ObjectId.isValid(id),
    { message: 'Invalid chain ID format' }
);





export async function startHabitChain(chainId: string) {
    const session = await startSession();

    try {
        // Validate input
        const validatedChainId = chainIdSchema.parse(chainId);

        const { userId } = await auth();
        if (!userId) {
            throw new ChainSessionError('User not authenticated', 'AUTH_ERROR');
        }

        await ensureConnection();

        return await session.withTransaction(async () => {
            // Use aggregation for better performance - check active session and get chain in one query
            const [activeSessionCheck, chainData] = await Promise.all([
                ChainSession.findOne({
                    clerkUserId: userId,
                    status: 'active'
                }).select('_id').lean(),

                HabitChain.findOne({
                    _id: new Types.ObjectId(validatedChainId),
                    clerkUserId: userId
                }).select('name habits totalTime').lean()
            ]);

            if (activeSessionCheck) {
                throw new ChainSessionError(
                    'Active session exists. Complete or abandon it first.',
                    'ACTIVE_SESSION_EXISTS'
                );
            }

            if (!chainData) {
                throw new ChainSessionError('Chain not found or unauthorized', 'CHAIN_NOT_FOUND');
            }

            // Create optimized session document
            const chainSession = new ChainSession({
                clerkUserId: userId,
                chainId: validatedChainId,
                chainName: chainData.name,
                status: 'active',
                startedAt: new Date(),
                currentHabitIndex: 0,
                totalHabits: chainData.habits.length,
                habits: chainData.habits.map((habit: any, index: number) => ({
                    habitId: habit.habitId,
                    habitName: habit.habitName,
                    duration: habit.duration,
                    order: habit.order,
                    status: index === 0 ? 'active' : 'pending',
                    ...(index === 0 && { startedAt: new Date() })
                })),
                totalDuration: chainData.totalTime,
                pauseDuration: 0,
                onBreak: false
            });

            await chainSession.save({ session });

            return {
                success: true,
                sessionId: chainSession._id.toString(),
                message: `Started ${chainData.name} chain successfully!`
            };
        });
    } catch (error) {
        if (error instanceof ChainSessionError) {
            return { success: false, error: error.message, code: error.code };
        }

        console.error('Error starting habit chain:', error);
        return {
            success: false,
            error: 'Failed to start habit chain',
            code: 'INTERNAL_ERROR'
        };
    } finally {
        await session.endSession();
    }
}
export async function getActiveChainSession(): Promise<IChainSession | null> {
    try {
        const { userId } = await auth();
        if (!userId) return null;

        await ensureConnection();

        // Use aggregation pipeline for better performance
        const sessions = await ChainSession.aggregate([
            {
                $match: {
                    clerkUserId: userId,
                    status: 'active'
                }
            },
            {
                $limit: 1
            },
            {
                $project: {
                    clerkUserId: 1,
                    chainId: 1,
                    chainName: 1,
                    status: 1,
                    startedAt: 1,
                    completedAt: 1,
                    currentHabitIndex: 1,
                    totalHabits: 1,
                    habits: 1,
                    totalDuration: 1,
                    actualDuration: 1,
                    pausedAt: 1,
                    pauseDuration: 1,
                    breakStartedAt: 1,
                    onBreak: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ]);

        if (sessions.length === 0) return null;

        const session = sessions[0];
        return {
            _id: session._id.toString(),
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
    const dbSession = await startSession();

    try {
        const validatedSessionId = sessionIdSchema.parse(sessionId);
        const { userId } = await auth();

        if (!userId) {
            throw new ChainSessionError('User not authenticated', 'AUTH_ERROR');
        }

        await ensureConnection();

        return await dbSession.withTransaction(async () => {
            // Get session and current habit in one query
            const sessionDoc = await ChainSession.findOne({
                _id: new Types.ObjectId(validatedSessionId),
                clerkUserId: userId,
                status: 'active'
            }).session(dbSession);

            if (!sessionDoc) {
                throw new ChainSessionError('Active session not found', 'SESSION_NOT_FOUND');
            }

            const currentHabit = sessionDoc.habits[sessionDoc.currentHabitIndex];
            if (!currentHabit) {
                throw new ChainSessionError('No current habit found', 'HABIT_NOT_FOUND');
            }

            // Mark current habit as completed
            currentHabit.status = 'completed';
            currentHabit.completedAt = new Date();
            if (notes) currentHabit.notes = notes;

            // Batch habit completion and XP operations
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);

            const [habitDoc] = await Promise.all([
                Habit.findOne({
                    _id: new Types.ObjectId(currentHabit.habitId),
                    clerkUserId: userId
                }).session(dbSession),
            ]);

            let habitXP = 0;
            if (habitDoc) {
                // Check if already completed today using aggregation
                const todayCompletion = await Habit.aggregate([
                    { $match: { _id: habitDoc._id } },
                    { $unwind: '$completions' },
                    {
                        $match: {
                            'completions.completed': true,
                            'completions.date': {
                                $gte: today,
                                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                            }
                        }
                    },
                    { $limit: 1 }
                ]);

                if (todayCompletion.length === 0) {
                    // Calculate XP based on priority
                    habitXP = habitDoc.priority === 'high' ? 30 :
                        habitDoc.priority === 'medium' ? 25 : 20;

                    // Update habit with completion
                    await Habit.updateOne(
                        { _id: habitDoc._id },
                        {
                            $push: {
                                completions: {
                                    date: today,
                                    completed: true,
                                    notes: notes || `Completed via chain: ${sessionDoc.chainName}`
                                }
                            },
                            $inc: { streak: 1 }
                        },
                        { session: dbSession }
                    );
                }
            }

            // Handle chain progression
            const isLastHabit = sessionDoc.currentHabitIndex >= sessionDoc.habits.length - 1;

            if (!isLastHabit) {
                // Move to next habit
                sessionDoc.currentHabitIndex += 1;
                const nextHabit = sessionDoc.habits[sessionDoc.currentHabitIndex];
                nextHabit.status = 'active';
                nextHabit.startedAt = new Date();
            } else {
                // Complete chain
                const completedHabits = sessionDoc.habits.filter(h => h.status === 'completed').length;
                const completionRate = completedHabits / sessionDoc.habits.length;

                sessionDoc.status = 'completed';
                sessionDoc.completedAt = new Date();

                // Calculate actual duration more efficiently
                const totalMinutes = Math.floor(
                    (sessionDoc.completedAt.getTime() - sessionDoc.startedAt.getTime()) / 60000
                );
                sessionDoc.actualDuration = totalMinutes - sessionDoc.pauseDuration;

                // Award chain completion XP
                let chainCompletionXP = 0;
                if (completionRate === 1.0) {
                    chainCompletionXP = 100 + (completedHabits * 15);
                } else if (completionRate >= 0.8) {
                    chainCompletionXP = 60 + (completedHabits * 10);
                } else if (completionRate >= 0.5) {
                    chainCompletionXP = 30 + (completedHabits * 5);
                }

                // Batch XP operations
                const xpOperations = [];
                if (habitXP > 0) {
                    xpOperations.push({
                        amount: habitXP,
                        source: 'habit_completion',
                        description: `Completed habit in chain: ${currentHabit.habitName}`
                    });
                }
                if (chainCompletionXP > 0) {
                    xpOperations.push({
                        amount: chainCompletionXP,
                        source: 'chain_completion',
                        description: `Completed chain: ${sessionDoc.chainName} (${completedHabits}/${sessionDoc.habits.length} habits)`
                    });
                }

                // Award all XP in batch
                for (const xpOp of xpOperations) {
                    await awardXP(userId, xpOp.amount, xpOp.source as any, xpOp.description);
                }
            }

            await sessionDoc.save({ session: dbSession });

            // Update profile stats asynchronously (don't block response)
            setImmediate(() => updateProfileStats().catch(console.error));

            return {
                success: true,
                isChainCompleted: sessionDoc.status === 'completed',
                message: sessionDoc.status === 'completed'
                    ? 'Congratulations! Chain completed successfully!'
                    : 'Habit completed! Moving to next habit.'
            };
        });
    } catch (error) {
        if (error instanceof ChainSessionError) {
            return { success: false, error: error.message, code: error.code };
        }

        console.error('Error completing current habit:', error);
        return {
            success: false,
            error: 'Failed to complete habit',
            code: 'INTERNAL_ERROR'
        };
    } finally {
        await dbSession.endSession();
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

        await ensureConnection();

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
            const completedHabits = session.habits.filter((h: HabitSessionItem) => h.status === 'completed').length;
            const skippedHabits = session.habits.filter((h: HabitSessionItem) => h.status === 'skipped').length;
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
                ? `Chain completed! ${session.habits.filter((h: HabitSessionItem) => h.status === 'completed').length}/${session.habits.length} habits completed.`
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
        const validatedSessionId = sessionIdSchema.parse(sessionId);
        const { userId } = await auth();

        if (!userId) {
            throw new ChainSessionError('User not authenticated', 'AUTH_ERROR');
        }

        await ensureConnection();

        const result = await ChainSession.updateOne(
            {
                _id: new Types.ObjectId(validatedSessionId),
                clerkUserId: userId,
                status: 'active'
            },
            {
                $set: { pausedAt: new Date() }
            }
        );

        if (result.matchedCount === 0) {
            throw new ChainSessionError('Active session not found', 'SESSION_NOT_FOUND');
        }

        // Async revalidation
        setImmediate(() => revalidatePath('/habits'));

        return { success: true, message: 'Chain session paused' };
    } catch (error) {
        if (error instanceof ChainSessionError) {
            return { success: false, error: error.message, code: error.code };
        }

        console.error('Error pausing chain session:', error);
        return {
            success: false,
            error: 'Failed to pause session',
            code: 'INTERNAL_ERROR'
        };
    }
}

export async function resumeChainSession(sessionId: string) {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        await ensureConnection();

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

        await ensureConnection();

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

        await ensureConnection();

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

        await ensureConnection();

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
        if (!userId) return [];

        await ensureConnection();

        // Use aggregation for better performance and memory efficiency
        const sessions = await ChainSession.aggregate([
            {
                $match: {
                    clerkUserId: userId,
                    status: { $in: ['completed', 'abandoned'] }
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $limit: 50
            },
            {
                $project: {
                    clerkUserId: 1,
                    chainId: 1,
                    chainName: 1,
                    status: 1,
                    startedAt: 1,
                    completedAt: 1,
                    currentHabitIndex: 1,
                    totalHabits: 1,
                    'habits.status': 1, // Only project necessary habit fields
                    totalDuration: 1,
                    actualDuration: 1,
                    pauseDuration: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ]);

        return sessions.map(session => ({
            _id: session._id.toString(),
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
            pausedAt: undefined,
            pauseDuration: session.pauseDuration || 0,
            breakStartedAt: undefined,
            onBreak: false,
            createdAt: session.createdAt || new Date(),
            updatedAt: session.updatedAt || new Date(),
        } as IChainSession));
    } catch (error) {
        console.error('Error fetching past chain sessions:', error);
        return [];
    }
}