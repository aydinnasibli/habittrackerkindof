// app/leaderboard/components/LeaderboardList.tsx
'use client';

import { LeaderboardUser } from '@/lib/actions/leaderboard';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface LeaderboardListProps {
    users: LeaderboardUser[];
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

function getRankPosition(index: number): string {
    const position = index + 1;
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `#${position}`;
}

export default function LeaderboardList({ users }: LeaderboardListProps) {
    if (users.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-600">No users found on the leaderboard</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {users.map((user, index) => (
                <Link
                    key={user._id}
                    href={`/leaderboard/profile/${user._id}`}
                    className="block p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="text-lg font-bold min-w-[3rem] text-center">
                                {getRankPosition(index)}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                    <h3 className="font-semibold text-lg">
                                        {user.userName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous'}
                                    </h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRankBadgeColor(user.rankLevel)}`}>
                                        {user.rankTitle}
                                    </span>
                                </div>

                                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                    <span>{user.totalCompletions} completions</span>
                                    <span>•</span>
                                    <span>{user.longestStreak} day streak</span>
                                    <span>•</span>
                                    <span>Joined {formatDistanceToNow(new Date(user.joinedAt), { addSuffix: true })}</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-gray-400">
                            →
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}