// lib/services/analytics-generator.ts
import crypto from 'crypto';
import { IHabit, IProfile } from '@/lib/types';
import { Analytics } from '@/lib/models/Analytics';
import { connectToDatabase } from '@/lib/mongoose';
import { AnalyticsCache } from './redis-cache';
import { generateHabitAnalytics } from './habit-analytics-ai';

export interface EnhancedAnalyticsData {
    metrics: {
        totalHabits: number;
        activeHabits: number;
        completionRate: number;
        averageStreak: number;
        longestStreak: number;
        totalCompletions: number;
        consistencyScore: number;
        motivationScore: number;
        diversityScore: number;
    };
    dailyData: Array<{
        date: string;
        dayName: string;
        completed: number;
        total: number;
        percentage: number;
        newHabits: number;
    }>;
    categoryInsights: Array<{
        name: string;
        value: number;
        percentage: number;
        completionRate: number;
        averageStreak: number;
        trend: 'up' | 'down' | 'stable';
        trendValue: number;
        color: string;
    }>;
    habitPerformance: Array<{
        habitId: string;
        name: string;
        category: string;
        completionRate: number;
        currentStreak: number;
        longestStreak: number;
        consistency: number;
        difficulty: 'easy' | 'medium' | 'hard';
    }>;
    timePatterns: Array<{
        timeSlot: string;
        completionRate: number;
        totalHabits: number;
    }>;
    streakData: Array<{
        habitName: string;
        currentStreak: number;
        longestStreak: number;
        streakHistory: number[];
    }>;
    aiInsights: Array<{
        type: 'success' | 'warning' | 'tip' | 'achievement';
        title: string;
        description: string;
        action?: string;
        priority: 'high' | 'medium' | 'low';
    }>;
    overallTrend: 'improving' | 'declining' | 'stable';
    lastUpdated: Date;
}

function generateDataHash(habits: IHabit[]): string {
    const dataString = JSON.stringify(
        habits.map(h => ({
            id: h._id,
            completions: h.completions,
            streak: h.streak,
            updatedAt: h.updatedAt
        }))
    );
    return crypto.createHash('md5').update(dataString).digest('hex');
}

function getDateString(date: Date, timezone: string = 'UTC'): string {
    try {
        return date.toLocaleDateString('sv-SE', { timeZone: timezone });
    } catch {
        return date.toISOString().split('T')[0];
    }
}

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

function calculateMetrics(habits: IHabit[], timezone: string): EnhancedAnalyticsData['metrics'] {
    const activeHabits = habits.filter(h => h.status === 'active');
    const last30Days = getLastNDays(30, timezone);

    let totalRecentCompletions = 0;
    let totalPossibleCompletions = 0;

    activeHabits.forEach(habit => {
        last30Days.forEach(dateStr => {
            totalPossibleCompletions++;
            const completion = habit.completions?.find(c =>
                getDateString(new Date(c.date), timezone) === dateStr
            );
            if (completion?.completed) {
                totalRecentCompletions++;
            }
        });
    });

    const completionRate = totalPossibleCompletions > 0
        ? Math.round((totalRecentCompletions / totalPossibleCompletions) * 100)
        : 0;

    const streaks = activeHabits.map(h => h.streak);
    const averageStreak = streaks.length > 0
        ? Math.round(streaks.reduce((sum, streak) => sum + streak, 0) / streaks.length)
        : 0;

    const longestStreak = Math.max(0, ...streaks);

    const totalCompletions = habits.reduce((sum, habit) =>
        sum + (habit.completions?.filter(c => c.completed).length || 0), 0
    );

    // Calculate consistency score (how many days in last 30 had at least one completion)
    const consistentDays = last30Days.filter(dateStr => {
        return activeHabits.some(habit => {
            const completion = habit.completions?.find(c =>
                getDateString(new Date(c.date), timezone) === dateStr
            );
            return completion?.completed;
        });
    }).length;

    const consistencyScore = Math.round((consistentDays / 30) * 100);

    // Motivation score based on recent trend
    const last7Days = getLastNDays(7, timezone);
    const recentCompletionRate = calculatePeriodCompletionRate(activeHabits, last7Days, timezone);
    const motivationScore = Math.min(100, Math.round(recentCompletionRate * 1.2));

    // Diversity score based on category distribution
    const categories = new Set(activeHabits.map(h => h.category));
    const diversityScore = Math.min(100, Math.round((categories.size / 5) * 100));

    return {
        totalHabits: habits.length,
        activeHabits: activeHabits.length,
        completionRate,
        averageStreak,
        longestStreak,
        totalCompletions,
        consistencyScore,
        motivationScore,
        diversityScore
    };
}

