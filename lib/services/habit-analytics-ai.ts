// lib/services/habit-analytics-ai.ts
import OpenAI from 'openai';
import { IHabit, IProfile } from '@/lib/types';

// Don't instantiate OpenAI client at module level - do it lazily
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
    if (!process.env.OPENAI_API_KEY) {
        console.warn('OpenAI API key not configured - AI features will be disabled');
        return null;
    }

    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    console.log('OpenAI client initialized');
    return openaiClient;
}

interface AIInsight {
    type: 'success' | 'warning' | 'tip' | 'achievement';
    title: string;
    description: string;
    action?: string;
    data?: any;
    priority: 'high' | 'medium' | 'low';
}

export async function generateHabitAnalytics(
    habits: IHabit[],
    profile: IProfile | null,
    analyticsData: any
): Promise<AIInsight[]> {
    try {
        const openai = getOpenAIClient();

        // If no OpenAI client, return default insights
        if (!openai) {
            console.log('Using fallback analytics - OpenAI not configured');
            return getDefaultInsights(habits, analyticsData);
        }

        const prompt = createAnalyticsPrompt(habits, profile, analyticsData);

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are an expert habit coach and data analyst. Analyze user habit data and provide actionable insights.

CRITICAL REQUIREMENTS:
1. Generate 3-5 insights maximum
2. Focus on actionable, specific advice
3. Identify patterns and trends
4. Provide motivational but realistic feedback
5. Include specific metrics when relevant

INSIGHT TYPES:
- success: Celebrate achievements and positive trends
- warning: Alert about concerning patterns (gently)
- tip: Provide actionable improvement suggestions
- achievement: Recognize milestones and accomplishments

RESPONSE FORMAT - Return valid JSON array:
[
  {
    "type": "success|warning|tip|achievement",
    "title": "Clear, engaging title",
    "description": "Specific, actionable description with metrics",
    "action": "Optional call-to-action button text",
    "priority": "high|medium|low"
  }
]`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 1500
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
            return getDefaultInsights(habits, analyticsData);
        }

        const insights = parseInsights(response);
        return insights.length > 0 ? insights : getDefaultInsights(habits, analyticsData);

    } catch (error) {
        console.error('Error generating AI analytics:', error);
        return getDefaultInsights(habits, analyticsData);
    }
}

function createAnalyticsPrompt(
    habits: IHabit[],
    profile: IProfile | null,
    analyticsData: any
): string {
    const { weeklyData, , habitPerformance, scores } = analyticsData;

    const recentPerformance = weeklyData?.slice(-7) || [];
    // Define types for analyticsData sub-objects if not already defined
    type WeeklyDataItem = { name: string; percentage?: number };
    type HabitPerfItem = { name: string; completionRate: number; currentStreak: number };
    type CategoryInsightItem = { name: string; completionRate: number };

    const avgRecentCompletion = recentPerformance.length > 0
        ? recentPerformance.reduce(
            (sum: number, day: WeeklyDataItem) => sum + (day.percentage || 0),
            0
        ) / recentPerformance.length
        : 0;

    const strugglingHabits = (habitPerformance?.filter(
        (h: HabitPerfItem) => h.completionRate < 50
    )) || [];
    const excellentHabits = (habitPerformance?.filter(
        (h: HabitPerfItem) => h.completionRate >= 80
    )) || [];
    const longStreaks = (habitPerformance?.filter(
        (h: HabitPerfItem) => h.currentStreak >= 7
    )) || [];

    const bestCategory = (categoryInsights?.reduce(
        (best: CategoryInsightItem, cat: CategoryInsightItem) =>
            cat.completionRate > best.completionRate ? cat : best
    )) || { name: 'None', completionRate: 0 };

    const strugglingCategory = (categoryInsights?.reduce(
        (worst: CategoryInsightItem, cat: CategoryInsightItem) =>
            cat.completionRate < worst.completionRate ? cat : worst
    )) || { name: 'None', completionRate: 0 };

    return `
HABIT ANALYTICS DATA for ${profile?.firstName || 'User'}:

OVERALL METRICS:
- Total Habits: ${habits.length}
- Recent Average Completion: ${Math.round(avgRecentCompletion)}%
- Motivation Score: ${scores?.motivation || 0}/100
- Consistency Score: ${scores?.consistency || 0}/100
- Diversity Score: ${scores?.diversity || 0}/100

PERFORMANCE BREAKDOWN:
- Excellent Habits (80%+): ${excellentHabits.length} habits
  ${excellentHabits.slice(0, 3).map((h: HabitPerfItem) => `  • ${h.name}: ${h.completionRate}%`).join('\n')}
  
- Struggling Habits (<50%): ${strugglingHabits.length} habits
  ${strugglingHabits.slice(0, 3).map((h: HabitPerfItem) => `  • ${h.name}: ${h.completionRate}%`).join('\n')}
  
- Active Streaks (7+ days): ${longStreaks.length} habits
  ${longStreaks.slice(0, 3).map((h: HabitPerfItem) => `  • ${h.name}: ${h.currentStreak} days`).join('\n')}

CATEGORY PERFORMANCE:
- Strongest: ${bestCategory.name} (${bestCategory.completionRate}% completion)
- Needs Work: ${strugglingCategory.name} (${strugglingCategory.completionRate}% completion)

RECENT TRENDS (Last 7 days):
${recentPerformance.map((day: WeeklyDataItem) => `${day.name}: ${day.percentage || 0}%`).join(', ')}
Generate insights that help the user improve their habit journey.`;
}

function parseInsights(response: string): AIInsight[] {
    try {
        // Clean the response
        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (Array.isArray(parsed)) {
            return parsed.filter(insight =>
                insight.type && insight.title && insight.description
            ).map(insight => ({
                ...insight,
                priority: insight.priority || 'medium'
            }));
        }

        return [];
    } catch (error) {
        console.error('Error parsing AI insights:', error);
        return [];
    }
}

function getDefaultInsights(habits: IHabit[], analyticsData: any): AIInsight[] {
    const insights: AIInsight[] = [];

    if (habits.length === 0) {
        insights.push({
            type: 'tip',
            title: '🌟 Start Your Habit Journey',
            description: 'Create your first habit to begin building a better you. Start small with just 2-3 minutes daily.',
            action: 'Create First Habit',
            priority: 'high'
        });
    } else {
        const activeHabits = habits.filter(h => h.status === 'active');
        const totalStreaks = activeHabits.reduce((sum, h) => sum + h.streak, 0);

        if (totalStreaks > 0) {
            insights.push({
                type: 'success',
                title: '🔥 Great Momentum!',
                description: `You've built ${totalStreaks} total streak days across your habits. Keep the consistency going!`,
                priority: 'medium'
            });
        }

        if (activeHabits.length >= 3) {
            insights.push({
                type: 'achievement',
                title: '📈 Habit Builder',
                description: `You're tracking ${activeHabits.length} active habits. Focus on consistency over quantity.`,
                priority: 'medium'
            });
        }

        insights.push({
            type: 'tip',
            title: '💡 Daily Consistency',
            description: 'The key to lasting habits is showing up every day, even if just for 2 minutes.',
            priority: 'low'
        });
    }

    return insights;
}