// lib/services/habit-analytics-ai.ts
import OpenAI from 'openai';
import { IHabit, IProfile } from '@/lib/types';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

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
    const { weeklyData, categoryInsights, habitPerformance, scores } = analyticsData;

    const recentPerformance = weeklyData.slice(-7);
    const avgRecentCompletion = recentPerformance.reduce((sum, day) => sum + day.percentage, 0) / 7;

    const strugglingHabits = habitPerformance.filter(h => h.completionRate < 50);
    const excellentHabits = habitPerformance.filter(h => h.completionRate >= 80);
    const longStreaks = habitPerformance.filter(h => h.currentStreak >= 7);

    const bestCategory = categoryInsights.reduce((best, cat) =>
        cat.completionRate > best.completionRate ? cat : best
    );

    const strugglingCategory = categoryInsights.reduce((worst, cat) =>
        cat.completionRate < worst.completionRate ? cat : worst
    );

    return `
HABIT ANALYTICS DATA for ${profile?.firstName || 'User'}:

OVERALL METRICS:
- Total Habits: ${habits.length}
- Recent Average Completion: ${Math.round(avgRecentCompletion)}%
- Motivation Score: ${scores.motivation}/100
- Consistency Score: ${scores.consistency}/100
- Diversity Score: ${scores.diversity}/100

PERFORMANCE BREAKDOWN:
- Excellent Habits (80%+): ${excellentHabits.length} habits
  ${excellentHabits.slice(0, 3).map(h => `  • ${h.name}: ${h.completionRate}%`).join('\n')}
  
- Struggling Habits (<50%): ${strugglingHabits.length} habits
  ${strugglingHabits.slice(0, 3).map(h => `  • ${h.name}: ${h.completionRate}%`).join('\n')}
  
- Active Streaks (7+ days): ${longStreaks.length} habits
  ${longStreaks.slice(0, 3).map(h => `  • ${h.name}: ${h.currentStreak} days`).join('\n')}

CATEGORY PERFORMANCE:
- Strongest: ${bestCategory.name} (${bestCategory.completionRate}% completion)
- Needs Work: ${strugglingCategory.name} (${strugglingCategory.completionRate}% completion)

RECENT TRENDS (Last 7 days):
${recentPerformance.map(day => `${day.name}: ${day.percentage}%`).join(', ')}

WEEKLY PATTERNS:
- Best performing day: ${recentPerformance.reduce((best, day) => day.percentage > best.percentage ? day : best).name}
- Most challenging day: ${recentPerformance.reduce((worst, day) => day.percentage < worst.percentage ? day : worst).name}

Generate insights that:
1. Celebrate specific achievements with exact numbers
2. Identify concerning patterns and suggest solutions
3. Provide actionable tips for improvement
4. Recognize milestones and streaks
5. Give strategic advice for habit optimization

Focus on what matters most for this user's habit journey.`;
}

function parseInsights(response: string): AIInsight[] {
    try {
        let jsonStr = response.trim();

        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
        } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');
        }

        const insights = JSON.parse(jsonStr);

        if (!Array.isArray(insights)) {
            throw new Error('Response is not an array');
        }

        return insights.map((insight: any) => ({
            type: ['success', 'warning', 'tip', 'achievement'].includes(insight.type)
                ? insight.type : 'tip',
            title: insight.title || 'Insight',
            description: insight.description || 'Keep up the great work!',
            action: insight.action,
            priority: ['high', 'medium', 'low'].includes(insight.priority)
                ? insight.priority : 'medium'
        }));

    } catch (error) {
        console.error('Error parsing insights:', error);
        return [];
    }
}

function getDefaultInsights(habits: IHabit[], analyticsData: any): AIInsight[] {
    const insights: AIInsight[] = [];

    if (habits.length === 0) {
        return [{
            type: 'tip',
            title: 'Start Your Habit Journey',
            description: 'Begin with 1-2 simple habits to build momentum and create lasting change.',
            action: 'Add Your First Habit',
            priority: 'high'
        }];
    }

    // Active streaks
    const activeStreaks = habits.filter(h => h.streak > 0);
    if (activeStreaks.length > 0) {
        const longestStreak = Math.max(...activeStreaks.map(h => h.streak));
        insights.push({
            type: 'success',
            title: `${longestStreak}-Day Streak! 🔥`,
            description: `You're maintaining ${activeStreaks.length} active streaks. Your longest is ${longestStreak} days!`,
            priority: 'high'
        });
    }

    // Completion rate insight
    const totalCompletions = habits.reduce((sum, h) =>
        sum + (h.completions?.filter(c => c.completed).length || 0), 0);
    const totalAttempts = habits.reduce((sum, h) =>
        sum + (h.completions?.length || 0), 0);
    const overallRate = totalAttempts > 0 ? Math.round((totalCompletions / totalAttempts) * 100) : 0;

    if (overallRate >= 80) {
        insights.push({
            type: 'achievement',
            title: 'Consistency Champion',
            description: `Incredible! You're maintaining an ${overallRate}% completion rate across all habits.`,
            priority: 'high'
        });
    } else if (overallRate < 50) {
        insights.push({
            type: 'tip',
            title: 'Focus on Fewer Habits',
            description: `Your completion rate is ${overallRate}%. Try focusing on 2-3 core habits to build stronger foundations.`,
            action: 'Review Your Habits',
            priority: 'medium'
        });
    }

    // Recent activity
    const recentActivity = habits.filter(h => {
        const lastCompletion = h.completions?.slice(-1)[0];
        if (!lastCompletion) return false;
        const daysSince = Math.floor((Date.now() - new Date(lastCompletion.date).getTime()) / (1000 * 60 * 60 * 24));
        return daysSince <= 1;
    });

    if (recentActivity.length === 0) {
        insights.push({
            type: 'warning',
            title: 'Stay Connected',
            description: 'No recent activity detected. Small consistent actions lead to big results.',
            action: 'Check In Today',
            priority: 'high'
        });
    }

    return insights.slice(0, 4);
}