function calculatePeriodCompletionRate(habits: IHabit[], dates: string[], timezone: string): number {
    let completed = 0;
    let total = 0;

    habits.forEach(habit => {
        dates.forEach(dateStr => {
            total++;
            const completion = habit.completions?.find(c =>
                getDateString(new Date(c.date), timezone) === dateStr
            );
            if (completion?.completed) {
                completed++;
            }
        });
    });

    return total > 0 ? Math.round((completed / total) * 100) : 0;
}

function generateDailyData(habits: IHabit[], timezone: string): EnhancedAnalyticsData['dailyData'] {
    const last14Days = getLastNDays(14, timezone);
    const activeHabits = habits.filter(h => h.status === 'active');

    return last14Days.map(dateStr => {
        const date = new Date(dateStr + 'T12:00:00.000Z');
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        let completed = 0;
        const total = activeHabits.length;

        activeHabits.forEach(habit => {
            const completion = habit.completions?.find(c =>
                getDateString(new Date(c.date), timezone) === dateStr
            );
            if (completion?.completed) {
                completed++;
            }
        });

        return {
            date: dateStr,
            dayName,
            completed,
            total,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
            newHabits: 0 // You can enhance this by tracking habit creation dates
        };
    });
}

function generateCategoryInsights(habits: IHabit[], timezone: string): EnhancedAnalyticsData['categoryInsights'] {
    const categories = ['Mindfulness', 'Health', 'Learning', 'Productivity', 'Digital Wellbeing'];
    const colors = [
        'hsl(var(--chart-1))',
        'hsl(var(--chart-2))',
        'hsl(var(--chart-3))',
        'hsl(var(--chart-4))',
        'hsl(var(--chart-5))'
    ];

    const last7Days = getLastNDays(7, timezone);
    const last14Days = getLastNDays(14, timezone);
    const previousWeek = last14Days.slice(0, 7);

    return categories.map((category, index) => {
        const categoryHabits = habits.filter(h => h.category === category && h.status === 'active');
        const value = categoryHabits.length;

        if (value === 0) {
            return {
                name: category,
                value: 0,
                percentage: 0,
                completionRate: 0,
                averageStreak: 0,
                trend: 'stable' as const,
                trendValue: 0,
                color: colors[index]
            };
        }

        const currentWeekRate = calculatePeriodCompletionRate(categoryHabits, last7Days, timezone);
        const previousWeekRate = calculatePeriodCompletionRate(categoryHabits, previousWeek, timezone);

        const trendValue = currentWeekRate - previousWeekRate;
        const trend = trendValue > 5 ? 'up' : trendValue < -5 ? 'down' : 'stable';

        const streaks = categoryHabits.map(h => h.streak);
        const averageStreak = Math.round(streaks.reduce((sum, streak) => sum + streak, 0) / streaks.length);

        return {
            name: category,
            value,
            percentage: Math.round((value / habits.filter(h => h.status === 'active').length) * 100),
            completionRate: currentWeekRate,
            averageStreak,
            trend,
            trendValue: Math.abs(trendValue),
            color: colors[index]
        };
    });
}

