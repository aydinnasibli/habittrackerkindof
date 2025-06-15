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
        showRank: boolean;
    };
    goals: {
        dailyHabitTarget: number;
        weeklyGoal: number;
    };
    // Simplified XP system - only total XP matters, rank is calculated from this
    xp: {
        total: number;
    };
    // Rank is determined by total XP using RANK_REQUIREMENTS
    rank: {
        title: 'Novice' | 'Beginner' | 'Apprentice' | 'Practitioner' | 'Expert' | 'Master' | 'Grandmaster' | 'Legend';
        level: number; // 1-8 corresponding to rank titles
        progress: number; // 0-100% progress within current rank
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

// XP and Ranking System - Clear rank requirements based on total XP
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
    // Individual habit completion (both standalone and in chains)
    HABIT_COMPLETION: {
        LOW: 15,      // Low priority habits
        MEDIUM: 20,   // Medium priority habits  
        HIGH: 30      // High priority habits
    },

    // Chain habit completion (slightly lower than standalone to balance with chain bonus)
    CHAIN_HABIT_COMPLETION: {
        LOW: 20,      // Low priority habits in chains
        MEDIUM: 25,   // Medium priority habits in chains
        HIGH: 30      // High priority habits in chains
    },

    // Daily bonus for completing all scheduled habits
    DAILY_BONUS: {
        BASE: 50,           // Base daily bonus for completing all habits
        STREAK_MULTIPLIER: 1.5  // Multiplier bonus for maintaining streaks
    },

    // Chain completion bonuses based on completion rate
    CHAIN_COMPLETION: {
        // Perfect completion (100% habits completed)
        PERFECT: {
            BASE: 100,      // Base XP for perfect chain completion
            PER_HABIT: 15   // Additional XP per habit in the chain
        },
        // Good completion (80-99% habits completed)
        GOOD: {
            BASE: 60,       // Base XP for good chain completion
            PER_HABIT: 10   // Additional XP per completed habit
        },
        // Partial completion (50-79% habits completed)
        PARTIAL: {
            BASE: 30,       // Base XP for partial chain completion
            PER_HABIT: 5    // Additional XP per completed habit
        }
        // Below 50% completion = no chain bonus (only individual habit XP)
    },

    // Streak milestone rewards
    STREAK_MILESTONES: {
        7: 100,     // 1 week streak
        30: 500,    // 1 month streak  
        100: 1500,  // 100 day streak
        365: 5000   // 1 year streak
    }
} as const;



// lib/types.ts
export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface ChatResponse {
    content: string;
    usage?: {
        input_tokens: number;
        output_tokens: number;
    };
}

export interface ChatError {
    error: string;
}

export interface RepoFile {
    name: string;
    path: string;
    type: 'file' | 'dir';
    content?: string;
    size?: number;
}

export interface GitHubRepo {
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    description?: string;
}

export interface RepoContext {
    repoUrl: string;
    selectedFiles: RepoFile[];
    repoStructure: RepoFile[];
}