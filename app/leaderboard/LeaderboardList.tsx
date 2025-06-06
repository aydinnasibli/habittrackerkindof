// app/leaderboard/LeaderboardList.tsx
'use client';

import { LeaderboardUser } from '@/lib/actions/leaderboard';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
    Crown, Star, Zap, TrendingUp, Calendar, ChevronRight,
    Flame, Trophy, Award, Sparkles, Target, Sword, Shield, Gem
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo, useCallback } from 'react';

interface LeaderboardListProps {
    users: LeaderboardUser[];
}

interface RankBadgeStyle {
    bg: string;
    text: string;
    icon: React.ReactNode;
}

interface RankPosition {
    display: React.ReactNode;
    bgColor: string;
    borderColor: string;
}

interface CardStyle {
    border: string;
    bg: string;
}

// Memoized helper functions for better performance
const getRankBadgeStyle = (rankLevel: number): RankBadgeStyle => {
    const styles: Record<number, RankBadgeStyle> = {
        1: {
            bg: 'bg-gray-100 dark:bg-gray-800',
            text: 'text-gray-800 dark:text-gray-200',
            icon: <Star className="w-3 h-3" aria-hidden="true" />
        },
        2: {
            bg: 'bg-green-100 dark:bg-green-900/30',
            text: 'text-green-800 dark:text-green-300',
            icon: <Zap className="w-3 h-3" aria-hidden="true" />
        },
        3: {
            bg: 'bg-blue-100 dark:bg-blue-900/30',
            text: 'text-blue-800 dark:text-blue-300',
            icon: <TrendingUp className="w-3 h-3" aria-hidden="true" />
        },
        4: {
            bg: 'bg-purple-100 dark:bg-purple-900/30',
            text: 'text-purple-800 dark:text-purple-300',
            icon: <Crown className="w-3 h-3" aria-hidden="true" />
        },
        5: {
            bg: 'bg-yellow-100 dark:bg-yellow-900/30',
            text: 'text-yellow-800 dark:text-yellow-300',
            icon: <Flame className="w-3 h-3" aria-hidden="true" />
        },
        6: {
            bg: 'bg-red-100 dark:bg-red-900/30',
            text: 'text-red-800 dark:text-red-300',
            icon: <Target className="w-3 h-3" aria-hidden="true" />
        },
        7: {
            bg: 'bg-pink-100 dark:bg-pink-900/30',
            text: 'text-pink-800 dark:text-pink-300',
            icon: <Gem className="w-3 h-3" aria-hidden="true" />
        },
        8: {
            bg: 'bg-orange-100 dark:bg-orange-900/30',
            text: 'text-orange-800 dark:text-orange-300',
            icon: <Sword className="w-3 h-3" aria-hidden="true" />
        }
    };

    return styles[rankLevel] || {
        bg: 'bg-muted',
        text: 'text-muted-foreground',
        icon: <Shield className="w-3 h-3" aria-hidden="true" />
    };
};

const getRankPosition = (index: number): RankPosition => {
    const position = index + 1;

    if (position === 1) {
        return {
            display: (
                <div className="relative" role="img" aria-label="First place">
                    <span className="text-2xl" aria-hidden="true">👑</span>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Sparkles className="w-2 h-2 text-yellow-900" aria-hidden="true" />
                    </div>
                </div>
            ),
            bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
            borderColor: 'border-yellow-500/50'
        };
    }

    if (position === 2) {
        return {
            display: <span className="text-2xl" role="img" aria-label="Second place">🥈</span>,
            bgColor: 'bg-gray-100 dark:bg-gray-800',
            borderColor: 'border-gray-500/50'
        };
    }

    if (position === 3) {
        return {
            display: <span className="text-2xl" role="img" aria-label="Third place">🥉</span>,
            bgColor: 'bg-orange-100 dark:bg-orange-900/30',
            borderColor: 'border-orange-500/50'
        };
    }

    return {
        display: `#${position}`,
        bgColor: 'bg-muted',
        borderColor: 'border-border'
    };
};

const getCardStyle = (index: number): CardStyle => {
    const styles: Record<number, CardStyle> = {
        0: {
            border: 'border-2 border-yellow-500/30',
            bg: 'bg-yellow-50/50 dark:bg-yellow-900/10'
        },
        1: {
            border: 'border-2 border-gray-500/30',
            bg: 'bg-gray-50/50 dark:bg-gray-800/20'
        },
        2: {
            border: 'border-2 border-orange-500/30',
            bg: 'bg-orange-50/50 dark:bg-orange-900/10'
        }
    };

    return styles[index] || {
        border: 'border border-border',
        bg: 'bg-card'
    };
};

const getAchievementBadge = (index: number) => {
    const badges = {
        0: { label: '🏆 CHAMPION', bg: 'bg-yellow-500' },
        1: { label: '🥈 ELITE', bg: 'bg-gray-500' },
        2: { label: '🥉 LEGEND', bg: 'bg-orange-500' }
    };

    return badges[index as keyof typeof badges];
};

// Loading skeleton component
const LoadingSkeleton = () => (
    <div className="space-y-4 max-w-4xl mx-auto" role="status" aria-label="Loading leaderboard">
        {Array.from({ length: 5 }, (_, i) => (
            <div
                key={i}
                className="h-28 bg-muted rounded-2xl animate-pulse"
                aria-hidden="true"
            />
        ))}
        <span className="sr-only">Loading leaderboard data...</span>
    </div>
);

// Empty state component  
const EmptyState = () => (
    <div className="text-center py-20" role="status">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center">
            <Crown className="w-10 h-10 text-primary" aria-hidden="true" />
        </div>
        <h3 className="text-2xl font-bold mb-4 text-foreground">The Arena Awaits</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
            Be the first to enter the Hall of Legends and claim your throne!
        </p>
    </div>
);

