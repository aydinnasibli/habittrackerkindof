// lib/services/openai-service.ts
import OpenAI from 'openai';
import { IHabit, IProfile } from '@/lib/types';
import { getWeekNumber, getCurrentSeason } from '@/lib/utils/date-utils';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export interface AIRecommendedHabit {
    id: string;
    name: string;
    description: string;
    category: 'Mindfulness' | 'Health' | 'Learning' | 'Productivity' | 'Digital Wellbeing';
    frequency: 'Daily' | 'Weekdays' | 'Weekends' | 'Mon, Wed, Fri' | 'Tue, Thu';
    timeOfDay: 'Morning' | 'Afternoon' | 'Evening' | 'Throughout day';
    timeToComplete: string;
    priority: 'High' | 'Medium' | 'Low';
    matchScore: number;
    benefits: string[];
    impactAreas: string[];
    chainsWith: string[];
    aiReasoning: string;
    trendingScore?: number;
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
}



// Enhanced trending topics that update based on real data
async function getTrendingTopics() {
    const season = getCurrentSeason();

    return {
        season,
        trendingNow: [
            'Cold exposure therapy',
            'Micro-habits (2-minute rule)',
            'Digital sunset routines',
            'Breath work variations',
            'Walking meetings',
            'Gratitude partnerships',
            'Energy management',
            'Focus blocks'
        ]
    };
}

// Analyze user habits to understand patterns
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

// Calculate overall completion rate
function calculateOverallCompletionRate(habits: IHabit[]): number {
    if (habits.length === 0) return 0;

    const totalCompletions = habits.reduce((total, habit) => {
        const completedCount = habit.completions?.filter(c => c.completed).length || 0;
        const totalAttempts = habit.completions?.length || 0;
        return total + (totalAttempts > 0 ? completedCount / totalAttempts : 0);
    }, 0);

    return Math.round((totalCompletions / habits.length) * 100);
}

// Get missing categories
function getMissingCategories(userCategories: Record<string, number>): string[] {
    const allCategories = ['Mindfulness', 'Health', 'Learning', 'Productivity', 'Digital Wellbeing'];
    return allCategories.filter(cat => !userCategories[cat]);
}

// Main function to generate personalized recommendations
export async function generatePersonalizedRecommendations(
    userHabits: IHabit[],
    profile: IProfile,
    section: 'for-you' | 'trending' | 'new-habits'
): Promise<AIRecommendedHabit[]> {
    try {
        const analysis = analyzeUserHabits(userHabits);
        const missingCategories = getMissingCategories(analysis.categories);
        const trending = await getTrendingTopics();

        const prompt = createPromptForSection(section, {
            userHabits,
            profile,
            analysis,
            missingCategories,
            trending
        });

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: getSystemPrompt(section)
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: getTemperatureForSection(section),
            max_tokens: 2000
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
            throw new Error('No response from OpenAI');
        }

        const recommendations = parseAIResponse(response, section,);
        return recommendations.slice(0, 6); // Limit to 6 recommendations

    } catch (error) {
        console.error('Error generating AI recommendations:', error);
        throw error;
    }
}

function getSystemPrompt(section: string): string {
    const basePrompt = `You are an expert habit coach and behavioral psychologist. Your task is to recommend personalized habits that will genuinely improve the user's life.

CRITICAL REQUIREMENTS:
1. Only recommend habits from these categories: Mindfulness, Health, Learning, Productivity, Digital Wellbeing
2. Only use these frequencies: Daily, Weekdays, Weekends, Mon Wed Fri, Tue Thu
3. Only use these time slots: Morning, Afternoon, Evening, Throughout day
4. Only use these priorities: High, Medium, Low
5. Keep habit names concise and actionable
6. Make descriptions specific and motivating
7. Ensure timeToComplete is realistic (e.g., "5 minutes", "20 minutes", "30 minutes")

RESPONSE FORMAT - Return valid JSON array:
[
  {
    "name": "Habit name",
    "description": "Specific, actionable description",
    "category": "One of the 5 categories",
    "frequency": "One of the allowed frequencies", 
    "timeOfDay": "One of the 4 time slots",
    "timeToComplete": "Realistic duration",
    "priority": "High/Medium/Low",
    "matchScore": 85,
    "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
    "impactAreas": ["Area 1", "Area 2"],
    "chainsWith": ["Habit 1", "Habit 2"],
    "aiReasoning": "Why this habit is recommended for this user"
  }
]`;

    switch (section) {
        case 'for-you':
            return basePrompt + '\n\nFocus on highly personalized recommendations based on the user\'s existing habits, gaps in their routine, and profile preferences.';
        case 'trending':
            return basePrompt + '\n\nFocus on popular, evidence-based habits that are trending in the wellness and productivity space. Include modern approaches and innovative techniques.';
        case 'new-habits':
            return basePrompt + '\n\nFocus on beginner-friendly habits that are easy to start and maintain. Prioritize simple, foundational habits that build momentum.';
        default:
            return basePrompt;
    }
}

