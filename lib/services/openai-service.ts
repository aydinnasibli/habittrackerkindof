// lib/services/enhanced-openai-service.ts
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
    aiReasoning: string;
    weeklyTheme?: string;
    trendingScore?: number;
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
}

// Weekly themes that rotate to keep content fresh
const WEEKLY_THEMES = [
    { theme: 'Mindful Mornings', focus: 'morning routines and mindfulness' },
    { theme: 'Energy & Vitality', focus: 'physical health and energy optimization' },
    { theme: 'Digital Wellness', focus: 'healthy technology habits and boundaries' },
    { theme: 'Learning & Growth', focus: 'skill development and knowledge acquisition' },
    { theme: 'Social Connection', focus: 'relationships and community building' },
    { theme: 'Creative Expression', focus: 'creativity and artistic pursuits' },
    { theme: 'Financial Wellness', focus: 'money management and financial health' },
    { theme: 'Environmental Impact', focus: 'sustainability and eco-friendly habits' },
];

// Get week number of the year
function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Get current season
function getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
}

// Get current weekly theme
function getCurrentWeeklyTheme() {
    const weekNumber = getWeekNumber(new Date());
    return WEEKLY_THEMES[weekNumber % WEEKLY_THEMES.length];
}

// Enhanced trending topics that update based on real data
async function getTrendingTopics() {
    const currentTheme = getCurrentWeeklyTheme();
    const season = getCurrentSeason();

    return {
        currentTheme,
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

// Weekly context generation
async function getWeeklyContext(section: string) {
    const currentTheme = getCurrentWeeklyTheme();
    const trending = await getTrendingTopics();

    return {
        theme: currentTheme.theme,
        focus: currentTheme.focus,
        trending: trending.trendingNow,
        season: trending.season,
        weekNumber: getWeekNumber(new Date())
    };
}

// Get temperature for different sections
function getTemperatureForSection(section: string): number {
    switch (section) {
        case 'for-you': return 0.7; // More consistent, personalized
        case 'trending': return 0.8; // Slightly more creative
        case 'new-habits': return 0.9; // Most creative and diverse
        default: return 0.8;
    }
}

// Enhanced system prompts for each section
function getSystemPrompt(section: string, weeklyContext: any): string {
    const basePrompt = `You are an expert habit formation coach and behavioral psychologist with deep knowledge of:
- Behavioral psychology and habit loops
- Neuroscience of habit formation
- Cultural wellness practices
- Modern productivity techniques
- Evidence-based wellness research

Current context: Week of ${new Date().toLocaleDateString()}, Theme: "${weeklyContext.theme}"`;

    const sectionPrompts = {
        'for-you': `${basePrompt}
        
You create PERSONALIZED recommendations by analyzing user patterns and finding optimal habit additions that complement their existing routine without causing overwhelm.`,

        'trending': `${basePrompt}
        
You identify TRENDING habits that are:
- Currently popular in wellness communities
- Backed by recent scientific research
- Viral but genuinely beneficial
- Adapted for modern lifestyles
- Aligned with this week's theme: "${weeklyContext.theme}"`,

        'new-habits': `${basePrompt}
        
You discover INNOVATIVE habits that:
- Come from different cultures and disciplines
- Offer unique approaches to common goals
- Challenge users in novel ways
- Fill gaps in traditional habit categories
- Incorporate this week's focus: "${weeklyContext.focus}"`
    };

    return sectionPrompts[section as keyof typeof sectionPrompts];
}

// Create enhanced prompts
function createEnhancedPrompt(
    section: string,
    analysis: ReturnType<typeof analyzeUserHabits>,
    profile: IProfile,
    weeklyContext: any
): string {
    const baseContext = `
User Profile:
- Current habits: ${analysis.totalHabits}
- Preferred categories: ${JSON.stringify(analysis.categories)}
- Preferred time slots: ${JSON.stringify(analysis.timeSlots)}
- Average streak: ${analysis.avgStreak.toFixed(1)} days
- Completion rate: ${(analysis.completionRate).toFixed(1)}%
- Daily habit target: ${profile.goals.dailyHabitTarget}
- User level: ${profile.rank.title} (${profile.xp.total} XP)
- Weekly theme: ${weeklyContext.theme}
`;

    const sectionPrompts = {
        'for-you': `
${baseContext}

Generate 5 PERSONALIZED habit recommendations that:
1. Complement their existing habits without overwhelming
2. Match their preferred time slots but fill gaps
3. Consider their completion rate (${analysis.completionRate < 70 ? 'suggest easier habits' : 'can handle challenging habits'})
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

Include habits related to: ${weeklyContext.trending.slice(0, 4).join(', ')}
Make them appealing to someone at ${profile.rank.title} level.
`,
        'new-habits': `
${baseContext}

Generate 5 INNOVATIVE habit recommendations that:
1. They likely haven't tried before
2. Come from different cultures or disciplines
3. Challenge them in new ways appropriate for ${profile.rank.title} level
4. Complement gaps in their current categories: ${getMissingCategories(analysis.categories).join(', ')}
5. Introduce unique time-of-day opportunities they're not using

Be creative but practical. Focus on: ${weeklyContext.focus}
`
    };

    return `${sectionPrompts[section as keyof typeof sectionPrompts]}

Return a JSON object with a "recommendations" array containing exactly 5 habits.
Each habit must have this exact structure:
{
  "id": "unique-id",
  "name": "Habit Name",
  "description": "Clear, actionable description",
  "category": "One of: Mindfulness, Health, Learning, Productivity, Digital Wellbeing",
  "frequency": "One of: Daily, Weekdays, Weekends, Mon, Wed, Fri, Tue, Thu",
  "timeOfDay": "One of: Morning, Afternoon, Evening, Throughout day",
  "timeToComplete": "e.g., 5 minutes, 10 minutes, 15 minutes",
  "priority": "One of: High, Medium, Low",
  "matchScore": number between 70-100,
  "benefits": ["benefit1", "benefit2", "benefit3"],
  "impactAreas": ["area1", "area2"],
  "chainsWith": ["habit1", "habit2"],
  "aiReasoning": "Why I recommended this specific habit for this user"
}`;
}

// Calculate match score
function calculateMatchScore(habit: any, analysis: ReturnType<typeof analyzeUserHabits>, profile: IProfile): number {
    let score = 75; // Base score

    // Boost if category is already preferred
    if (analysis.categories[habit.category]) {
        score += 10;
    }

    // Boost if time slot is preferred
    if (analysis.timeSlots[habit.timeOfDay]) {
        score += 5;
    }

    // Adjust based on completion rate
    if (analysis.completionRate > 80 && habit.priority === 'High') {
        score += 10;
    } else if (analysis.completionRate < 60 && habit.priority === 'Low') {
        score += 10;
    }

    // Random factor for variety
    score += Math.floor(Math.random() * 10);

    return Math.min(100, Math.max(70, score));
}

// Main function to generate personalized recommendations
export async function generatePersonalizedRecommendations(
    userHabits: IHabit[],
    profile: IProfile,
    section: 'for-you' | 'trending' | 'new-habits'
): Promise<AIRecommendedHabit[]> {
    try {
        const habitAnalysis = analyzeUserHabits(userHabits);
        const weeklyContext = await getWeeklyContext(section);
        const prompt = createEnhancedPrompt(section, habitAnalysis, profile, weeklyContext);

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                {
                    role: "system",
                    content: getSystemPrompt(section, weeklyContext)
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: getTemperatureForSection(section),
            max_tokens: 2000,
            response_format: { type: "json_object" }
        });

        const response = JSON.parse(completion.choices[0].message.content || '{}');
        const recommendations = response.recommendations || [];

        // Post-process recommendations
        return recommendations.map((rec: any, index: number) => ({
            ...rec,
            id: `ai-${section}-${Date.now()}-${index}`,
            weeklyTheme: weeklyContext.theme,
            matchScore: calculateMatchScore(rec, habitAnalysis, profile),
        }));

    } catch (error) {
        console.error('AI recommendation error:', error);
        return getIntelligentFallback(section, userHabits, profile);
    }
}

// Intelligent fallback system
export function getIntelligentFallback(
    section: 'for-you' | 'trending' | 'new-habits',
    userHabits: IHabit[],
    profile: IProfile | null
): AIRecommendedHabit[] {
    const currentTheme = getCurrentWeeklyTheme();

    // Fallback recommendations based on section
    const fallbackData = {
        'for-you': [
            {
                id: 'fallback-1',
                name: 'Morning Gratitude',
                description: 'Write down 3 things you\'re grateful for each morning',
                category: 'Mindfulness',
                frequency: 'Daily',
                timeOfDay: 'Morning',
                timeToComplete: '5 minutes',
                priority: 'Medium',
                matchScore: 85,
                benefits: ['Improved mood', 'Better perspective', 'Reduced stress'],
                impactAreas: ['Mental Health', 'Emotional Wellbeing'],
                chainsWith: ['Meditation', 'Morning routine'],
                aiReasoning: 'Gratitude practice is a foundational habit that works well for most people and complements other morning routines.'
            },
            {
                id: 'fallback-2',
                name: 'Daily Walk',
                description: '10-minute walk outside for fresh air and movement',
                category: 'Health',
                frequency: 'Daily',
                timeOfDay: 'Afternoon',
                timeToComplete: '10 minutes',
                priority: 'Medium',
                matchScore: 82,
                benefits: ['Better circulation', 'Mental clarity', 'Vitamin D'],
                impactAreas: ['Physical Health', 'Mental Clarity'],
                chainsWith: ['Exercise', 'Mindfulness'],
                aiReasoning: 'Walking is accessible to everyone and provides both physical and mental benefits with minimal barrier to entry.'
            }
        ],
        'trending': [
            {
                id: 'trending-1',
                name: 'Cold Shower Finish',
                description: 'End your shower with 30 seconds of cold water',
                category: 'Health',
                frequency: 'Daily',
                timeOfDay: 'Morning',
                timeToComplete: '2 minutes',
                priority: 'Medium',
                matchScore: 88,
                benefits: ['Increased alertness', 'Better immunity', 'Mental resilience'],
                impactAreas: ['Physical Health', 'Mental Toughness'],
                chainsWith: ['Morning routine', 'Exercise'],
                aiReasoning: 'Cold exposure is trending due to research on its benefits for metabolism and mental resilience.'
            },
            {
                id: 'trending-2',
                name: 'Phone-Free Meals',
                description: 'Eat at least one meal per day without any devices',
                category: 'Digital Wellbeing',
                frequency: 'Daily',
                timeOfDay: 'Throughout day',
                timeToComplete: '20 minutes',
                priority: 'High',
                matchScore: 86,
                benefits: ['Better digestion', 'Mindful eating', 'Reduced screen time'],
                impactAreas: ['Digital Health', 'Mindfulness'],
                chainsWith: ['Mindful eating', 'Family time'],
                aiReasoning: 'Digital wellness is increasingly important as people recognize the need for healthy boundaries with technology.'
            }
        ],
        'new-habits': [
            {
                id: 'discover-1',
                name: 'Forest Bathing',
                description: 'Spend 15 minutes mindfully observing nature',
                category: 'Mindfulness',
                frequency: 'Weekends',
                timeOfDay: 'Afternoon',
                timeToComplete: '15 minutes',
                priority: 'Low',
                matchScore: 79,
                benefits: ['Reduced cortisol', 'Enhanced creativity', 'Nature connection'],
                impactAreas: ['Mental Health', 'Creativity'],
                chainsWith: ['Walking', 'Meditation'],
                aiReasoning: 'Forest bathing is a Japanese practice (shinrin-yoku) that\'s gaining recognition for its proven stress-reduction benefits.'
            },
            {
                id: 'discover-2',
                name: 'Energy Audit',
                description: 'Track your energy levels hourly to identify patterns',
                category: 'Learning',
                frequency: 'Weekdays',
                timeOfDay: 'Throughout day',
                timeToComplete: '2 minutes',
                priority: 'Medium',
                matchScore: 83,
                benefits: ['Self-awareness', 'Better scheduling', 'Optimized productivity'],
                impactAreas: ['Productivity', 'Self-Knowledge'],
                chainsWith: ['Time blocking', 'Sleep tracking'],
                aiReasoning: 'Understanding personal energy patterns is crucial for optimizing daily schedules and improving productivity.'
            }
        ]
    };

    const recommendations = fallbackData[section] || fallbackData['for-you'];

    return recommendations.map(rec => ({
        ...rec,
        weeklyTheme: currentTheme.theme,
    }));
}
