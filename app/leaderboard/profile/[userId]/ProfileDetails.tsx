// app/leaderboard/profile/[userId]/ProfileDetails.tsx
'use client';

import { UserProfile } from '@/lib/actions/leaderboard';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, Target, Zap, Award, TrendingUp, Trophy, Crown, Star, Flame, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileDetailsProps {
    user: UserProfile;
}

function getRankBadgeStyle(rankLevel: number): { bg: string; text: string; icon: React.ReactNode } {
    switch (rankLevel) {
        case 1:
            return {
                bg: 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600',
                text: 'text-gray-800 dark:text-gray-100',
                icon: <Star className="w-4 h-4" />
            };
        case 2:
            return {
                bg: 'bg-gradient-to-r from-green-100 to-green-200 dark:from-green-800 dark:to-green-700',
                text: 'text-green-800 dark:text-green-100',
                icon: <Zap className="w-4 h-4" />
            };
        case 3:
            return {
                bg: 'bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-700',
                text: 'text-blue-800 dark:text-blue-100',
                icon: <TrendingUp className="w-4 h-4" />
            };
        case 4:
            return {
                bg: 'bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-700',
                text: 'text-purple-800 dark:text-purple-100',
                icon: <Crown className="w-4 h-4" />
            };
        case 5:
            return {
                bg: 'bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-800 dark:to-yellow-700',
                text: 'text-yellow-800 dark:text-yellow-100',
                icon: <Flame className="w-4 h-4" />
            };
        case 6:
            return {
                bg: 'bg-gradient-to-r from-red-100 to-red-200 dark:from-red-800 dark:to-red-700',
                text: 'text-red-800 dark:text-red-100',
                icon: <Star className="w-4 h-4" />
            };
        case 7:
            return {
                bg: 'bg-gradient-to-r from-pink-100 to-pink-200 dark:from-pink-800 dark:to-pink-700',
                text: 'text-pink-800 dark:text-pink-100',
                icon: <Crown className="w-4 h-4" />
            };
        case 8:
            return {
                bg: 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500',
                text: 'text-white',
                icon: <Crown className="w-4 h-4" />
            };
        default:
            return {
                bg: 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600',
                text: 'text-gray-800 dark:text-gray-100',
                icon: <Star className="w-4 h-4" />
            };
    }
}

export default function ProfileDetails({ user }: ProfileDetailsProps) {
    const displayName = user.userName ||
        `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        'Anonymous Champion';

    const rankBadge = getRankBadgeStyle(user.rankLevel);

    const stats = [
        {
            icon: Target,
            label: 'Total Completions',
            value: user.totalCompletions.toLocaleString(),
            description: 'Habits completed',
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10'
        },
        {
            icon: Flame,
            label: 'Longest Streak',
            value: `${user.longestStreak}`,
            description: 'consecutive days',
            color: 'text-orange-500',
            bgColor: 'bg-orange-500/10'
        },
        {
            icon: Zap,
            label: 'Habits Created',
            value: user.totalHabitsCreated.toLocaleString(),
            description: 'unique habits',
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10'
        },
        {
            icon: Trophy,
            label: 'Chains Completed',
            value: user.totalChainsCompleted.toLocaleString(),
            description: 'achievement chains',
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-500/10'
        },
        {
            icon: Award,
            label: 'Daily Bonuses',
            value: user.dailyBonusesEarned.toLocaleString(),
            description: 'bonus points earned',
            color: 'text-green-500',
            bgColor: 'bg-green-500/10'
        },
        {
            icon: Calendar,
            label: 'Member Since',
            value: formatDistanceToNow(new Date(user.joinedAt), { addSuffix: true }),
            description: 'journey started',
            color: 'text-gray-500',
            bgColor: 'bg-gray-500/10'
        }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-card/60 backdrop-blur-sm border border-border/50 rounded-3xl p-8"
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl" />

                <div className="relative text-center">
                    {/* Avatar */}
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-4 border-primary/20 flex items-center justify-center">
                        <span className="text-primary font-bold text-3xl">
                            {displayName.charAt(0).toUpperCase()}
                        </span>
                    </div>

                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                        {displayName}
                    </h1>

                    {/* Rank Badge */}
                    <div className="flex justify-center mb-6">
                        <span className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-base font-medium ${rankBadge.bg} ${rankBadge.text}`}>
                            {rankBadge.icon}
                            {user.rankTitle}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    {user.rankLevel < 8 && (
                        <div className="max-w-md mx-auto mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm text-muted-foreground">
                                    Progress to next rank
                                </span>
                                <span className="text-sm font-medium text-foreground">
                                    {user.rankProgress}%
                                </span>
                            </div>
                            <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${user.rankProgress}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className="bg-gradient-to-r from-primary/80 to-primary h-3 rounded-full"
                                />
                            </div>
                        </div>
                    )}

                    {/* Bio */}
                    {user.bio && (
                        <div className="max-w-2xl mx-auto">
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                {user.bio}
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        className="group bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className="flex items-start space-x-4">
                            <div className={`p-3 ${stat.bgColor} rounded-xl group-hover:scale-110 transition-transform duration-200`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div className="flex-1">
                                <div className="text-2xl font-bold text-foreground mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-sm font-medium text-foreground mb-1">
                                    {stat.label}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {stat.description}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Achievement Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-8"
            >
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-500/20 flex items-center justify-center">
                        <Trophy className="w-8 h-8 text-yellow-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">Champion Status</h3>
                    <p className="text-muted-foreground">
                        This user has demonstrated exceptional dedication to building lasting habits and inspiring others in the community.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}