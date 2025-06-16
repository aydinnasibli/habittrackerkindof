'use server';

import { auth } from '@clerk/nextjs/server';
import { generateHabitAnalytics } from '@/lib/services/habit-analytics-ai';
import { getUserHabits } from './habits';
import { getOrCreateProfile } from './profile';
import { IHabit, IProfile } from '@/lib/types';

// Types for analytics data
interface EnhancedWeeklyData {
    name: string;
    date: string;
    completed: number;
    total: number;
    percentage: number;
    streak: number;
    newHabits: number;
}

interface CategoryInsight {
    name: string;
    value: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
    trendValue: number;
    color: string;
    completionRate: number;
    averageStreak: number;
}

interface HabitPerformance {
    name: string;
    category: string;
    completionRate: number;
    currentStreak: number;
    longestStreak: number;
    weeklyTrend: number;
    difficulty: 'easy' | 'medium' | 'hard';
    consistency: number;
}

interface AIInsight {
    type: 'success' | 'warning' | 'tip' | 'achievement';
    title: string;
    description: string;
    action?: string;
    data?: any;
    priority: 'high' | 'medium' | 'low';
}

interface AnalyticsData {
    weeklyData: EnhancedWeeklyData[];
    monthlyData: any[];
    categoryInsights: CategoryInsight[];
    habitPerformance: HabitPerformance[];
    aiInsights: AIInsight[];
    streakData: any[];
    timePatterns: any[];
    motivationScore: number;
    consistencyScore: number;
    diversityScore: number;
    overallTrend: 'improving' | 'declining' | 'stable';
}

// Helper function to get date string
function getDateString(date: Date, timezone: string = 'UTC'): string {
    try {
        return date.toLocaleDateString('sv-SE', { timeZone: timezone });
    } catch {
        return date.toISOString().split('T')[0];
    }
}

// Helper function to get last N days
function getLastNDays(n: number, timezone: string = 'UTC'): string[] {
    const days = [];
    const today = new Date();

    for (let i = n - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        days.push(getDateString(date, timezone));
    }

    return days;
}

// Generate enhanced analytics data
function generateEnhancedAnalyticsData(habits: IHabit[], profile: IProfile | null): AnalyticsData {
    const timezone = profile?.timezone || 'UTC';
    const last7Days = getLastNDays(7, timezone);
    const last30Days = getLastNDays(30, timezone);

    // Generate weekly data
    const weeklyData: EnhancedWeeklyData[] = last7Days.map(dateStr => {
        const date = new Date(dateStr + 'T12:00:00.000Z');
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        let completed = 0;
        let total = 0;

        habits.forEach(habit => {
            if (habit.status === 'active') {
                total++;
                const completion = habit.completions?.find(c =>
                    getDateString(new Date(c.date), timezone) === dateStr
                );
                if (completion?.completed) {
                    completed++;
                }
            }
        });

        return {
            name: dayName,
            date: dateStr,
            completed,
            total,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
            streak: 0,
            newHabits: 0
        };
    });

    // Generate category insights
    const categoryMap = new Map<string, { total: number; completed: number; streaks: number[] }>();
    const categories = ['Mindfulness', 'Health', 'Learning', 'Productivity', 'Digital Wellbeing'];

    categories.forEach(cat => {
        categoryMap.set(cat, { total: 0, completed: 0, streaks: [] });
    });

    habits.forEach(habit => {
        if (habit.status === 'active') {
            const catData = categoryMap.get(habit.category) || { total: 0, completed: 0, streaks: [] };
            catData.total++;
            catData.streaks.push(habit.streak);

            const recentCompletions = habit.completions?.filter(c => {
                const completionDate = getDateString(new Date(c.date), timezone);
                return last7Days.includes(completionDate) && c.completed;
            }).length || 0;

            catData.completed += recentCompletions;
            categoryMap.set(habit.category, catData);
        }
    });

    const COLORS = [
        'hsl(var(--chart-1))',
        'hsl(var(--chart-2))',
        'hsl(var(--chart-3))',
        'hsl(var(--chart-4))',
        'hsl(var(--chart-5))'
    ];

    const categoryInsights: CategoryInsight[] = Array.from(categoryMap.entries()).map(([name, data], index) => {
        const completionRate = data.total > 0 ? Math.round((data.completed / (data.total * 7)) * 100) : 0;
        const averageStreak = data.streaks.length > 0 ?
            Math.round(data.streaks.reduce((sum, streak) => sum + streak, 0) / data.streaks.length) : 0;

        return {
            name,
            value: data.completed,
            percentage: completionRate,
            trend: 'stable' as const,
            trendValue: 0,
            color: COLORS[index % COLORS.length],
            completionRate,
            averageStreak
        };
    });

    // Generate habit performance data
    const habitPerformance: HabitPerformance[] = habits
        .filter(habit => habit.status === 'active')
        .map(habit => {
            const recentCompletions = habit.completions?.filter(c => {
                const completionDate = getDateString(new Date(c.date), timezone);
                return last7Days.includes(completionDate);
            }) || [];

            const completedCount = recentCompletions.filter(c => c.completed).length;
            const completionRate = Math.round((completedCount / 7) * 100);

            return {
                name: habit.name,
                category: habit.category,
                completionRate,
                currentStreak: habit.streak,
                longestStreak: habit.streak, // You might want to track this separately
                weeklyTrend: 0, // Calculate based on comparison with previous week
                difficulty: completionRate >= 80 ? 'easy' : completionRate >= 50 ? 'medium' : 'hard',
                consistency: completionRate
            };
        });

    // Calculate scores
    const motivationScore = Math.round(
        habitPerformance.reduce((sum, h) => sum + h.completionRate, 0) /
        Math.max(habitPerformance.length, 1)
    );

    const consistencyScore = Math.round(
        habits.reduce((sum, h) => sum + (h.streak > 0 ? 100 : 0), 0) /
        Math.max(habits.length, 1)
    );

    const diversityScore = Math.round((categories.length / 5) * 100);

    return {
        weeklyData,
        monthlyData: [], // Can implement later
        categoryInsights,
        habitPerformance,
        aiInsights: [], // Will be populated by AI service
        streakData: [], // Can implement later
        timePatterns: [], // Can implement later
        motivationScore,
        consistencyScore,
        diversityScore,
        overallTrend: 'stable'
    };
}

export async function getAIAnalytics(): Promise<AnalyticsData | null> {
    try {
        const { userId } = await auth();
        if (!userId) {
            throw new Error('User not authenticated');
        }

        const [habits, profile] = await Promise.all([
            getUserHabits(),
            getOrCreateProfile()
        ]);

        const analyticsData = generateEnhancedAnalyticsData(habits, profile);

        // Generate AI insights
        const aiInsights = await generateHabitAnalytics(habits, profile, analyticsData);
        analyticsData.aiInsights = aiInsights;

        return analyticsData;

    } catch (error) {
        console.error('Error getting AI analytics:', error);
        return null;
    }
}