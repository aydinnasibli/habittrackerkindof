// app/leaderboard/page.tsx
import { getLeaderboard } from '@/lib/actions/leaderboard';
import LeaderboardList from './LeaderboardList';
import { Metadata } from 'next';
import { Trophy, TrendingUp, Users, Award } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Leaderboard - Necmettinyo',
    description: 'Top habit builders ranked by their achievements and dedication'
};

export default async function LeaderboardPage() {
    const result = await getLeaderboard();

    if (!result.success || !result.users) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
                <div className="container mx-auto px-4 py-12">
                    <div className="text-center max-w-md mx-auto">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
                            <Trophy className="w-8 h-8 text-destructive" />
                        </div>
                        <h1 className="text-2xl font-bold mb-4 text-foreground">Leaderboard Unavailable</h1>
                        <p className="text-muted-foreground">
                            {result.error || 'Failed to load leaderboard data'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate stats for the hero section
    const totalCompletions = result.users.reduce((sum, user) => sum + user.totalCompletions, 0);
    const avgStreak = Math.round(result.users.reduce((sum, user) => sum + user.longestStreak, 0) / result.users.length);
    const topStreak = Math.max(...result.users.map(user => user.longestStreak));

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <div className="container mx-auto px-4 py-8">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mb-6 border border-primary/20">
                        <Trophy className="w-10 h-10 text-primary" />
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                        Hall of Champions
                    </h1>

                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Celebrating the most dedicated habit builders in our community
                    </p>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
                        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4">
                            <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                            <div className="text-2xl font-bold text-foreground">{result.users.length}</div>
                            <div className="text-sm text-muted-foreground">Champions</div>
                        </div>
                        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4">
                            <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                            <div className="text-2xl font-bold text-foreground">{totalCompletions.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">Total Wins</div>
                        </div>
                        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4">
                            <Award className="w-6 h-6 text-primary mx-auto mb-2" />
                            <div className="text-2xl font-bold text-foreground">{topStreak}</div>
                            <div className="text-sm text-muted-foreground">Best Streak</div>
                        </div>
                        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4">
                            <Trophy className="w-6 h-6 text-primary mx-auto mb-2" />
                            <div className="text-2xl font-bold text-foreground">{avgStreak}</div>
                            <div className="text-sm text-muted-foreground">Avg Streak</div>
                        </div>
                    </div>
                </div>

                <LeaderboardList users={result.users} />
            </div>
        </div>
    );
}