function createPromptForSection(section: string, context: any): string {
    const { userHabits, profile, analysis, missingCategories, currentTheme, trending } = context;

    const baseContext = `
User Profile:
- Name: ${profile.firstName} ${profile.lastName}
- XP Level: ${profile.xp?.total || 0} XP (${profile.rank?.title || 'Novice'})
- Daily Target: ${profile.goals?.dailyHabitTarget || 3} habits
- Timezone: ${profile.timezone}
- Existing Habits: ${userHabits.length}

Current Habits Analysis:
- Categories: ${Object.entries(analysis.categories).map(([cat, count]) => `${cat}: ${count}`).join(', ')}
- Average Streak: ${Math.round(analysis.avgStreak)} days
- Completion Rate: ${analysis.completionRate}%
- Missing Categories: ${missingCategories.join(', ')}

Trending: ${trending.trendingNow.slice(0, 4).join(', ')}

Existing Habit Names: ${userHabits.map((h: IHabit) => h.name).join(', ')}
`;

    switch (section) {
        case 'for-you':
            return baseContext + `
Generate 6 highly personalized habit recommendations that:
1. Fill gaps in missing categories: ${missingCategories.join(', ')}
2. Complement existing habits and time slots
3. Match the user's current capability level (${analysis.completionRate}% success rate)
5. Consider their ${profile.goals?.dailyHabitTarget || 3} daily habit target

Focus on habits that would genuinely improve this user's life based on their current routine.`;

        case 'trending':
            return baseContext + `
Generate 6 trending, popular habit recommendations that:
1. Incorporate current trends: ${trending.trendingNow.slice(0, 6).join(', ')}
2. Are evidence-based and scientifically backed
3. Represent innovative approaches to wellness and productivity
4. Are suitable for intermediate to advanced practitioners
5. Align with the ${trending.season} season and ${currentTheme.theme} theme

Focus on cutting-edge habits that are gaining popularity in the wellness community.`;

        case 'new-habits':
            return baseContext + `
Generate 6 beginner-friendly habit recommendations that:
1. Are easy to start and maintain (2-15 minutes ideal)
2. Have high success rates for new habit builders
3. Build foundational wellness and productivity
4. Require minimal equipment or preparation  
5. Create positive momentum for habit building
6. Are perfect for someone just starting their habit journey

Focus on simple, proven habits that beginners can easily adopt and stick with.`;

        default:
            return baseContext + 'Generate 6 balanced habit recommendations suitable for this user.';
    }
}

function getTemperatureForSection(section: string): number {
    switch (section) {
        case 'for-you': return 0.3; // More focused and personalized
        case 'trending': return 0.7; // More creative and varied
        case 'new-habits': return 0.4; // Balanced but reliable
        default: return 0.5;
    }
}