// User card component for better organization
const UserCard = ({ user, index, maxCompletions }: {
    user: LeaderboardUser;
    index: number;
    maxCompletions: number;
}) => {
    const rankPosition = useMemo(() => getRankPosition(index), [index]);
    const rankBadge = useMemo(() => getRankBadgeStyle(user.rankLevel), [user.rankLevel]);
    const cardStyle = useMemo(() => getCardStyle(index), [index]);
    const achievementBadge = useMemo(() => getAchievementBadge(index), [index]);

    const displayName = useMemo(() => {
        return user.userName ||
            `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
            'Anonymous Legend';
    }, [user.userName, user.firstName, user.lastName]);

    const dominancePercentage = useMemo(() =>
        Math.min(100, Math.round((user.totalCompletions / maxCompletions) * 100)),
        [user.totalCompletions, maxCompletions]
    );

    const formattedJoinDate = useMemo(() => {
        try {
            return formatDistanceToNow(new Date(user.joinedAt), { addSuffix: true });
        } catch (error) {
            console.warn('Invalid date format for user:', user._id);
            return 'Recently joined';
        }
    }, [user.joinedAt, user._id]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
            className="relative"
        >
            <Link
                href={`/leaderboard/profile/${user._id}`}
                className={`group block ${cardStyle.bg} ${cardStyle.border} rounded-2xl p-6 hover:bg-accent transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                aria-label={`View ${displayName}'s profile - Rank ${index + 1}`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                        {/* Rank Position */}
                        <div
                            className={`flex-shrink-0 w-12 h-12 rounded-xl ${rankPosition.bgColor} ${rankPosition.borderColor} border flex items-center justify-center`}
                            aria-label={`Rank ${index + 1}`}
                        >
                            <span className="text-sm font-bold text-foreground">
                                {rankPosition.display}
                            </span>
                        </div>

                        {/* Avatar */}
                        <div
                            className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center"
                            role="img"
                            aria-label={`${displayName}'s avatar`}
                        >
                            <span className="text-primary font-semibold text-lg">
                                {displayName.charAt(0).toUpperCase()}
                            </span>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                                    {displayName}
                                </h3>
                                <span
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${rankBadge.bg} ${rankBadge.text}`}
                                    aria-label={`Rank: ${user.rankTitle}`}
                                >
                                    {rankBadge.icon}
                                    {user.rankTitle}
                                </span>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                                    <span className="font-semibold text-foreground">
                                        {user.totalCompletions.toLocaleString()}
                                    </span>
                                    <span className="text-muted-foreground">wins</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" aria-hidden="true" />
                                    <span className="font-semibold text-foreground">
                                        {user.longestStreak}
                                    </span>
                                    <span className="text-muted-foreground">streak</span>
                                </div>
                                <div className="hidden md:flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                                    <span className="text-muted-foreground truncate">
                                        {formattedJoinDate}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Arrow and badges */}
                    <div className="flex items-center space-x-2">
                        {index < 3 && (
                            <div className="flex space-x-1" aria-label="Top 3 achievement">
                                <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
                                <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                            </div>
                        )}
                        <ChevronRight
                            className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all duration-200"
                            aria-hidden="true"
                        />
                    </div>
                </div>

                {/* Progress bar for top 5 */}
                {index < 5 && (
                    <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-primary" aria-hidden="true" />
                                Dominance Level
                            </span>
                            <span className="text-sm font-medium text-foreground">
                                {dominancePercentage}%
                            </span>
                        </div>
                        <div
                            className="w-full bg-muted rounded-full h-2"
                            role="progressbar"
                            aria-valuenow={dominancePercentage}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Dominance level: ${dominancePercentage}%`}
                        >
                            <motion.div
                                className="h-full bg-primary rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${dominancePercentage}%` }}
                                transition={{ delay: (index * 0.1) + 0.3, duration: 0.8 }}
                            />
                        </div>
                    </div>
                )}

                {/* Achievement badges for top 3 */}
                {achievementBadge && (
                    <div
                        className={`absolute -top-2 -right-2 ${achievementBadge.bg} text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg`}
                        aria-label={achievementBadge.label}
                    >
                        {achievementBadge.label}
                    </div>
                )}
            </Link>
        </motion.div>
    );
};

// Call to action component
const CallToAction = ({ userCount }: { userCount: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: userCount * 0.05 + 0.3 }}
        className="text-center mt-12 p-6 bg-card border border-border rounded-2xl"
    >
        <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
            <h3 className="text-xl font-bold text-foreground">Ready to Join the Legends?</h3>
            <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
        </div>
        <p className="text-muted-foreground max-w-xl mx-auto">
            Every champion started with a single habit. Your journey to greatness begins today.
        </p>
    </motion.div>
);

export default function LeaderboardList({ users }: LeaderboardListProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Memoize expensive calculations
    const maxCompletions = useMemo(() =>
        users.length > 0 ? Math.max(...users.map(u => u.totalCompletions)) : 1,
        [users]
    );

    // Early returns for loading and empty states
    if (!mounted) {
        return <LoadingSkeleton />;
    }

    if (users.length === 0) {
        return <EmptyState />;
    }

    return (
        <div className="space-y-4 max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
                {users.map((user, index) => (
                    <UserCard
                        key={user._id}
                        user={user}
                        index={index}
                        maxCompletions={maxCompletions}
                    />
                ))}
            </AnimatePresence>

            <CallToAction userCount={users.length} />
        </div>
    );
}