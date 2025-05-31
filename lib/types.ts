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
// Add these interfaces to your existing lib/types.ts file

export interface IProfile {
    _id?: string;
    clerkUserId: string;
    firstName?: string;
    lastName?: string;
    userName?: string;
    email: string;
    bio?: string;
    timezone: string;
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
    timeFormat: '12h' | '24h';
    theme: 'light' | 'dark' | 'system';
    notifications: {
        email: boolean;
        push: boolean;
        habitReminders: boolean;
        weeklyReports: boolean;
    };
    privacy: {
        profileVisibility: 'public' | 'private';
        showStreak: boolean;
        showProgress: boolean;
    };
    goals: {
        dailyHabitTarget: number;
        weeklyGoal: number;
    };
    stats: {
        totalHabitsCreated: number;
        totalCompletions: number;
        longestStreak: number;
        totalChainsCompleted: number;
        joinedAt: Date;
    };
    createdAt: Date;
    updatedAt: Date;
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