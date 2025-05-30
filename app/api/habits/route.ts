// app/api/habits/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongoose';
import { Habit } from '@/lib/models/Habit';

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const habits = await Habit
            .find({ clerkUserId: userId })
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        // Transform the data to ensure proper serialization
        const transformedHabits = habits.map(habit => ({
            _id: habit._id.toString(),
            clerkUserId: habit.clerkUserId,
            name: habit.name,
            description: habit.description,
            category: habit.category,
            frequency: habit.frequency,
            timeOfDay: habit.timeOfDay,
            timeToComplete: habit.timeToComplete,
            priority: habit.priority,
            streak: habit.streak,
            status: habit.status,
            completions: habit.completions || [],
            createdAt: habit.createdAt,
            updatedAt: habit.updatedAt,
        }));

        return NextResponse.json(transformedHabits);
    } catch (error) {
        console.error('Error fetching habits:', error);
        return NextResponse.json(
            { error: 'Failed to fetch habits' },
            { status: 500 }
        );
    }
}