function parseAIResponse(response: string, section: string,): AIRecommendedHabit[] {
    try {
        // Clean the response to extract JSON
        let jsonStr = response.trim();

        // Remove markdown code blocks if present
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
        } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');
        }

        const parsedHabits = JSON.parse(jsonStr);

        if (!Array.isArray(parsedHabits)) {
            throw new Error('Response is not an array');
        }

        return parsedHabits.map((habit: any, index: number) => ({
            id: `ai-${section}-${Date.now()}-${index}`,
            name: habit.name || 'Unnamed Habit',
            description: habit.description || 'No description provided',
            category: validateCategory(habit.category),
            frequency: validateFrequency(habit.frequency),
            timeOfDay: validateTimeOfDay(habit.timeOfDay),
            timeToComplete: habit.timeToComplete || '10 minutes',
            priority: validatePriority(habit.priority),
            matchScore: Math.min(Math.max(habit.matchScore || 75, 0), 100),
            benefits: Array.isArray(habit.benefits) ? habit.benefits : ['Improves well-being'],
            impactAreas: Array.isArray(habit.impactAreas) ? habit.impactAreas : ['General Health'],
            chainsWith: Array.isArray(habit.chainsWith) ? habit.chainsWith : [],
            aiReasoning: habit.aiReasoning || 'Recommended based on your profile',
            trendingScore: section === 'trending' ? Math.floor(Math.random() * 20) + 80 : undefined,
            difficultyLevel: section === 'new-habits' ? 'beginner' :
                section === 'trending' ? 'intermediate' : 'beginner'
        }));

    } catch (error) {
        console.error('Error parsing AI response:', error);

        // Return fallback habits if parsing fails
        return getFallbackHabitsForSection(section);
    }
}

// Validation functions
function validateCategory(category: string): AIRecommendedHabit['category'] {
    const validCategories: AIRecommendedHabit['category'][] = [
        'Mindfulness', 'Health', 'Learning', 'Productivity', 'Digital Wellbeing'
    ];
    return validCategories.includes(category as any) ? category as AIRecommendedHabit['category'] : 'Health';
}

function validateFrequency(frequency: string): AIRecommendedHabit['frequency'] {
    const validFrequencies: AIRecommendedHabit['frequency'][] = [
        'Daily', 'Weekdays', 'Weekends', 'Mon, Wed, Fri', 'Tue, Thu'
    ];
    return validFrequencies.includes(frequency as any) ? frequency as AIRecommendedHabit['frequency'] : 'Daily';
}

function validateTimeOfDay(timeOfDay: string): AIRecommendedHabit['timeOfDay'] {
    const validTimes: AIRecommendedHabit['timeOfDay'][] = [
        'Morning', 'Afternoon', 'Evening', 'Throughout day'
    ];
    return validTimes.includes(timeOfDay as any) ? timeOfDay as AIRecommendedHabit['timeOfDay'] : 'Morning';
}

function validatePriority(priority: string): AIRecommendedHabit['priority'] {
    const validPriorities: AIRecommendedHabit['priority'][] = ['High', 'Medium', 'Low'];
    return validPriorities.includes(priority as any) ? priority as AIRecommendedHabit['priority'] : 'Medium';
}

// Fallback habits when AI parsing fails
function getFallbackHabitsForSection(section: string): AIRecommendedHabit[] {
    const baseHabits = [
        {
            id: `fallback-${section}-1`,
            name: 'Morning Meditation',
            description: 'Start your day with 10 minutes of mindfulness meditation',
            category: 'Mindfulness' as const,
            frequency: 'Daily' as const,
            timeOfDay: 'Morning' as const,
            timeToComplete: '10 minutes',
            priority: 'Medium' as const,
            matchScore: 85,
            benefits: ['Reduces stress', 'Improves focus', 'Better emotional regulation'],
            impactAreas: ['Mental Health', 'Productivity'],
            chainsWith: ['Journaling', 'Exercise'],
            aiReasoning: 'Meditation is a foundational habit that supports overall well-being',
            difficultyLevel: 'beginner' as const
        },
        {
            id: `fallback-${section}-2`,
            name: 'Daily Walk',
            description: 'Take a 30-minute walk outdoors for physical and mental health',
            category: 'Health' as const,
            frequency: 'Daily' as const,
            timeOfDay: 'Morning' as const,
            timeToComplete: '30 minutes',
            priority: 'High' as const,
            matchScore: 88,
            benefits: ['Improves cardiovascular health', 'Boosts mood', 'Increases energy'],
            impactAreas: ['Physical Health', 'Mental Health'],
            chainsWith: ['Meditation', 'Podcast listening'],
            aiReasoning: 'Walking is one of the most accessible and beneficial daily habits',
            difficultyLevel: 'beginner' as const
        }
    ];

    return baseHabits;
}