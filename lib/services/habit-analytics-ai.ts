// lib/services/habit-analytics-ai-optimized.ts
import OpenAI from 'openai';
import { IHabit, IProfile } from '@/lib/types';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
    if (!process.env.OPENAI_API_KEY) {
        console.warn('OpenAI API key not configured');
        return null;
    }

    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            timeout: 30000, // 30 second timeout
        });
    }

    return openaiClient;
}

// Enhanced types for better UX
export interface QuickInsight {
    id: string;
    type: 'success' | 'warning' | 'opportunity' | 'achievement';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    actionable: boolean;
    icon: string;
    color: string;
}

export interface TrendData {
    period: string;
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
    label: string;
}

export interface PersonalityInsight {
    type: string;
    title: string;
    description: string;
    strengths: string[];
    recommendations: string[];
    compatibility: number; // 0-100
}

export interface OptimizedAnalysis {
    // Quick stats (generated locally, no AI)
    quickStats: {
        totalHabits: number;
        activeHabits: number;
        completionRate: number;
        totalStreak: number;
        longestStreak: number;
        thisWeekCompletions: number;
        lastWeekCompletions: number;
        momentum: 'gaining' | 'maintaining' | 'losing';
        trendData: TrendData[];
    };

    // AI-generated insights (cached)
    insights: QuickInsight[];
    personalityProfile: PersonalityInsight;
    predictions: {
        nextWeekSuccess: number;
        riskFactors: string[];
        opportunities: string[];
        recommendedFocus: string;
    };

    // Gamification elements
    achievements: {
        recent: Array<{
            title: string;
            description: string;
            icon: string;
            unlockedAt: Date;
            rarity: 'common' | 'rare' | 'epic' | 'legendary';
        }>;
        progress: Array<{
            title: string;
            current: number;
            target: number;
            percentage: number;
        }>;
    };

    lastUpdated: Date;
    freshness: 'fresh' | 'recent' | 'stale';
}

export class OptimizedHabitAI {
    // Generate quick stats without AI (always fast)
    generateQuickStats(habits: IHabit[]): OptimizedAnalysis['quickStats'] {
        const activeHabits = habits.filter(h => h.status === 'active');
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        // Calculate completions for this week and last week
        const thisWeekCompletions = this.getCompletionsInPeriod(habits, weekAgo, now);
        const lastWeekCompletions = this.getCompletionsInPeriod(habits, twoWeeksAgo, weekAgo);

        // Generate trend data for the last 7 days
        const trendData: TrendData[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const completions = this.getCompletionsForDate(habits, date);
            const change = i < 6 ? completions - (trendData[trendData.length - 1]?.value || 0) : 0;

            trendData.push({
                period: date.toLocaleDateString('en-US', { weekday: 'short' }),
                value: completions,
                change,
                trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
                label: `${completions} habits`
            });
        }

        const totalCompletions = habits.reduce((sum, h) =>
            sum + (h.completions?.filter(c => c.completed).length || 0), 0
        );
        const totalPossible = habits.reduce((sum, h) => sum + (h.completions?.length || 0), 0);
        const completionRate = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;

        // Determine momentum
        let momentum: 'gaining' | 'maintaining' | 'losing' = 'maintaining';
        if (thisWeekCompletions > lastWeekCompletions * 1.1) momentum = 'gaining';
        else if (thisWeekCompletions < lastWeekCompletions * 0.9) momentum = 'losing';

        return {
            totalHabits: habits.length,
            activeHabits: activeHabits.length,
            completionRate,
            totalStreak: habits.reduce((sum, h) => sum + h.streak, 0),
            longestStreak: Math.max(...habits.map(h => h.streak), 0),
            thisWeekCompletions,
            lastWeekCompletions,
            momentum,
            trendData
        };
    }

