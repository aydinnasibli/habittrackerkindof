// app/leaderboard/page.tsx
import { getLeaderboard } from '@/lib/actions/leaderboard';
import LeaderboardList from './LeaderboardList';
import { Metadata } from 'next';
import { Trophy, TrendingUp, Users, Zap, Crown, Star, Sparkles } from 'lucide-react';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Hall of Legends - Leaderboard | Necmettinyo',
    description: 'Top habit builders ranked by their achievements and dedication. Join the champions and build lasting habits.',
    keywords: 'leaderboard, habits, achievements, ranking, champions, productivity',
    openGraph: {
        title: 'Hall of Legends - Leaderboard',
        description: 'Top habit builders ranked by their achievements and dedication',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Hall of Legends - Leaderboard',
        description: 'Top habit builders ranked by their achievements and dedication',
    }
};

// Optimized stats card component with better performance
const StatCard = ({
    icon: Icon,
    value,
    label,
    color,
    description
}: {
    icon: React.ComponentType<{ className?: string }>;
    value: string | number;
    label: string;
    color: string;
    description?: string;
}) => (
    <div className="bg-card border border-border rounded-xl p-4 hover:bg-accent transition-colors duration-200 group">
        <div className="mb-3">
            <Icon className={`w-6 h-6 ${color} mx-auto group-hover:scale-110 transition-transform duration-200`} />
        </div>
        <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
            {value}
        </div>
        <div className="text-sm text-muted-foreground uppercase tracking-wide">
            {label}
        </div>
        {description && (
            <div className="text-xs text-muted-foreground/80 mt-1">
                {description}
            </div>
        )}
    </div>
);

// Optimized hero section with better performance
const HeroSection = ({
    totalUsers,
    totalCompletions,
    topStreak,
    avgStreak
}: {
    totalUsers: number;
    totalCompletions: number;
    topStreak: number;
    avgStreak: number;
}) => {
    // Static stats configuration - prevents recreation on each render
    const stats = [
        {
            icon: Users,
            value: totalUsers.toLocaleString(),
            label: "Champions",
            color: "text-blue-600 dark:text-blue-400",
            description: "Active legends"
        },
        {
            icon: TrendingUp,
            value: totalCompletions.toLocaleString(),
            label: "Total Victories",
            color: "text-green-600 dark:text-green-400",
            description: "Habits completed"
        },
        {
            icon: Zap,
            value: topStreak.toLocaleString(),
            label: "Epic Streak",
            color: "text-yellow-600 dark:text-yellow-400",
            description: "Best performance"
        },
        {
            icon: Star,
            value: avgStreak.toLocaleString(),
            label: "Avg Mastery",
            color: "text-purple-600 dark:text-purple-400",
            description: "Community standard"
        }
    ];

    return (
        <header className="text-center mb-16">
            <div className="relative mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/30 mb-6 shadow-lg">
                    <Trophy className="w-10 h-10 text-primary" aria-hidden="true" />
                </div>
                <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl -z-10" />
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-foreground leading-tight">
                HALL OF
                <br />
                <span className=" bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    LEGENDS
                </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                Where <span className="text-primary font-semibold">Champions</span> are forged and{' '}
                <span className="text-primary font-semibold">Legends</span> are born through dedication and consistency
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
                {stats.map((stat, index) => (
                    <StatCard key={`${stat.label}-${index}`} {...stat} />
                ))}
            </div>

            {/* Championship Status */}
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-6 py-3 text-primary font-medium mb-8">
                <Crown className="w-4 h-4" aria-hidden="true" />
                <span>Championship Season Active</span>
                <div
                    className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                    aria-label="Live status indicator"
                />
            </div>
        </header>
    );
};

// Optimized stats calculation functions
const calculateStats = (users: any[]) => {
    const totalUsers = users.length;

    // More efficient reduction
    let totalCompletions = 0;
    const validStreaks: number[] = [];

    for (const user of users) {
        const completions = Number(user.totalCompletions) || 0;
        totalCompletions += completions;

        const streak = Number(user.longestStreak) || 0;
        if (streak > 0) {
            validStreaks.push(streak);
        }
    }

    const avgStreak = validStreaks.length > 0
        ? Math.round(validStreaks.reduce((sum, streak) => sum + streak, 0) / validStreaks.length)
        : 0;

    const topStreak = validStreaks.length > 0 ? Math.max(...validStreaks) : 0;

    return {
        totalUsers,
        totalCompletions,
        topStreak,
        avgStreak
    };
};

// Main page component - now async to use global loading
export default async function LeaderboardPage() {
    try {
        const result = await getLeaderboard();

        // Better error handling
        if (!result?.success || !result?.users || !Array.isArray(result.users)) {
            console.error('Invalid leaderboard data:', result);
            return notFound();
        }

        const users = result.users;

        // Calculate stats efficiently
        const stats = users.length > 0 ? calculateStats(users) : {
            totalUsers: 0,
            totalCompletions: 0,
            topStreak: 0,
            avgStreak: 0
        };

        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                    <HeroSection {...stats} />
                    <main>
                        <LeaderboardList users={users} />
                    </main>

                    {/* Bottom decoration */}
                    <footer className="text-center mt-16">
                        <div className="inline-flex items-center gap-2 text-muted-foreground">
                            <Sparkles className="w-4 h-4" aria-hidden="true" />
                            <span className="text-sm">Powered by Dedication & Consistency</span>
                            <Sparkles className="w-4 h-4" aria-hidden="true" />
                        </div>
                    </footer>
                </div>
            </div>
        );
    } catch (error) {
        console.error('Leaderboard page error:', error);
        return notFound();
    }
}