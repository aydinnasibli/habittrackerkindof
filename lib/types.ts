// lib/types.ts
import { ObjectId } from 'mongodb';

export interface IHabit {
    _id?: string | ObjectId;
    clerkUserId: string;
    name: string;
    description: string;
    category: 'Mindfulness' | 'Health' | 'Learning' | 'Productivity' | 'Digital Wellbeing';
    frequency: 'Daily' | 'Weekdays' | 'Weekends' | 'Mon, Wed, Fri' | 'Tue, Thu';
    timeOfDay: 'Morning' | 'Afternoon' | 'Evening' | 'Throughout day';
    timeToComplete: string;
    priority: 'High' | 'Medium' | 'Low';
    streak: number;
    status: 'active' | 'paused' | 'archived';
    createdAt: Date;
    updatedAt: Date;
    completions: IHabitCompletion[];
    // Cache fields for performance
    lastCompletedAt?: Date;
    totalCompletions?: number;
    averageCompletionTime?: number; // in minutes
    timeToCompleteMinutes?: number; // cached duration in minutes
}

export interface IHabitCompletion {
    date: Date;
    completed: boolean;
    notes?: string;
    completedAt?: Date; // Timestamp when marked complete
    timeSpent?: number; // in minutes
}
// Add after IHabitCompletion
export interface IHabitCompletionDocument {
    _id?: string | ObjectId;
    habitId: string | ObjectId;
    clerkUserId: string;
    date: Date;
    completed: boolean;
    notes?: string;
    completedAt?: Date;
    timeSpent?: number;
}
export interface IHabitChain {
    _id?: string | ObjectId;
    clerkUserId: string;
    name: string;
    description: string;
    habits: IHabitChainItem[];
    timeOfDay: string;
    totalTime: string;
    totalTimeMinutes?: number; // Cached total time in minutes for sorting
    createdAt: Date;
    updatedAt: Date;
    // Performance fields
    isActive?: boolean;
    lastUsedAt?: Date;
    totalSessions?: number;
    avgCompletionRate?: number; // 0-100
}

export interface IHabitChainItem {
    habitId: string;
    habitName: string;
    duration: string;
    durationMinutes?: number; // Cached duration in minutes
    order: number;
}

export interface IChainSession {
    _id?: string | ObjectId;
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
    totalDurationMinutes?: number; // Cached for performance
    actualDuration?: number; // in minutes
    pausedAt?: Date;
    pauseDuration: number; // total pause time in minutes
    breakStartedAt?: Date;
    onBreak: boolean;
    createdAt: Date;
    updatedAt: Date;
    // Performance optimizations
    completionRate?: number; // 0-100, calculated on save
    xpEarned?: number; // Cached XP for this session
}

export interface IChainSessionHabit {
    habitId: string;
    habitName: string;
    duration: string;
    durationMinutes?: number; // Cached duration
    order: number;
    startedAt?: Date;
    completedAt?: Date;
    status: 'pending' | 'active' | 'completed' | 'skipped';
    notes?: string;
    timeSpent?: number; // Actual time spent in minutes
}

export interface IProfile {
    _id?: string | ObjectId;
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
        showStreak?: boolean;
        showProgress?: boolean;
        showRank?: boolean;
    };
    goals: {
        dailyHabitTarget: number;
        weeklyGoal: number;
    };
    // Simplified XP system - only total XP matters, rank is calculated from this
    xp: {
        total: number;
        lastUpdated?: Date; // Track when XP was last updated
    };
    // Rank is determined by total XP using RANK_REQUIREMENTS
    rank: {
        title: 'Novice' | 'Beginner' | 'Apprentice' | 'Practitioner' | 'Expert' | 'Master' | 'Grandmaster' | 'Legend';
        level: number; // 1-8 corresponding to rank titles
        progress: number; // 0-100% progress within current rank
        lastCalculated?: Date; // Track when rank was last calculated
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
        // Additional performance stats
        currentStreak?: number;
        lastActivityAt?: Date;
        avgDailyXP?: number;
    };
    createdAt: Date;
    updatedAt: Date;
    // Cache fields for leaderboard performance
    rankCache?: {
        globalPosition?: number;
        lastUpdated: Date;
    };
}

export interface IXPEntry {
    date: Date;
    amount: number;
    source: 'habit_completion' | 'daily_bonus' | 'chain_completion' | 'streak_milestone' | 'group_activity';
    description: string;
    metadata?: Record<string, any>; // Store additional context
}

export interface IGroupMembership {
    groupId: string | ObjectId;
    joinedAt: Date;
    role: 'member' | 'admin' | 'owner';
    isActive?: boolean; // For soft leaving groups
}

// Group Types
export interface IGroup {
    _id?: string | ObjectId;
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
        // Additional performance stats
        lastActivityAt?: Date;
        peakMemberCount?: number;
    };
    challenges: IGroupChallenge[];
    createdAt: Date;
    updatedAt: Date;
    // Performance optimizations
    isActive?: boolean; // Groups with recent activity
    searchTags?: string[]; // For better search performance
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
    // Performance fields
    lastActiveAt?: Date;
    contributionScore?: number; // For member ranking within group
}

export interface IGroupInvite {
    inviteCode: string;
    createdBy: string;
    createdAt: Date;
    expiresAt: Date;
    maxUses: number;
    usedCount: number;
    isActive: boolean;
    // Track usage
    usedBy?: { clerkUserId: string; usedAt: Date }[];
}

export interface IGroupActivity {
    type: 'member_joined' | 'member_left' | 'habit_completed' | 'chain_completed' | 'daily_goal_achieved';
    clerkUserId: string;
    userName: string;
    description: string;
    xpEarned: number;
    timestamp: Date;
    metadata?: Record<string, any>; // Store additional context
}

export interface IGroupChallenge {
    _id?: string | ObjectId;
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
        joinedAt: Date;
        completedAt?: Date;
    }[];
    isActive: boolean;
    // Performance fields
    participantCount?: number;
    completionRate?: number; // 0-100
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

// Utility types for better type safety
export type RankTitle = keyof typeof RANK_REQUIREMENTS extends number ? never :
    typeof RANK_REQUIREMENTS[keyof typeof RANK_REQUIREMENTS]['title'];

export type HabitCategory = IHabit['category'];
export type HabitFrequency = IHabit['frequency'];
export type HabitTimeOfDay = IHabit['timeOfDay'];
export type HabitPriority = IHabit['priority'];
export type HabitStatus = IHabit['status'];

// Database query optimization types
export interface PaginationOptions {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface HabitQueryFilters {
    clerkUserId: string;
    status?: HabitStatus;
    category?: HabitCategory;
    priority?: HabitPriority;
    timeOfDay?: HabitTimeOfDay;
    createdAfter?: Date;
    createdBefore?: Date;
}

export interface GroupQueryFilters {
    isPrivate?: boolean;
    memberCount?: { min?: number; max?: number };
    isActive?: boolean;
    createdAfter?: Date;
    searchTerm?: string;
}