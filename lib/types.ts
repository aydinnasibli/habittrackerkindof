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
    theme: 'light' | 'dark' | 'system' | 'midnight' | 'forest' | 'ocean' | 'sunset' | 'lavender';
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
        showXP: boolean;
        showRank: boolean;
    };
    goals: {
        dailyHabitTarget: number;
        weeklyGoal: number;
    };
    xp: {
        total: number;
        currentLevel: number;
        currentLevelXP: number;
        xpToNextLevel: number;
    };
    rank: {
        title: 'Novice' | 'Beginner' | 'Apprentice' | 'Practitioner' | 'Expert' | 'Master' | 'Grandmaster' | 'Legend';
        level: number; // 1-8
        progress: number; // 0-100%
    };
    xpHistory: IXPEntry[];
    groups: IGroupMembership[];
    stats: {
        totalHabitsCreated: number;
        totalCompletions: number;
        longestStreak: number;
        totalChainsCompleted: number;
        dailyBonusesEarned: number;
        totalGroupsJoined: number;
        joinedAt: Date;
    };
    createdAt: Date;
    updatedAt: Date;

}

export interface IXPEntry {
    date: Date;
    amount: number;
    source: 'habit_completion' | 'daily_bonus' | 'chain_completion' | 'streak_milestone' | 'group_activity';
    description: string;
}

export interface IGroupMembership {
    groupId: string;
    joinedAt: Date;
    role: 'member' | 'admin' | 'owner';
}

// Group Types
export interface IGroup {
    _id?: string;
    name: string;
    description?: string;
    owner: string; // clerkUserId
    isPrivate: boolean;
    settings: {
        allowInvites: boolean;
        requireApproval: boolean;
        maxMembers: number;
        xpMultiplier: number;
    };
    members: IGroupMember[];
    memberCount: number;
    invites: IGroupInvite[];
    recentActivity: IGroupActivity[];
    stats: {
        totalHabitsCompleted: number;
        totalChainsCompleted: number;
        totalXPEarned: number;
        mostActiveDay?: string;
        averageDailyActivity: number;
    };
    challenges: IGroupChallenge[];
    createdAt: Date;
    updatedAt: Date;
}

export interface IGroupMember {
    clerkUserId: string;
    userName: string;
    firstName?: string;
    lastName?: string;
    joinedAt: Date;
    role: 'member' | 'admin' | 'owner';
    isActive: boolean;
    totalXP: number;
    rank: string;
}

export interface IGroupInvite {
    inviteCode: string;
    createdBy: string;
    createdAt: Date;
    expiresAt: Date;
    maxUses: number;
    usedCount: number;
    isActive: boolean;
}

export interface IGroupActivity {
    type: 'member_joined' | 'member_left' | 'habit_completed' | 'chain_completed' | 'daily_goal_achieved';
    clerkUserId: string;
    userName: string;
    description: string;
    xpEarned: number;
    timestamp: Date;
}

export interface IGroupChallenge {
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    targetType: 'habit_completions' | 'total_xp' | 'streak_days';
    targetValue: number;
    xpReward: number;
    participants: {
        clerkUserId: string;
        progress: number;
        completed: boolean;
    }[];
    isActive: boolean;
}

// XP and Ranking constants
export const RANK_REQUIREMENTS = {
    1: { title: 'Novice', minXP: 0, maxXP: 499 },
    2: { title: 'Beginner', minXP: 500, maxXP: 1499 },
    3: { title: 'Apprentice', minXP: 1500, maxXP: 3499 },
    4: { title: 'Practitioner', minXP: 3500, maxXP: 6999 },
    5: { title: 'Expert', minXP: 7000, maxXP: 12499 },
    6: { title: 'Master', minXP: 12500, maxXP: 19999 },
    7: { title: 'Grandmaster', minXP: 20000, maxXP: 29999 },
    8: { title: 'Legend', minXP: 30000, maxXP: Infinity }
} as const;

export const XP_REWARDS = {
    HABIT_COMPLETION: {
        LOW: 10,
        MEDIUM: 15,
        HIGH: 25
    },
    DAILY_BONUS: {
        BASE: 50,
        STREAK_MULTIPLIER: 1.5 // Additional XP for streaks
    },
    CHAIN_COMPLETION: {
        BASE: 100,
        PER_HABIT: 20
    },
    STREAK_MILESTONES: {
        7: 100,
        30: 500,
        100: 1500,
        365: 5000
    }
} as const;