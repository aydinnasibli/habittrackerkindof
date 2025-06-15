import OpenAI from 'openai';
import { IHabit, IProfile } from '@/lib/types';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export interface AIRecommendedHabit {
    id: string;
    name: string;
    description: string;
    category: string;
    frequency: string;
    timeOfDay: string;
    timeToComplete: string;
    priority: string;
    matchScore: number;
    benefits: string[];
    impactAreas: string[];
    chainsWith: string[];
    aiReasoning: string; // Why AI recommended this
}

export async function generatePersonalizedRecommendations(
    userHabits: IHabit[],
    profile: IProfile,
    section: 'for-you' | 'trending' | 'new-habits'
): Promise<AIRecommendedHabit[]> {
    try {
        // Analyze user's existing habits
        const habitAnalysis = analyzeUserHabits(userHabits);

        // Create context-aware prompt based on section
        const prompt = createSectionPrompt(section, habitAnalysis, profile);

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                {
                    role: "system",
                    content: "You are a habit formation expert and behavioral psychologist. Generate habit recommendations in valid JSON format."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.8,
            response_format: { type: "json_object" }
        });

        const response = JSON.parse(completion.choices[0].message.content || '{}');
        return response.recommendations || [];
    } catch (error) {
        console.error('OpenAI recommendation error:', error);
        // Fallback to enhanced mock data if AI fails
        return getFallbackRecommendations(section, userHabits);
    }
}

function analyzeUserHabits(habits: IHabit[]) {
    const categories = habits.reduce((acc, habit) => {
        acc[habit.category] = (acc[habit.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const timeSlots = habits.reduce((acc, habit) => {
        acc[habit.timeOfDay] = (acc[habit.timeOfDay] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const avgStreak = habits.length > 0
        ? habits.reduce((sum, h) => sum + h.streak, 0) / habits.length
        : 0;

    const completionRate = calculateOverallCompletionRate(habits);

    return {
        categories,
        timeSlots,
        avgStreak,
        completionRate,
        totalHabits: habits.length,
        priorities: habits.map(h => h.priority),
    };
}

function createSectionPrompt(
    section: string,
    analysis: ReturnType<typeof analyzeUserHabits>,
    profile: IProfile
): string {
    const baseContext = `
User Profile:
- Current habits: ${analysis.totalHabits}
- Preferred categories: ${JSON.stringify(analysis.categories)}
- Preferred time slots: ${JSON.stringify(analysis.timeSlots)}
- Average streak: ${analysis.avgStreak.toFixed(1)} days
- Completion rate: ${(analysis.completionRate * 100).toFixed(1)}%
- Daily habit target: ${profile.goals.dailyHabitTarget}
- User level: ${profile.rank.title} (${profile.xp.total} XP)
`;

    const sectionPrompts = {
        'for-you': `
${baseContext}

Generate 5 PERSONALIZED habit recommendations that:
1. Complement their existing habits without overwhelming
2. Match their preferred time slots but fill gaps
3. Consider their completion rate (${analysis.completionRate < 0.7 ? 'suggest easier habits' : 'can handle challenging habits'})
4. Build on categories they already enjoy while introducing beneficial new ones
5. Create synergy with existing habits for chain potential

Focus on habits that will genuinely improve their life based on their current journey.
`,
        'trending': `
${baseContext}

Generate 5 TRENDING habit recommendations that are:
1. Popular in the wellness community right now
2. Backed by recent scientific research
3. Viral on social media but actually beneficial
4. Modern adaptations of proven practices
5. Tech-enhanced or gamified approaches

Include habits like: cold plunges, breath work variations, microworkouts, dopamine detox practices, etc.
Make them appealing to someone at ${profile.rank.title} level.
`,
        'new-habits': `
${baseContext}

Generate 5 INNOVATIVE habit recommendations that:
1. They likely haven't tried before
2. Come from different cultures or disciplines
3. Challenge them in new ways appropriate for ${profile.rank.title} level
4. Complement gaps in their current categories: ${getMissingCategories(analysis.categories)}
5. Introduce unique time-of-day opportunities they're not using

Be creative but practical. Suggest habits that expand their horizons.
`
    };

    return `${sectionPrompts[section as keyof typeof sectionPrompts]}

Return a JSON object with a "recommendations" array containing exactly 5 habits.
Each habit must have this exact structure:
{
  "id": "ai-[section]-[timestamp]-[index]",
  "name": "Habit name (2-4 words)",
  "description": "Clear, actionable description (10-20 words)",
  "category": "One of: Mindfulness, Health, Learning, Productivity, Digital Wellbeing",
  "frequency": "One of: Daily, Weekdays, Weekends, Mon, Wed, Fri, Tue, Thu",
  "timeOfDay": "One of: Morning, Afternoon, Evening, Throughout day",
  "timeToComplete": "X minutes (5-30 range)",
  "priority": "One of: High, Medium, Low",
  "matchScore": 70-99 (integer based on relevance),
  "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
  "impactAreas": ["Area 1", "Area 2"] (from: Mental Health, Physical Health, Productivity, Energy, etc),
  "chainsWith": ["Names of user's existing habits or other recommendations this pairs well with"],
  "aiReasoning": "One sentence explaining why this was recommended for this specific user"
}`;
}

function getMissingCategories(userCategories: Record<string, number>): string {
    const allCategories = ['Mindfulness', 'Health', 'Learning', 'Productivity', 'Digital Wellbeing'];
    const missing = allCategories.filter(cat => !userCategories[cat] || userCategories[cat] < 2);
    return missing.join(', ') || 'all categories covered';
}

function calculateOverallCompletionRate(habits: IHabit[]): number {
    if (habits.length === 0) return 0;

    const last7Days = habits.map(habit => {
        const recentCompletions = habit.completions
            .filter(c => {
                const daysDiff = (Date.now() - new Date(c.date).getTime()) / (1000 * 60 * 60 * 24);
                return daysDiff <= 7;
            });

        const completed = recentCompletions.filter(c => c.completed).length;
        return completed / Math.max(recentCompletions.length, 1);
    });

    return last7Days.reduce((sum, rate) => sum + rate, 0) / habits.length;
}

// Fallback function with your existing mock data structure
function getFallbackRecommendations(
    section: string,
    userHabits: IHabit[]
): AIRecommendedHabit[] {
    // Use your existing mock data logic here as fallback
    // This ensures the app works even if OpenAI is down
    return [];
}
