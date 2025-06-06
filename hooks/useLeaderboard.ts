// hooks/useLeaderboard.ts
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { LeaderboardUser } from '@/lib/actions/leaderboard';

interface LeaderboardStats {
    totalUsers: number;
    totalCompletions: number;
    averageStreak: number;
    topStreak: number;
    newChampionsThisWeek: number;
    growthRate: number;
}

interface UseLeaderboardReturn {
    users: LeaderboardUser[];
    stats: LeaderboardStats;
    loading: boolean;
    error: string | null;
    refreshData: () => Promise<void>;
    searchUsers: (query: string) => LeaderboardUser[];
    filterByRank: (rankLevel: number) => LeaderboardUser[];
    getUserPosition: (userId: string) => number;
    getTopPerformers: (count: number) => LeaderboardUser[];
    isUserInTop: (userId: string, topCount: number) => boolean;
}

export function useLeaderboard(initialUsers: LeaderboardUser[] = []): UseLeaderboardReturn {
    const [users, setUsers] = useState<LeaderboardUser[]>(initialUsers);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    // Calculate comprehensive stats
    const stats = useMemo((): LeaderboardStats => {
        if (users.length === 0) {
            return {
                totalUsers: 0,
                totalCompletions: 0,
                averageStreak: 0,
                topStreak: 0,
                newChampionsThisWeek: 0,
                growthRate: 0
            };
        }

        const totalCompletions = users.reduce((sum, user) => sum + user.totalCompletions, 0);
        const averageStreak = Math.round(
            users.reduce((sum, user) => sum + user.longestStreak, 0) / users.length
        );
        const topStreak = Math.max(...users.map(user => user.longestStreak));

        // Calculate new champions this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const newChampionsThisWeek = users.filter(
            user => new Date(user.joinedAt) > oneWeekAgo
        ).length;

        // Calculate growth rate (simplified)
        const growthRate = users.length > 0 ? (newChampionsThisWeek / users.length) * 100 : 0;

        return {
            totalUsers: users.length,
            totalCompletions,
            averageStreak,
            topStreak,
            newChampionsThisWeek,
            growthRate: Math.round(growthRate * 100) / 100
        };
    }, [users]);

    // Refresh data function
    const refreshData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // In a real app, this would fetch from your API
            // For now, we'll simulate a refresh
            await new Promise(resolve => setTimeout(resolve, 1000));
            setLastRefresh(new Date());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to refresh data');
        } finally {
            setLoading(false);
        }
    }, []);

    // Search users by name or username
    const searchUsers = useCallback((query: string): LeaderboardUser[] => {
        if (!query.trim()) return users;

        const searchTerm = query.toLowerCase().trim();
        return users.filter(user => {
            const displayName = user.userName ||
                `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                'Anonymous Champion';

            return displayName.toLowerCase().includes(searchTerm) ||
                user.rankTitle.toLowerCase().includes(searchTerm);
        });
    }, [users]);

    // Filter users by rank level
    const filterByRank = useCallback((rankLevel: number): LeaderboardUser[] => {
        return users.filter(user => user.rankLevel === rankLevel);
    }, [users]);

    // Get user position in leaderboard
    const getUserPosition = useCallback((userId: string): number => {
        const index = users.findIndex(user => user._id === userId);
        return index === -1 ? -1 : index + 1;
    }, [users]);

    // Get top N performers
    const getTopPerformers = useCallback((count: number): LeaderboardUser[] => {
        return users.slice(0, Math.min(count, users.length));
    }, [users]);

    // Check if user is in top N
    const isUserInTop = useCallback((userId: string, topCount: number): boolean => {
        const position = getUserPosition(userId);
        return position !== -1 && position <= topCount;
    }, [getUserPosition]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            refreshData();
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, [refreshData]);

    // Update users when initialUsers changes
    useEffect(() => {
        setUsers(initialUsers);
    }, [initialUsers]);

    return {
        users,
        stats,
        loading,
        error,
        refreshData,
        searchUsers,
        filterByRank,
        getUserPosition,
        getTopPerformers,
        isUserInTop
    };
}

// Achievement system hook
export function useAchievements(user: LeaderboardUser | null) {
    const achievements = useMemo(() => {
        if (!user) return [];

        const achievements = [];

        // Completion milestones
        if (user.totalCompletions >= 1000) {
            achievements.push({
                id: 'master',
                title: 'Master of Habits',
                description: '1000+ completions achieved',
                icon: '🏆',
                rarity: 'legendary'
            });
        } else if (user.totalCompletions >= 500) {
            achievements.push({
                id: 'expert',
                title: 'Habit Expert',
                description: '500+ completions achieved',
                icon: '⭐',
                rarity: 'epic'
            });
        } else if (user.totalCompletions >= 100) {
            achievements.push({
                id: 'dedicated',
                title: 'Dedicated Builder',
                description: '100+ completions achieved',
                icon: '💪',
                rarity: 'rare'
            });
        }

        // Streak achievements
        if (user.longestStreak >= 365) {
            achievements.push({
                id: 'unstoppable',
                title: 'Unstoppable Force',
                description: '365+ day streak',
                icon: '🔥',
                rarity: 'legendary'
            });
        } else if (user.longestStreak >= 100) {
            achievements.push({
                id: 'consistent',
                title: 'Consistency King',
                description: '100+ day streak',
                icon: '⚡',
                rarity: 'epic'
            });
        } else if (user.longestStreak >= 30) {
            achievements.push({
                id: 'persistent',
                title: 'Persistent Champion',
                description: '30+ day streak',
                icon: '🎯',
                rarity: 'rare'
            });
        }

        // Time-based achievements
        const joinDate = new Date(user.joinedAt);
        const now = new Date();
        const daysSinceJoined = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceJoined >= 365) {
            achievements.push({
                id: 'veteran',
                title: 'Veteran Champion',
                description: '1+ year in the arena',
                icon: '🛡️',
                rarity: 'epic'
            });
        } else if (daysSinceJoined >= 30) {
            achievements.push({
                id: 'committed',
                title: 'Committed Warrior',
                description: '30+ days in the arena',
                icon: '⚔️',
                rarity: 'rare'
            });
        }

        return achievements;
    }, [user]);

    return achievements;
}

// Animation control hook
export function useLeaderboardAnimations() {
    const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
    const [animationSpeed, setAnimationSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');

    const toggleVisibility = useCallback((id: string) => {
        setIsVisible(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    }, []);

    const setVisible = useCallback((id: string, visible: boolean) => {
        setIsVisible(prev => ({
            ...prev,
            [id]: visible
        }));
    }, []);

    const resetAnimations = useCallback(() => {
        setIsVisible({});
    }, []);

    // Respect user's motion preferences
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        const handleChange = (e: MediaQueryListEvent) => {
            if (e.matches) {
                setAnimationSpeed('slow');
            } else {
                setAnimationSpeed('normal');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        handleChange({ matches: mediaQuery.matches } as MediaQueryListEvent);

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return {
        isVisible,
        animationSpeed,
        toggleVisibility,
        setVisible,
        resetAnimations
    };
}

// Performance monitoring hook
export function useLeaderboardPerformance() {
    const [renderTime, setRenderTime] = useState<number>(0);
    const [memoryUsage, setMemoryUsage] = useState<number>(0);

    useEffect(() => {
        const startTime = performance.now();

        // Measure render time
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const renderEntry = entries.find(entry => entry.name === 'leaderboard-render');
            if (renderEntry) {
                setRenderTime(renderEntry.duration);
            }
        });

        observer.observe({ entryTypes: ['measure'] });

        // Measure memory usage (if available)
        if ('memory' in performance) {
            const memory = (performance as any).memory;
            setMemoryUsage(memory.usedJSHeapSize / 1024 / 1024); // MB
        }

        return () => {
            observer.disconnect();
            performance.mark('leaderboard-render-end');
            performance.measure('leaderboard-render', 'leaderboard-render-start', 'leaderboard-render-end');
        };
    }, []);

    useEffect(() => {
        performance.mark('leaderboard-render-start');
    }, []);

    return {
        renderTime,
        memoryUsage
    };
}