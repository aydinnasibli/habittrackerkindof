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

function getRankBadgeStyle(rankLevel: number): { bg: string; text: string; icon: React.ReactNode; glow: string } {
    switch (rankLevel) {
        case 1:
            return {
                bg: 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200',
                text: 'text-gray-800',
                icon: <Star className="w-3 h-3" />,
                glow: 'shadow-gray-300/50'
            };
        case 2:
            return {
                bg: 'bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-400',
                text: 'text-green-900',
                icon: <Zap className="w-3 h-3" />,
                glow: 'shadow-green-400/50'
            };
        case 3:
            return {
                bg: 'bg-gradient-to-r from-blue-400 via-sky-300 to-blue-400',
                text: 'text-blue-900',
                icon: <TrendingUp className="w-3 h-3" />,
                glow: 'shadow-blue-400/50'
            };
        case 4:
            return {
                bg: 'bg-gradient-to-r from-purple-400 via-violet-300 to-purple-400',
                text: 'text-purple-900',
                icon: <Crown className="w-3 h-3" />,
                glow: 'shadow-purple-400/50'
            };
        case 5:
            return {
                bg: 'bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400',
                text: 'text-yellow-900',
                icon: <Flame className="w-3 h-3" />,
                glow: 'shadow-yellow-400/50'
            };
        case 6:
            return {
                bg: 'bg-gradient-to-r from-red-400 via-rose-300 to-red-400',
                text: 'text-red-900',
                icon: <Target className="w-3 h-3" />,
                glow: 'shadow-red-400/50'
            };
        case 7:
            return {
                bg: 'bg-gradient-to-r from-pink-400 via-rose-300 to-pink-400',
                text: 'text-pink-900',
                icon: <Gem className="w-3 h-3" />,
                glow: 'shadow-pink-400/50'
            };
        case 8:
            return {
                bg: 'bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400',
                text: 'text-white',
                icon: <Sword className="w-3 h-3" />,
                glow: 'shadow-yellow-400/70'
            };
        default:
            return {
                bg: 'bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300',
                text: 'text-gray-800',
                icon: <Shield className="w-3 h-3" />,
                glow: 'shadow-gray-300/50'
            };
    }
}

function getRankPosition(index: number): { display: React.ReactNode; style: string; bgColor: string; borderColor: string } {
    const position = index + 1;
    if (position === 1) return {
        display: (
            <div className="relative">
                <span className="text-3xl">👑</span>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-2 h-2 text-yellow-900" />
                </div>
            </div>
        ),
        style: '',
        bgColor: 'bg-gradient-to-br from-yellow-400 to-amber-500',
        borderColor: 'border-yellow-400/50'
    };
    if (position === 2) return {
        display: <span className="text-3xl">🥈</span>,
        style: '',
        bgColor: 'bg-gradient-to-br from-gray-300 to-gray-400',
        borderColor: 'border-gray-400/50'
    };
    if (position === 3) return {
        display: <span className="text-3xl">🥉</span>,
        style: '',
        bgColor: 'bg-gradient-to-br from-orange-400 to-amber-600',
        borderColor: 'border-orange-400/50'
    };
    return {
        display: `#${position}`,
        style: 'text-xl font-black text-white',
        bgColor: 'bg-gradient-to-br from-slate-600 to-slate-700',
        borderColor: 'border-slate-500/50'
    };
}

function getCardStyle(index: number): { border: string; glow: string; bg: string } {
    if (index === 0) return {
        border: 'border-2 border-yellow-400/50',
        glow: 'shadow-2xl shadow-yellow-500/30',
        bg: 'bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-orange-500/10'
    };
    if (index === 1) return {
        border: 'border-2 border-gray-400/50',
        glow: 'shadow-2xl shadow-gray-500/30',
        bg: 'bg-gradient-to-br from-gray-500/10 via-slate-500/5 to-gray-600/10'
    };
    if (index === 2) return {
        border: 'border-2 border-orange-400/50',
        glow: 'shadow-2xl shadow-orange-500/30',
        bg: 'bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-yellow-500/10'
    };
    return {
        border: 'border border-white/10',
        glow: 'hover:shadow-xl hover:shadow-purple-500/20',
        bg: 'bg-white/5'
    };
}

