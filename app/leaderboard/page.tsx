// app/leaderboard/page.tsx
import { getLeaderboard } from '@/lib/actions/leaderboard';
import LeaderboardList from './LeaderboardList';
import { Metadata } from 'next';
import { Trophy, TrendingUp, Users, Award, Sparkles, Zap, Crown, Star } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Leaderboard - Necmettinyo',
    description: 'Top habit builders ranked by their achievements and dedication'
};

export default async function LeaderboardPage() {
    const result = await getLeaderboard();

    if (!result.success || !result.users) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-12">
                    <div className="text-center max-w-md mx-auto">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/20 border border-destructive/30 flex items-center justify-center">
                            <Trophy className="w-10 h-10 text-destructive" />
                        </div>
                        <h1 className="text-3xl font-bold mb-4 text-foreground">Championship Unavailable</h1>
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
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <div className="relative mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/30 mb-6 shadow-lg">
                            <Trophy className="w-10 h-10 text-primary" />
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-black mb-6 text-foreground">
                        HALL OF
                        <br />
                        <span className="text-primary">LEGENDS</span>
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
                        Where <span className="text-primary font-semibold">Champions</span> are forged and
                        <span className="text-primary font-semibold"> Legends</span> are born
                    </p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
                        {[
                            {
                                icon: Users,
                                value: result.users.length,
                                label: "Champions",
                                color: "text-blue-600 dark:text-blue-400"
                            },
                            {
                                icon: TrendingUp,
                                value: totalCompletions.toLocaleString(),
                                label: "Total Victories",
                                color: "text-green-600 dark:text-green-400"
                            },
                            {
                                icon: Zap,
                                value: topStreak,
                                label: "Epic Streak",
                                color: "text-yellow-600 dark:text-yellow-400"
                            },
                            {
                                icon: Star,
                                value: avgStreak,
                                label: "Avg Mastery",
                                color: "text-purple-600 dark:text-purple-400"
                            }
                        ].map((stat, index) => (
                            <div
                                key={index}
                                className="bg-card border border-border rounded-xl p-4 hover:bg-accent transition-colors duration-200"
                            >
                                <div className="mb-3">
                                    <stat.icon className={`w-6 h-6 ${stat.color} mx-auto`} />
                                </div>
                                <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-muted-foreground uppercase tracking-wide">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Championship Status */}
                    <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-6 py-3 text-primary font-medium mb-8">
                        <Crown className="w-4 h-4" />
                        <span>Championship Season Active</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                </div>

                <LeaderboardList users={result.users} />

                {/* Bottom decoration */}
                <div className="text-center mt-16">
                    <div className="inline-flex items-center gap-2 text-muted-foreground">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm">Powered by Dedication & Consistency</span>
                        <Sparkles className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
}