// app/leaderboard/profile/components/ProfileDetails.tsx
'use client';

import { UserProfile } from '@/lib/actions/leaderboard';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, Target, Zap, Award, TrendingUp, Trophy } from 'lucide-react';

interface ProfileDetailsProps {
    user: UserProfile;
}

function getRankBadgeColor(rankLevel: number): string {
    switch (rankLevel) {
        case 1: return 'bg-gray-100 text-gray-800';
        case 2: return 'bg-green-100 text-green-800';
        case 3: return 'bg-blue-100 text-blue-800';
        case 4: return 'bg-purple-100 text-purple-800';
        case 5: return 'bg-yellow-100 text-yellow-800';
        case 6: return 'bg-red-100 text-red-800';
        case 7: return 'bg-pink-100 text-pink-800';
        case 8: return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
        default: return 'bg-gray-100 text-gray-800';
    }
}

export default function ProfileDetails({ user }: ProfileDetailsProps) {
    const displayName = user.userName ||
        `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        'Anonymous';

    const stats = [
        {
            icon: Target,
            label: 'Total Completions',
            value: user.totalCompletions.toLocaleString()
        },
        {
            icon: TrendingUp,
            label: 'Longest Streak',
            value: `${user.longestStreak} days`
        },
        {
            icon: Zap,
            label: 'Habits Created',
            value: user.totalHabitsCreated.toLocaleString()
        },
        {
            icon: Trophy,
            label: 'Chains Completed',
            value: user.totalChainsCompleted.toLocaleString()
        },
        {
            icon: Award,
            label: 'Daily Bonuses',
            value: user.dailyBonusesEarned.toLocaleString()
        },
        {
            icon: Calendar,
            label: 'Member Since',
            value: formatDistanceToNow(new Date(user.joinedAt), { addSuffix: true })
        }
    ];

    return (
        <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="bg-white rounded-lg border p-8 mb-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">{displayName}</h1>

                    <div className="flex justify-center mb-4">
                        <span className={`px-4 py-2 rounded-full text-lg font-medium ${getRankBadgeColor(user.rankLevel)}`}>
                            {user.rankTitle}
                        </span>
                    </div>

                    {user.rankLevel < 8 && (
                        <div className="max-w-md mx-auto mb-4">
                            <div className="text-sm text-gray-600 mb-2">
                                Progress to next rank: {user.rankProgress}%
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${user.rankProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {user.bio && (
                        <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                            {user.bio}
                        </p>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-lg border p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <stat.icon className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {stat.label}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}