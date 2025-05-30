// lib/types.ts
export interface IHabit {
    _id?: string;
    clerkUserId: string;
    name: string;
    description: string;
    category: string;
    frequency: string;
    timeOfDay: string;
    timeToComplete: string;
    priority: string;
    streak: number;
    status: 'active' | 'paused' | 'archived';
    createdAt: Date;
    updatedAt: Date;
    completions: IHabitCompletion[];
}

export interface IHabitCompletion {
    date: Date;
    completed: boolean;
    notes?: string;
}

export interface IHabitChain {
    _id?: string;
    clerkUserId: string;
    name: string;
    description: string;
    habits: {
        habitId: string;
        habitName: string;
        duration: string;
        order: number;
    }[];
    timeOfDay: string;
    totalTime: string;
    createdAt: Date;
    updatedAt: Date;
}