export default function LeaderboardList({ users }: LeaderboardListProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="space-y-4 max-w-6xl mx-auto">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-white/5 rounded-3xl animate-pulse" />
            ))}
        </div>;
    }

    if (users.length === 0) {
        return (
            <div className="text-center py-20">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border-2 border-purple-500/30 flex items-center justify-center"
                >
                    <Crown className="w-12 h-12 text-purple-400" />
                </motion.div>
                <h3 className="text-3xl font-bold mb-4 text-white">The Arena Awaits</h3>
                <p className="text-gray-300 max-w-md mx-auto text-lg">
                    Be the first to enter the Hall of Legends and claim your throne!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
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
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -50, scale: 0.9 }}
                            transition={{
                                delay: index * 0.1,
                                type: "spring",
                                stiffness: 100,
                                damping: 15
                            }}
                            whileHover={{
                                scale: 1.02,
                                y: -5,
                                transition: { duration: 0.2 }
                            }}
                            onHoverStart={() => setHoveredIndex(index)}
                            onHoverEnd={() => setHoveredIndex(null)}
                        >
                            <Link
                                href={`/leaderboard/profile/${user._id}`}
                                className={`group block relative overflow-hidden ${cardStyle.bg} backdrop-blur-lg ${cardStyle.border} rounded-3xl transition-all duration-500 ${cardStyle.glow} hover:scale-[1.02] transform-gpu`}
                            >
                                {/* Animated background gradient */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                                {/* Top performers get special treatment */}
                                {index < 3 && (
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50"></div>
                                )}

                                <div className="relative p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center space-x-6 flex-1">
                                            {/* Enhanced Rank Position */}
                                            <div className={`flex-shrink-0 w-16 h-16 rounded-2xl ${rankPosition.bgColor} ${rankPosition.borderColor} border-2 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                                                <span className={rankPosition.style}>
                                                    {rankPosition.display}
                                                </span>
                                            </div>

                                            {/* Enhanced Avatar */}
                                            <div className="relative flex-shrink-0">
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-2 border-purple-400/30 flex items-center justify-center shadow-lg backdrop-blur-sm">
                                                    <span className="text-white font-bold text-2xl">
                                                        {displayName.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                {/* Achievement rings for top 3 */}
                                                {index < 3 && (
                                                    <div className="absolute -inset-2 rounded-2xl border-2 border-dashed border-current opacity-30 animate-spin-slow"></div>
                                                )}
                                            </div>

                                            {/* Enhanced User Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-4 mb-3">
                                                    <h3 className="font-black text-2xl text-white truncate group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                                                        {displayName}
                                                    </h3>
                                                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${rankBadge.bg} ${rankBadge.text} ${rankBadge.glow} shadow-lg`}>
                                                        {rankBadge.icon}
                                                        {user.rankTitle}
                                                    </span>
                                                </div>

                                                {/* Enhanced Stats */}
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                                    <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 backdrop-blur-sm">
                                                        <TrendingUp className="w-4 h-4 text-green-400" />
                                                        <span className="font-bold text-white">
                                                            {user.totalCompletions.toLocaleString()}
                                                        </span>
                                                        <span className="text-gray-300">wins</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 backdrop-blur-sm">
                                                        <Flame className="w-4 h-4 text-orange-400" />
                                                        <span className="font-bold text-white">
                                                            {user.longestStreak}
                                                        </span>
                                                        <span className="text-gray-300">streak</span>
                                                    </div>
                                                    <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 backdrop-blur-sm">
                                                        <Calendar className="w-4 h-4 text-blue-400" />
                                                        <span className="text-gray-300 truncate">
                                                            {formatDistanceToNow(new Date(user.joinedAt), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Enhanced Arrow with pulsing effect */}
                                        <div className="flex items-center space-x-3">
                                            {index < 3 && (
                                                <div className="flex space-x-1">
                                                    <Trophy className="w-5 h-5 text-yellow-400" />
                                                    <Award className="w-5 h-5 text-purple-400" />
                                                </div>
                                            )}
                                            <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-white group-hover:translate-x-2 transition-all duration-300 flex-shrink-0" />
                                        </div>
                                    </div>

                                    {/* Enhanced Progress Section for top 5 */}
                                    {index < 5 && (
                                        <motion.div
                                            className="pt-6 border-t border-white/10"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: (index * 0.1) + 0.3 }}
                                        >
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                                    Dominance Level
                                                </span>
                                                <span className="text-sm font-bold text-white bg-white/10 px-3 py-1 rounded-full">
                                                    {Math.min(100, Math.round((user.totalCompletions / Math.max(...users.map(u => u.totalCompletions))) * 100))}%
                                                </span>
                                            </div>
                                            <div className="relative w-full bg-white/10 rounded-full h-3 overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full relative overflow-hidden"
                                                    initial={{ width: 0 }}
                                                    animate={{
                                                        width: `${Math.min(100, Math.round((user.totalCompletions / Math.max(...users.map(u => u.totalCompletions))) * 100))}%`
                                                    }}
                                                    transition={{ delay: (index * 0.1) + 0.5, duration: 1, ease: "easeOut" }}
                                                >
                                                    {/* Animated shine effect */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer"></div>
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Special effects for hovered card */}
                                    <AnimatePresence>
                                        {hoveredIndex === index && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute inset-0 rounded-3xl pointer-events-none"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-red-500/10 rounded-3xl animate-pulse"></div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Achievement badges for top performers */}
                                {index === 0 && (
                                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce-slow">
                                        🏆 CHAMPION
                                    </div>
                                )}
                                {index === 1 && (
                                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-gray-400 to-gray-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                        🥈 ELITE
                                    </div>
                                )}
                                {index === 2 && (
                                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-400 to-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                        🥉 LEGEND
                                    </div>
                                )}
                            </Link>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {/* Bottom motivation section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: users.length * 0.1 + 0.5 }}
                className="text-center mt-16 p-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-lg border border-white/10 rounded-3xl"
            >
                <div className="flex items-center justify-center gap-3 mb-4">
                    <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
                    <h3 className="text-2xl font-bold text-white">Ready to Join the Legends?</h3>
                    <Sparkles className="w-6 h-6 text-pink-400 animate-pulse" />
                </div>
                <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                    Every champion started with a single habit. Your journey to greatness begins today.
                </p>
            </motion.div>

            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
                
                .animate-bounce-slow {
                    animation: bounce-slow 2s ease-in-out infinite;
                }
                
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </div>
    );
}