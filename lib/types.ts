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

// Chain Session Types
export interface IChainSession {
    _id?: string;
    clerkUserId: string;
    chainId: string;
    chainName: string;
    status: 'active' | 'completed' | 'abandoned';
    startedAt: Date;
    completedAt?: Date;
    currentHabitIndex: number;
    totalHabits: number;
    habits: IChainSessionHabit[];
    totalDuration: string;
    actualDuration?: number;
    pausedAt?: Date;
    pauseDuration: number;
    breakStartedAt?: Date;
    onBreak: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IChainSessionHabit {
    habitId: string;
    habitName: string;
    duration: string;
    order: number;
    startedAt?: Date;
    completedAt?: Date;
    status: 'pending' | 'active' | 'completed' | 'skipped';
    notes?: string;
}