function generateHabitPerformance(habits: IHabit[], timezone: string): EnhancedAnalyticsData['habitPerformance'] {
    const last30Days = getLastNDays(30, timezone);

    return habits
        .filter(h => h.status === 'active')
        .map(habit => {
            const completions = last30Days.filter(dateStr => {
                const completion = habit.completions?.find(c =>
                    getDateString(new Date(c.date), timezone) === dateStr
                );
                return completion?.completed;
            }).length;

            const completionRate = Math.round((completions / 30) * 100);

            // Calculate longest streak from completions
            const longestStreak = calculateLongestStreakFromCompletions(habit.completions || [], timezone);

            // Determine difficulty based on completion rate
            let difficulty: 'easy' | 'medium' | 'hard';
            if (completionRate >= 80) difficulty = 'easy';
            else if (completionRate >= 60) difficulty = 'medium';
            else difficulty = 'hard';

            // Consistency is the standard deviation of weekly completion rates
            const weeklyRates = [];
            for (let i = 0; i < 4; i++) {
                const weekStart = i * 7;
                const weekDays = last30Days.slice(weekStart, weekStart + 7);
                const weekCompletions = weekDays.filter(dateStr => {
                    const completion = habit.completions?.find(c =>
                        getDateString(new Date(c.date), timezone) === dateStr
                    );
                    return completion?.completed;
                }).length;
                weeklyRates.push((weekCompletions / 7) * 100);
            }

            const avgWeeklyRate = weeklyRates.reduce((sum, rate) => sum + rate, 0) / weeklyRates.length;
            const variance = weeklyRates.reduce((sum, rate) => sum + Math.pow(rate - avgWeeklyRate, 2), 0) / weeklyRates.length;
            const consistency = Math.max(0, Math.round(100 - Math.sqrt(variance)));

            return {
                habitId: habit._id?.toString() || '',
                name: habit.name,
                category: habit.category,
                completionRate,
                currentStreak: habit.streak,
                longestStreak,
                consistency,
                difficulty
            };
        })
        .sort((a, b) => b.completionRate - a.completionRate);
}

function calculateLongestStreakFromCompletions(completions: any[], timezone: string): number {
    if (!completions.length) return 0;

    const completedDates = completions
        .filter(c => c.completed)
        .map(c => getDateString(new Date(c.date), timezone))
        .sort();

    let longestStreak = 0;
    let currentStreak = 0;
    let lastDate: Date | null = null;

    for (const dateStr of completedDates) {
        const currentDate = new Date(dateStr);

        if (!lastDate) {
            currentStreak = 1;
        } else {
            const daysDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff === 1) {
                currentStreak++;
            } else {
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 1;
            }
        }

        lastDate = currentDate;
    }

    return Math.max(longestStreak, currentStreak);
}

function generateTimePatterns(habits: IHabit[]): EnhancedAnalyticsData['timePatterns'] {
    const timeSlots = ['Morning', 'Afternoon', 'Evening', 'Throughout day'];
    const activeHabits = habits.filter(h => h.status === 'active');

    return timeSlots.map(timeSlot => {
        const timeSlotHabits = activeHabits.filter(h => h.timeOfDay === timeSlot);
        const totalCompletions = timeSlotHabits.reduce((sum, habit) =>
            sum + (habit.completions?.filter(c => c.completed).length || 0), 0
        );
        const totalPossible = timeSlotHabits.reduce((sum, habit) =>
            sum + (habit.completions?.length || 0), 0
        );

        return {
            timeSlot,
            completionRate: totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0,
            totalHabits: timeSlotHabits.length
        };
    });
}

function generateStreakData(habits: IHabit[], timezone: string): EnhancedAnalyticsData['streakData'] {
    return habits
        .filter(h => h.status === 'active')
        .map(habit => {
            const longestStreak = calculateLongestStreakFromCompletions(habit.completions || [], timezone);

            // Generate streak history for the last 30 days
            const last30Days = getLastNDays(30, timezone);
            const streakHistory = last30Days.map(dateStr => {
                const completion = habit.completions?.find(c =>
                    getDateString(new Date(c.date), timezone) === dateStr
                );
                return completion?.completed ? 1 : 0;
            });

            return {
                habitName: habit.name,
                currentStreak: habit.streak,
                longestStreak,
                streakHistory
            };
        })
        .sort((a, b) => b.currentStreak - a.currentStreak);
}