    // Generate AI insights with optimized prompts
    async generateInsights(habits: IHabit[], profile: IProfile): Promise<QuickInsight[]> {
        const client = getOpenAIClient();
        if (!client) {
            return this.generateFallbackInsights(habits);
        }

        const habitsData = this.prepareHabitsForAI(habits);

        const prompt = `Analyze these habit patterns and generate exactly 4 actionable insights.

HABITS DATA:
${JSON.stringify(habitsData, null, 2)}

USER PROFILE:
- Goals: ${profile.goals?.dailyHabitTarget || 3} daily habits, ${profile.goals?.weeklyGoal || 21} weekly
- Timezone: ${profile.timezone}
- Preferences: ${profile.theme} theme user

REQUIREMENTS:
- Return ONLY valid JSON array
- Each insight must be immediately actionable
- Mix of success celebrations and improvement opportunities
- Focus on patterns, trends, and practical next steps
- Use engaging, motivational language

FORMAT:
[
  {
    "id": "unique_id",
    "type": "success|warning|opportunity|achievement",
    "title": "Engaging title (max 50 chars)",
    "description": "Specific, actionable description (max 120 chars)",
    "impact": "high|medium|low",
    "actionable": true,
    "icon": "emoji",
    "color": "green|yellow|blue|purple"
  }
]`;

        try {
            const completion = await client.chat.completions.create({
                model: "gpt-3.5-turbo", // Faster and cheaper than GPT-4
                messages: [
                    {
                        role: "system",
                        content: "You are an expert habit coach. Return only valid JSON without markdown formatting."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000,
            });

            const response = completion.choices[0]?.message?.content?.trim();
            if (!response) throw new Error('No AI response');

            const cleanedResponse = this.cleanAIResponse(response);
            const insights = JSON.parse(cleanedResponse);

            return Array.isArray(insights) ? insights.slice(0, 4) : this.generateFallbackInsights(habits);
        } catch (error) {
            console.error('Error generating AI insights:', error);
            return this.generateFallbackInsights(habits);
        }
    }

    // Generate personality profile
    async generatePersonalityProfile(habits: IHabit[], profile: IProfile): Promise<PersonalityInsight> {
        const client = getOpenAIClient();
        if (!client) {
            return this.generateFallbackPersonality(habits);
        }

        const patterns = this.analyzeHabitPatterns(habits);

        const prompt = `Based on these habit patterns, create a personality profile:

PATTERNS:
${JSON.stringify(patterns, null, 2)}

Create a personality profile that's engaging and actionable. Return ONLY JSON:

{
  "type": "Habit personality type name",
  "title": "You are a [Personality Type]",
  "description": "2-sentence engaging description",
  "strengths": ["strength1", "strength2", "strength3"],
  "recommendations": ["tip1", "tip2", "tip3"],
  "compatibility": 85
}`;

        try {
            const completion = await client.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a behavioral psychologist. Return only valid JSON."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 500,
            });

            const response = completion.choices[0]?.message?.content?.trim();
            if (!response) throw new Error('No AI response');

            const cleanedResponse = this.cleanAIResponse(response);
            return JSON.parse(cleanedResponse);
        } catch (error) {
            console.error('Error generating personality profile:', error);
            return this.generateFallbackPersonality(habits);
        }
    }

    // Generate comprehensive analysis
    async generateOptimizedAnalysis(habits: IHabit[], profile: IProfile): Promise<OptimizedAnalysis> {
        const quickStats = this.generateQuickStats(habits);

        // Generate AI insights and personality in parallel
        const [insights, personalityProfile] = await Promise.all([
            this.generateInsights(habits, profile),
            this.generatePersonalityProfile(habits, profile)
        ]);

        // Generate predictions based on patterns
        const predictions = this.generatePredictions(habits, quickStats);

        // Generate achievements
        const achievements = this.generateAchievements(habits, quickStats);

        return {
            quickStats,
            insights,
            personalityProfile,
            predictions,
            achievements,
            lastUpdated: new Date(),
            freshness: 'fresh'
        };
    }

    // Helper methods
    private prepareHabitsForAI(habits: IHabit[]) {
        return habits.map(habit => ({
            name: habit.name,
            category: habit.category,
            frequency: habit.frequency,
            timeOfDay: habit.timeOfDay,
            streak: habit.streak,
            priority: habit.priority,
            recentCompletions: habit.completions?.slice(-14).map(c => ({
                date: c.date,
                completed: c.completed
            })) || []
        }));
    }

