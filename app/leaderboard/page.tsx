// app/leaderboard/page.tsx
import { getLeaderboard } from '@/lib/actions/leaderboard';
import LeaderboardList from './LeaderboardList';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Leaderboard',
    description: 'Top habit builders ranked by their achievements'
};

export default async function LeaderboardPage() {
    const result = await getLeaderboard();

    if (!result.success || !result.users) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Leaderboard</h1>
                    <p className="text-gray-600">
                        {result.error || 'Failed to load leaderboard'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
                <p className="text-gray-600">
                    Top {result.users.length} habit builders ranked by their achievements
                </p>
            </div>

            <LeaderboardList users={result.users} />
        </div>
    );
}