export async function generateAnalytics(
    userId: string,
    habits: IHabit[],
    profile: IProfile | null,
    forceRefresh: boolean = false
): Promise<EnhancedAnalyticsData> {
    const timezone = profile?.timezone || 'UTC';
    const currentHash = generateDataHash(habits);

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
        const cachedHash = await AnalyticsCache.getDataHash(userId);
        if (cachedHash === currentHash) {
            const cachedData = await AnalyticsCache.get<EnhancedAnalyticsData>(userId, 'analytics');
            if (cachedData) {
                return cachedData;
            }
        }
    }

    // Generate fresh analytics
    const metrics = calculateMetrics(habits, timezone);
    const dailyData = generateDailyData(habits, timezone);
    const categoryInsights = generateCategoryInsights(habits, timezone);
    const habitPerformance = generateHabitPerformance(habits, timezone);
    const timePatterns = generateTimePatterns(habits);
    const streakData = generateStreakData(habits, timezone);

    // Determine overall trend
    const recentAvg = dailyData.slice(-7).reduce((sum, day) => sum + day.percentage, 0) / 7;
    const olderAvg = dailyData.slice(0, 7).reduce((sum, day) => sum + day.percentage, 0) / 7;
    const trendDiff = recentAvg - olderAvg;
    const overallTrend = trendDiff > 5 ? 'improving' : trendDiff < -5 ? 'declining' : 'stable';

    // Generate AI insights
    let aiInsights: EnhancedAnalyticsData['aiInsights'] = [];
    try {
        aiInsights = await generateHabitAnalytics(habits, profile, {
            metrics,
            dailyData,
            categoryInsights,
            habitPerformance,
            timePatterns,
            streakData,
            overallTrend
        });
    } catch (error) {
        console.error('Error generating AI insights:', error);
        // Provide fallback insights
        aiInsights = generateFallbackInsights(metrics, habitPerformance, overallTrend);
    }

    const analyticsData: EnhancedAnalyticsData = {
        metrics,
        dailyData,
        categoryInsights,
        habitPerformance,
        timePatterns,
        streakData,
        aiInsights,
        overallTrend,
        lastUpdated: new Date()
    };

    // Cache the results
    await AnalyticsCache.set(userId, 'analytics', analyticsData, 3600); // 1 hour
    await AnalyticsCache.setDataHash(userId, currentHash);

    // Store in MongoDB for historical data
    try {
        await connectToDatabase();
        await Analytics.findOneAndUpdate(
            {
                clerkUserId: userId,
                period: 'current'
            },
            {
                clerkUserId: userId,
                period: 'current',
                startDate: new Date(dailyData[0]?.date),
                endDate: new Date(dailyData[dailyData.length - 1]?.date),
                metrics,
                dailyData,
                categoryInsights,
                habitPerformance: habitPerformance.map(h => ({ ...h, habitId: h.habitId })),
                timePatterns,
                streakData,
                aiInsights,
                dataHash: currentHash,
                lastUpdated: new Date()
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error('Error storing analytics in MongoDB:', error);
    }

    return analyticsData;
}

function generateFallbackInsights(
    metrics: EnhancedAnalyticsData['metrics'],
    habitPerformance: EnhancedAnalyticsData['habitPerformance'],
    overallTrend: string
): EnhancedAnalyticsData['aiInsights'] {
    const insights: EnhancedAnalyticsData['aiInsights'] = [];

    // Overall performance insight
    if (metrics.completionRate >= 80) {
        insights.push({
            type: 'success',
            title: 'Excellent Consistency! 🎉',
            description: `You're maintaining an impressive ${metrics.completionRate}% completion rate. Your dedication is paying off!`,
            priority: 'high'
        });
    } else if (metrics.completionRate >= 60) {
        insights.push({
            type: 'tip',
            title: 'Building Strong Momentum',
            description: `You're at ${metrics.completionRate}% completion rate. Try focusing on your most challenging habits during your peak energy hours.`,
            action: 'Optimize timing',
            priority: 'medium'
        });
    } else {
        insights.push({
            type: 'warning',
            title: 'Opportunity for Growth',
            description: `Your ${metrics.completionRate}% completion rate shows room for improvement. Consider starting with just 1-2 core habits.`,
            action: 'Simplify routine',
            priority: 'high'
        });
    }

    // Streak insight
    if (metrics.longestStreak >= 21) {
        insights.push({
            type: 'achievement',
            title: 'Habit Master! 🏆',
            description: `Your ${metrics.longestStreak}-day streak shows incredible discipline. You've truly made this a lifestyle.`,
            priority: 'high'
        });
    } else if (metrics.longestStreak >= 7) {
        insights.push({
            type: 'success',
            title: 'Great Streak Building!',
            description: `Your ${metrics.longestStreak}-day streak is fantastic! Keep the momentum going to reach the 21-day habit formation milestone.`,
            priority: 'medium'
        });
    }

    // Struggling habits insight
    const strugglingHabits = habitPerformance.filter(h => h.completionRate < 50);
    if (strugglingHabits.length > 0) {
        insights.push({
            type: 'tip',
            title: 'Focus on Key Habits',
            description: `${strugglingHabits.length} habits need attention. Consider reducing the difficulty or frequency of "${strugglingHabits[0].name}" to build momentum.`,
            action: 'Adjust habits',
            priority: 'medium'
        });
    }

    return insights.slice(0, 4); // Limit to 4 insights
}