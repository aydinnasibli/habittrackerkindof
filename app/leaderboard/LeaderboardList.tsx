// app/leaderboard/LeaderboardList.tsx
'use client';

import { LeaderboardUser } from '@/lib/actions/leaderboard';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Crown, Star, Zap, TrendingUp, Calendar, ChevronRight, Flame, Trophy, Award, Sparkles, Target, Sword, Shield, Gem } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface LeaderboardListProps {
    users: LeaderboardUser[];
}

function getRankBadgeStyle(rankLevel: number): { bg: string; text: string; icon: React.ReactNode } {
    switch (rankLevel) {
        case 1:
            return {
                bg: 'bg-gray-100 dark:bg-gray-800',
                text: 'text-gray-800 dark:text-gray-200',
                icon: <Star className="w-3 h-3" />
            };
        case 2:
            return {
                bg: 'bg-green-100 dark:bg-green-900/30',
                text: 'text-green-800 dark:text-green-300',
                icon: <Zap className="w-3 h-3" />
            };
        case 3:
            return {
                bg: 'bg-blue-100 dark:bg-blue-900/30',
                text: 'text-blue-800 dark:text-blue-300',
                icon: <TrendingUp className="w-3 h-3" />
            };
        case 4:
            return {
                bg: 'bg-purple-100 dark:bg-purple-900/30',
                text: 'text-purple-800 dark:text-purple-300',
                icon: <Crown className="w-3 h-3" />
            };
        case 5:
            return {
                bg: 'bg-yellow-100 dark:bg-yellow-900/30',
                text: 'text-yellow-800 dark:text-yellow-300',
                icon: <Flame className="w-3 h-3" />
            };
        case 6:
            return {
                bg: 'bg-red-100 dark:bg-red-900/30',
                text: 'text-red-800 dark:text-red-300',
                icon: <Target className="w-3 h-3" />
            };
        case 7:
            return {
                bg: 'bg-pink-100 dark:bg-pink-900/30',
                text: 'text-pink-800 dark:text-pink-300',
                icon: <Gem className="w-3 h-3" />
            };
        case 8:
            return {
                bg: 'bg-orange-100 dark:bg-orange-900/30',
                text: 'text-orange-800 dark:text-orange-300',
                icon: <Sword className="w-3 h-3" />
            };
        default:
            return {
                bg: 'bg-muted',
                text: 'text-muted-foreground',
                icon: <Shield className="w-3 h-3" />
            };
    }
}

function getRankPosition(index: number): { display: React.ReactNode; bgColor: string; borderColor: string } {
    const position = index + 1;
    if (position === 1) return {
        display: (
            <div className="relative">
                <span className="text-2xl">👑</span>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-2 h-2 text-yellow-900" />
                </div>
            </div>
        ),
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        borderColor: 'border-yellow-500/50'
    };
    if (position === 2) return {
        display: <span className="text-2xl">🥈</span>,
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        borderColor: 'border-gray-500/50'
    };
    if (position === 3) return {
        display: <span className="text-2xl">🥉</span>,
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        borderColor: 'border-orange-500/50'
    };
    return {
        display: `#${position}`,
        bgColor: 'bg-muted',
        borderColor: 'border-border'
    };
}

function getCardStyle(index: number): { border: string; bg: string } {
    if (index === 0) return {
        border: 'border-2 border-yellow-500/30',
        bg: 'bg-yellow-50/50 dark:bg-yellow-900/10'
    };
    if (index === 1) return {
        border: 'border-2 border-gray-500/30',
        bg: 'bg-gray-50/50 dark:bg-gray-800/20'
    };
    if (index === 2) return {
        border: 'border-2 border-orange-500/30',
        bg: 'bg-orange-50/50 dark:bg-orange-900/10'
    };
    return {
        border: 'border border-border',
        bg: 'bg-card'
    };
}

export default function LeaderboardList({ users }: LeaderboardListProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="space-y-4 max-w-4xl mx-auto">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />
            ))}
        </div>;
    }

    if (users.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center">
                    <Crown className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">The Arena Awaits</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                    Be the first to enter the Hall of Legends and claim your throne!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 max-w-4xl mx-auto">
            <AnimatePresence>
                {users.map((user, index) => {
                    const rankPosition = getRankPosition(index);
                    const rankBadge = getRankBadgeStyle(user.rankLevel);
                    const cardStyle = getCardStyle(index);
                    const displayName = user.userName ||
                        `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                        'Anonymous Legend';

                    return (
                        <motion.div
                            key={user._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{
                                delay: index * 0.05,
                                duration: 0.3
                            }}
                            whileHover={{
                                scale: 1.01,
                                transition: { duration: 0.2 }
                            }}
                        >
                            <Link
                                href={`/leaderboard/profile/${user._id}`}
                                className={`group block ${cardStyle.bg} ${cardStyle.border} rounded-2xl p-6 hover:bg-accent transition-all duration-200 hover:shadow-lg`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4 flex-1">
                                        {/* Rank Position */}
                                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${rankPosition.bgColor} ${rankPosition.borderColor} border flex items-center justify-center`}>
                                            <span className="text-sm font-bold text-foreground">
                                                {rankPosition.display}
                                            </span>
                                        </div>

                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
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
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${rankBadge.bg} ${rankBadge.text}`}>
                                                    {rankBadge.icon}
                                                    {user.rankTitle}
                                                </span>
                                            </div>

                                            {/* Stats */}
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                    <span className="font-semibold text-foreground">
                                                        {user.totalCompletions.toLocaleString()}
                                                    </span>
                                                    <span className="text-muted-foreground">wins</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                                    <span className="font-semibold text-foreground">
                                                        {user.longestStreak}
                                                    </span>
                                                    <span className="text-muted-foreground">streak</span>
                                                </div>
                                                <div className="hidden md:flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    <span className="text-muted-foreground truncate">
                                                        {formatDistanceToNow(new Date(user.joinedAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Arrow and badges */}
                                    <div className="flex items-center space-x-2">
                                        {index < 3 && (
                                            <div className="flex space-x-1">
                                                <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                                <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                            </div>
                                        )}
                                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all duration-200" />
                                    </div>
                                </div>

                                {/* Progress bar for top 5 */}
                                {index < 5 && (
                                    <div className="mt-4 pt-4 border-t border-border">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Sparkles className="w-3 h-3 text-primary" />
                                                Dominance Level
                                            </span>
                                            <span className="text-sm font-medium text-foreground">
                                                {Math.min(100, Math.round((user.totalCompletions / Math.max(...users.map(u => u.totalCompletions))) * 100))}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <motion.div
                                                className="h-full bg-primary rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: `${Math.min(100, Math.round((user.totalCompletions / Math.max(...users.map(u => u.totalCompletions))) * 100))}%`
                                                }}
                                                transition={{ delay: (index * 0.1) + 0.3, duration: 0.8 }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Achievement badges for top 3 */}
                                {index === 0 && (
                                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        🏆 CHAMPION
                                    </div>
                                )}
                                {index === 1 && (
                                    <div className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        🥈 ELITE
                                    </div>
                                )}
                                {index === 2 && (
                                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        🥉 LEGEND
                                    </div>
                                )}
                            </Link>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {/* Call to action */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: users.length * 0.05 + 0.3 }}
                className="text-center mt-12 p-6 bg-card border border-border rounded-2xl"
            >
                <div className="flex items-center justify-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-bold text-foreground">Ready to Join the Legends?</h3>
                    <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <p className="text-muted-foreground max-w-xl mx-auto">
                    Every champion started with a single habit. Your journey to greatness begins today.
                </p>
            </motion.div>
        </div>
    );
}