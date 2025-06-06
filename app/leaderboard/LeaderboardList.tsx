// app/leaderboard/LeaderboardList.tsx
'use client';

import { LeaderboardUser } from '@/lib/actions/leaderboard';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Crown, Star, Zap, TrendingUp, Calendar, ChevronRight, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardListProps {
    users: LeaderboardUser[];
}

function getRankBadgeStyle(rankLevel: number): { bg: string; text: string; icon: React.ReactNode } {
    switch (rankLevel) {
        case 1:
            return {
                bg: 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600',
                text: 'text-gray-800 dark:text-gray-100',
                icon: <Star className="w-3 h-3" />
            };
        case 2:
            return {
                bg: 'bg-gradient-to-r from-green-100 to-green-200 dark:from-green-800 dark:to-green-700',
                text: 'text-green-800 dark:text-green-100',
                icon: <Zap className="w-3 h-3" />
            };
        case 3:
            return {
                bg: 'bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-700',
                text: 'text-blue-800 dark:text-blue-100',
                icon: <TrendingUp className="w-3 h-3" />
            };
        case 4:
            return {
                bg: 'bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-700',
                text: 'text-purple-800 dark:text-purple-100',
                icon: <Crown className="w-3 h-3" />
            };
        case 5:
            return {
                bg: 'bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-800 dark:to-yellow-700',
                text: 'text-yellow-800 dark:text-yellow-100',
                icon: <Flame className="w-3 h-3" />
            };
        case 6:
            return {
                bg: 'bg-gradient-to-r from-red-100 to-red-200 dark:from-red-800 dark:to-red-700',
                text: 'text-red-800 dark:text-red-100',
                icon: <Star className="w-3 h-3" />
            };
        case 7:
            return {
                bg: 'bg-gradient-to-r from-pink-100 to-pink-200 dark:from-pink-800 dark:to-pink-700',
                text: 'text-pink-800 dark:text-pink-100',
                icon: <Crown className="w-3 h-3" />
            };
        case 8:
            return {
                bg: 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500',
                text: 'text-white',
                icon: <Crown className="w-3 h-3" />
            };
        default:
            return {
                bg: 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600',
                text: 'text-gray-800 dark:text-gray-100',
                icon: <Star className="w-3 h-3" />
            };
    }
}

function getRankPosition(index: number): { display: string; style: string } {
    const position = index + 1;
    if (position === 1) return { display: '🥇', style: 'text-2xl' };
    if (position === 2) return { display: '🥈', style: 'text-2xl' };
    if (position === 3) return { display: '🥉', style: 'text-2xl' };
    return { display: `#${position}`, style: 'text-lg font-bold text-muted-foreground' };
}

function getCardGlow(index: number): string {
    if (index === 0) return 'ring-2 ring-yellow-400/50 shadow-yellow-400/20';
    if (index === 1) return 'ring-2 ring-gray-400/50 shadow-gray-400/20';
    if (index === 2) return 'ring-2 ring-orange-400/50 shadow-orange-400/20';
    return 'hover:ring-1 hover:ring-primary/30';
}

export default function LeaderboardList({ users }: LeaderboardListProps) {
    if (users.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted/20 flex items-center justify-center">
                    <Crown className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">No Champions Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                    Be the first to build consistent habits and claim your spot on the leaderboard!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3 max-w-4xl mx-auto">
            {users.map((user, index) => {
                const rankPosition = getRankPosition(index);
                const rankBadge = getRankBadgeStyle(user.rankLevel);
                const cardGlow = getCardGlow(index);
                const displayName = user.userName ||
                    `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                    'Anonymous Champion';

                return (
                    <motion.div
                        key={user._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Link
                            href={`/leaderboard/profile/${user._id}`}
                            className={`group block p-5 bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl transition-all duration-300 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 ${cardGlow}`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-5 flex-1">
                                    {/* Rank Position */}
                                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                                        <span className={rankPosition.style}>
                                            {rankPosition.display}
                                        </span>
                                    </div>

                                    {/* Avatar */}
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/20 flex items-center justify-center">
                                        <span className="text-primary font-bold text-lg">
                                            {displayName.charAt(0).toUpperCase()}
                                        </span>
                                    </div>

                                    {/* User Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h3 className="font-bold text-lg text-foreground truncate">
                                                {displayName}
                                            </h3>
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${rankBadge.bg} ${rankBadge.text}`}>
                                                {rankBadge.icon}
                                                {user.rankTitle}
                                            </span>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <TrendingUp className="w-4 h-4" />
                                                <span className="font-medium text-foreground">
                                                    {user.totalCompletions.toLocaleString()}
                                                </span>
                                                <span>completions</span>
                                            </div>
                                            <span className="text-border">•</span>
                                            <div className="flex items-center gap-1">
                                                <Flame className="w-4 h-4 text-orange-500" />
                                                <span className="font-medium text-foreground">
                                                    {user.longestStreak}
                                                </span>
                                                <span>day streak</span>
                                            </div>
                                            <span className="text-border hidden sm:inline">•</span>
                                            <div className="hidden sm:flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>
                                                    {formatDistanceToNow(new Date(user.joinedAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Arrow */}
                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                            </div>

                            {/* Progress Bar for top users */}
                            {index < 3 && (
                                <div className="mt-4 pt-4 border-t border-border/30">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-muted-foreground">Dominance Level</span>
                                        <span className="text-xs font-medium text-foreground">
                                            {Math.min(100, Math.round((user.totalCompletions / Math.max(...users.map(u => u.totalCompletions))) * 100))}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-muted/30 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-primary/60 to-primary h-2 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.min(100, Math.round((user.totalCompletions / Math.max(...users.map(u => u.totalCompletions))) * 100))}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </Link>
                    </motion.div>
                );
            })}
        </div>
    );
}