    private analyzeHabitPatterns(habits: IHabit[]) {
        const categories = habits.reduce((acc, h) => {
            acc[h.category] = (acc[h.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const timeSlots = habits.reduce((acc, h) => {
            acc[h.timeOfDay] = (acc[h.timeOfDay] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const avgStreak = habits.length > 0
            ? habits.reduce((sum, h) => sum + h.streak, 0) / habits.length
            : 0;

        return {
            categories,
            timeSlots,
            avgStreak,
            consistencyScore: this.calculateConsistencyScore(habits),
            preferredTime: Object.keys(timeSlots).reduce((a, b) => timeSlots[a] > timeSlots[b] ? a : b, 'Morning')
        };
    }

    private calculateConsistencyScore(habits: IHabit[]): number {
        if (habits.length === 0) return 0;

        const scores = habits.map(habit => {
            const recentCompletions = habit.completions?.slice(-7) || [];
            const completedCount = recentCompletions.filter(c => c.completed).length;
            return completedCount / Math.max(recentCompletions.length, 1);
        });

        return Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100);
    }

    private getCompletionsInPeriod(habits: IHabit[], start: Date, end: Date): number {
        return habits.reduce((total, habit) => {
            const completions = habit.completions?.filter(c =>
                c.completed &&
                new Date(c.date) >= start &&
                new Date(c.date) <= end
            ).length || 0;
            return total + completions;
        }, 0);
    }

    private getCompletionsForDate(habits: IHabit[], date: Date): number {
        const dateStr = date.toISOString().split('T')[0];
        return habits.reduce((total, habit) => {
            const completion = habit.completions?.find(c =>
                new Date(c.date).toISOString().split('T')[0] === dateStr && c.completed
            );
            return total + (completion ? 1 : 0);
        }, 0);
    }

    private generatePredictions(habits: IHabit[], quickStats: any) {
        const trend = quickStats.momentum;
        let nextWeekSuccess = 70; // Base prediction

        if (trend === 'gaining') nextWeekSuccess = 85;
        else if (trend === 'losing') nextWeekSuccess = 55;

        const riskFactors = [];
        const opportunities = [];

        if (quickStats.completionRate < 60) {
            riskFactors.push("Low completion rate needs attention");
            opportunities.push("Focus on your easiest habits first");
        }

        if (quickStats.longestStreak < 3) {
            opportunities.push("Build momentum with a 7-day streak challenge");
        }

        return {
            nextWeekSuccess,
            riskFactors,
            opportunities,
            recommendedFocus: this.getRecommendedFocus(habits, quickStats)
        };
    }

    private getRecommendedFocus(habits: IHabit[], quickStats: any): string {
        if (quickStats.activeHabits > 5) return "Simplify - focus on your top 3 habits";
        if (quickStats.completionRate < 50) return "Consistency over quantity";
        if (quickStats.longestStreak < 7) return "Build a strong streak foundation";
        return "Time to add a challenging new habit";
    }

    private generateAchievements(habits: IHabit[], quickStats: any) {
        const recent = [];
        const progress = [];

        // Check for recent achievements
        if (quickStats.longestStreak >= 7) {
            recent.push({
                title: "Week Warrior",
                description: "Completed a 7-day streak!",
                icon: "🔥",
                unlockedAt: new Date(),
                rarity: 'rare' as const
            });
        }

        if (quickStats.completionRate >= 80) {
            recent.push({
                title: "Consistency Champion",
                description: "Maintained 80%+ completion rate",
                icon: "⭐",
                unlockedAt: new Date(),
                rarity: 'epic' as const
            });
        }

        // Progress towards next achievements
        progress.push({
            title: "Streak Master (30 days)",
            current: quickStats.longestStreak,
            target: 30,
            percentage: Math.min(100, Math.round((quickStats.longestStreak / 30) * 100))
        });

        progress.push({
            title: "Habit Collector (10 habits)",
            current: quickStats.totalHabits,
            target: 10,
            percentage: Math.min(100, Math.round((quickStats.totalHabits / 10) * 100))
        });

        return { recent, progress };
    }

    private cleanAIResponse(response: string): string {
        return response
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .trim();
    }

    private generateFallbackInsights(habits: IHabit[]): QuickInsight[] {
        const insights = [];
        const activeHabits = habits.filter(h => h.status === 'active');
        const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);

        if (totalStreak > 10) {
            insights.push({
                id: 'streak_success',
                type: 'success' as const,
                title: `🔥 ${totalStreak} total streak days!`,
                description: 'Your consistency is paying off. Keep the momentum going!',
                impact: 'high' as const,
                actionable: true,
                icon: '🔥',
                color: 'green'
            });
        }

        if (activeHabits.length > 5) {
            insights.push({
                id: 'too_many_habits',
                type: 'warning' as const,
                title: '⚠️ Focus on fewer habits',
                description: 'Try focusing on 3-5 core habits for better success rates.',
                impact: 'medium' as const,
                actionable: true,
                icon: '⚠️',
                color: 'yellow'
            });
        }

        // Add more fallback insights...
        return insights.slice(0, 4);
    }

    private generateFallbackPersonality(habits: IHabit[]): PersonalityInsight {
        const morningHabits = habits.filter(h => h.timeOfDay === 'Morning').length;
        const isEarlyBird = morningHabits > habits.length / 2;

        return {
            type: isEarlyBird ? "Early Bird Achiever" : "Steady Progress Builder",
            title: `You are ${isEarlyBird ? "an Early Bird Achiever" : "a Steady Progress Builder"}`,
            description: isEarlyBird
                ? "You prefer tackling habits in the morning and building momentum early in the day."
                : "You build habits gradually throughout the day with consistent, steady progress.",
            strengths: isEarlyBird
                ? ["Morning productivity", "Strong willpower", "Proactive planning"]
                : ["Consistent execution", "Adaptability", "Sustainable pace"],
            recommendations: isEarlyBird
                ? ["Stack habits in your morning routine", "Use your peak energy wisely", "Plan evening wind-down"]
                : ["Spread habits throughout the day", "Use habit stacking", "Focus on small wins"],
            compatibility: 75
        };
    }
}
