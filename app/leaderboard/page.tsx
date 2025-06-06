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
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>

                <div className="container mx-auto px-4 py-12 relative z-10">
                    <div className="text-center max-w-md mx-auto">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 backdrop-blur-sm border border-red-500/30 flex items-center justify-center animate-bounce">
                            <Trophy className="w-10 h-10 text-red-400" />
                        </div>
                        <h1 className="text-3xl font-bold mb-4 text-white">Championship Unavailable</h1>
                        <p className="text-gray-300">
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0">
                <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-3xl animate-spin"
                    style={{ animationDuration: '20s' }}
                ></div>

                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-white/20 rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animation: `float-${i} ${3 + Math.random() * 4}s ease-in-out infinite`,
                                animationDelay: `${Math.random() * 10}s`,
                                transform: 'translateY(0px) rotate(0deg)'
                            }}
                        />
                    ))}
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 relative z-10">
                {/* Hero Section with 3D effect */}
                <div className="text-center mb-16 relative">
                    {/* Glowing orb behind title */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-40 bg-gradient-to-r from-yellow-400/30 to-orange-500/30 rounded-full blur-3xl animate-pulse"></div>

                    <div className="relative mb-8">
                        <div
                            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 mb-6 border-4 border-white/20 shadow-2xl shadow-orange-500/50 animate-bounce relative"
                            style={{ animationDuration: '3s' }}
                        >
                            <Trophy className="w-12 h-12 text-white drop-shadow-lg" />
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-300 rounded-full animate-ping"></div>
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                                <Sparkles className="w-3 h-3 text-yellow-800" />
                            </div>
                        </div>
                    </div>

                    <h1 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-yellow-300 via-orange-400 to-red-400 bg-clip-text text-transparent drop-shadow-2xl transform hover:scale-105 transition-transform duration-300">
                        HALL OF
                        <br />
                        <span
                            className="text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text"
                            style={{
                                backgroundSize: '200% 200%',
                                animation: 'gradient-shift 3s ease infinite'
                            }}
                        >
                            LEGENDS
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto font-light">
                        Where <span className="text-purple-400 font-semibold">Champions</span> are forged and
                        <span className="text-blue-400 font-semibold"> Legends</span> are born
                    </p>

                    {/* Enhanced Stats Grid with 3D cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-12">
                        {[
                            {
                                icon: Users,
                                value: result.users.length,
                                label: "Champions",
                                color: "from-blue-500 to-purple-600",
                                iconColor: "text-blue-400",
                                bgGlow: "bg-blue-500/10"
                            },
                            {
                                icon: TrendingUp,
                                value: totalCompletions.toLocaleString(),
                                label: "Total Victories",
                                color: "from-green-500 to-emerald-600",
                                iconColor: "text-green-400",
                                bgGlow: "bg-green-500/10"
                            },
                            {
                                icon: Zap,
                                value: topStreak,
                                label: "Epic Streak",
                                color: "from-yellow-500 to-orange-600",
                                iconColor: "text-yellow-400",
                                bgGlow: "bg-yellow-500/10"
                            },
                            {
                                icon: Star,
                                value: avgStreak,
                                label: "Avg Mastery",
                                color: "from-purple-500 to-pink-600",
                                iconColor: "text-purple-400",
                                bgGlow: "bg-purple-500/10"
                            }
                        ].map((stat, index) => (
                            <div
                                key={index}
                                className="group relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:-translate-y-2 transform-gpu"
                                style={{
                                    animationDelay: `${index * 0.1}s`
                                }}
                            >
                                {/* Glow effect */}
                                <div className={`absolute inset-0 ${stat.bgGlow} rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`}></div>

                                <div className="relative">
                                    <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                                        <stat.icon className={`w-8 h-8 ${stat.iconColor} mx-auto drop-shadow-lg`} />
                                    </div>
                                    <div className={`text-3xl md:text-4xl font-black text-transparent bg-gradient-to-r ${stat.color} bg-clip-text mb-2`}>
                                        {stat.value}
                                    </div>
                                    <div className="text-sm font-medium text-gray-300 uppercase tracking-wider">
                                        {stat.label}
                                    </div>
                                </div>

                                {/* Animated border */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                            </div>
                        ))}
                    </div>

                    {/* Championship Announcement */}
                    <div className="relative mb-8">
                        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-purple-500/30 rounded-full px-8 py-4 text-white font-semibold">
                            <Crown className="w-5 h-5 text-yellow-400 animate-bounce" />
                            <span className="text-lg">Championship Season Active</span>
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                        </div>
                    </div>
                </div>

                <LeaderboardList users={result.users} />

                {/* Bottom decoration */}
                <div className="text-center mt-16 opacity-50">
                    <div className="inline-flex items-center gap-2 text-gray-400">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-medium">Powered by Dedication & Consistency</span>
                        <Sparkles className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* Global styles for custom animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes gradient-shift {
                        0%, 100% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                    }
                    
                    ${[...Array(20)].map((_, i) => `
                        @keyframes float-${i} {
                            0%, 100% { transform: translateY(0px) rotate(0deg); }
                            33% { transform: translateY(-${5 + Math.random() * 10}px) rotate(${Math.random() * 4 - 2}deg); }
                            66% { transform: translateY(${Math.random() * 8 - 4}px) rotate(${Math.random() * 2 - 1}deg); }
                        }
                    `).join('')}
                `
            }} />
        </div>
    );
}