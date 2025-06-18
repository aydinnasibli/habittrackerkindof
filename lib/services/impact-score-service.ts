// lib/services/impact-score-service.ts
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export interface HabitImpactData {
    name: string;
    description: string;
    category: 'Mindfulness' | 'Health' | 'Learning' | 'Productivity' | 'Digital Wellbeing';
    frequency: 'Daily' | 'Weekdays' | 'Weekends' | 'Mon, Wed, Fri' | 'Tue, Thu';
    timeOfDay: 'Morning' | 'Afternoon' | 'Evening' | 'Throughout day';
    timeToComplete: string;
    priority: 'High' | 'Medium' | 'Low';
}

export interface ImpactScoreResult {
    score: number;
    reasoning: string;
    factors: {
        frequency: number;
        category: number;
        timeCommitment: number;
        priority: number;
        timing: number;
        sustainability: number;
    };
}

/**
 * Generate an AI-powered impact score for a habit (1-10)
 * Higher scores indicate greater potential positive impact on the user's life
 */
export async function generateHabitImpactScore(habitData: HabitImpactData): Promise<ImpactScoreResult> {
    try {
        const prompt = createImpactScorePrompt(habitData);

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: getImpactScoreSystemPrompt()
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3, // Lower temperature for more consistent scoring
            max_tokens: 800
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
            throw new Error('No response from OpenAI');
        }

        return parseImpactScoreResponse(response, habitData);

    } catch (error) {
        console.error('Error generating impact score:', error);

        // Return fallback score based on simple logic
        return getFallbackImpactScore(habitData);
    }
}

function getImpactScoreSystemPrompt(): string {
    return `You are an expert behavioral psychologist and habit formation specialist. Your task is to analyze habit data and provide an accurate impact score from 1-10 that reflects the potential positive impact this habit could have on someone's life.

SCORING CRITERIA (1-10 scale):
• 1-3: Low impact - Minor improvements, limited life change
• 4-6: Moderate impact - Noticeable benefits, moderate life improvement  
• 7-8: High impact - Significant positive changes, major life improvement
• 9-10: Transformational - Life-changing habits with profound long-term benefits

EVALUATION FACTORS:
1. FREQUENCY IMPACT (How often = more compound benefits)
   - Daily: Higher scores (consistent compound effect)
   - Weekdays: Moderate-high (regular routine)
   - Weekends: Lower (limited frequency)
   - Specific days: Moderate (depends on habit type)

2. CATEGORY IMPACT (Evidence-based life improvement potential)
   - Health: High (physical/mental wellbeing foundation)
   - Mindfulness: High (mental health, stress, focus)
   - Learning: Moderate-High (cognitive, career growth)
   - Productivity: Moderate (efficiency, achievement)
   - Digital Wellbeing: Moderate-High (modern life balance)

3. TIME COMMITMENT vs. SUSTAINABILITY
   - 2-15 minutes: Higher scores (very sustainable)
   - 15-30 minutes: High scores (sustainable for most)
   - 30-60 minutes: Moderate (requires commitment)
   - 60+ minutes: Lower (harder to maintain)

4. TIMING OPTIMIZATION
   - Morning: Higher scores (sets tone for day)
   - Throughout day: Moderate-High (integrated into life)
   - Afternoon/Evening: Moderate (depends on habit type)

5. PRIORITY ALIGNMENT
   - High priority: User recognizes importance
   - Medium priority: Balanced approach
   - Low priority: May lack commitment

6. HABIT QUALITY (Based on name and description)
   - Evidence-based practices: Higher scores
   - Foundational habits: Higher scores
   - Specific, actionable habits: Higher scores
   - Vague or weak habits: Lower scores

RESPONSE FORMAT:
Return a JSON object with this exact structure:
{
  "score": 7,
  "reasoning": "Brief explanation of the score",
  "factors": {
    "frequency": 8,
    "category": 7,
    "timeCommitment": 8,
    "priority": 7,
    "timing": 7,
    "sustainability": 8
  }
}

Be logical, evidence-based, and consistent in your scoring.`;
}

function createImpactScorePrompt(habitData: HabitImpactData): string {
    return `Analyze this habit and provide an impact score (1-10):

HABIT DETAILS:
• Name: "${habitData.name}"
• Description: "${habitData.description}"
• Category: ${habitData.category}
• Frequency: ${habitData.frequency}
• Time of Day: ${habitData.timeOfDay}
• Time to Complete: ${habitData.timeToComplete}
• Priority: ${habitData.priority}

Consider:
1. How this habit could compound over time
2. The scientific evidence for this type of habit
3. The sustainability of the time commitment
4. The optimal timing for maximum impact
5. How this fits into a balanced lifestyle
6. The potential for positive ripple effects

Provide a score that accurately reflects the real-world impact potential of this specific habit.`;
}

function parseImpactScoreResponse(response: string, habitData: HabitImpactData): ImpactScoreResult {
    try {
        // Clean the response to extract JSON
        let jsonStr = response.trim();

        // Remove markdown code blocks if present
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
        } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');
        }

        const parsed = JSON.parse(jsonStr);

        // Validate and constrain the score
        const score = Math.min(Math.max(Math.round(parsed.score || 5), 1), 10);

        return {
            score,
            reasoning: parsed.reasoning || 'AI-generated impact score based on habit analysis',
            factors: {
                frequency: Math.min(Math.max(Math.round(parsed.factors?.frequency || 5), 1), 10),
                category: Math.min(Math.max(Math.round(parsed.factors?.category || 5), 1), 10),
                timeCommitment: Math.min(Math.max(Math.round(parsed.factors?.timeCommitment || 5), 1), 10),
                priority: Math.min(Math.max(Math.round(parsed.factors?.priority || 5), 1), 10),
                timing: Math.min(Math.max(Math.round(parsed.factors?.timing || 5), 1), 10),
                sustainability: Math.min(Math.max(Math.round(parsed.factors?.sustainability || 5), 1), 10)
            }
        };

    } catch (error) {
        console.error('Error parsing impact score response:', error);
        return getFallbackImpactScore(habitData);
    }
}

/**
 * Fallback impact score calculation using logical rules
 * Used when AI service fails
 */
function getFallbackImpactScore(habitData: HabitImpactData): ImpactScoreResult {
    let score = 5; // Start with base score

    // Frequency impact (0-2 points)
    const frequencyBonus = {
        'Daily': 2,
        'Weekdays': 1.5,
        'Mon, Wed, Fri': 1,
        'Tue, Thu': 0.5,
        'Weekends': 0
    };
    score += frequencyBonus[habitData.frequency] || 0;

    // Category impact (0-2 points)
    const categoryBonus = {
        'Health': 2,
        'Mindfulness': 2,
        'Learning': 1.5,
        'Digital Wellbeing': 1.5,
        'Productivity': 1
    };
    score += categoryBonus[habitData.category] || 0;

    // Time commitment sustainability (-1 to +1 points)
    const timeToComplete = habitData.timeToComplete.toLowerCase();
    if (timeToComplete.includes('hour') || timeToComplete.includes('60')) {
        score -= 1; // Too time-consuming
    } else if (timeToComplete.includes('2 min') || timeToComplete.includes('5 min')) {
        score += 1; // Very sustainable
    } else if (timeToComplete.includes('10 min') || timeToComplete.includes('15 min')) {
        score += 0.5; // Sustainable
    }

    // Priority impact (0-1 points)
    const priorityBonus = {
        'High': 1,
        'Medium': 0.5,
        'Low': 0
    };
    score += priorityBonus[habitData.priority] || 0;

    // Timing impact (0-1 points)
    const timingBonus = {
        'Morning': 1,
        'Throughout day': 0.5,
        'Evening': 0.5,
        'Afternoon': 0
    };
    score += timingBonus[habitData.timeOfDay] || 0;

    // Constrain to 1-10 range
    const finalScore = Math.min(Math.max(Math.round(score), 1), 10);

    return {
        score: finalScore,
        reasoning: `Calculated based on frequency (${habitData.frequency}), category (${habitData.category}), time commitment (${habitData.timeToComplete}), and optimal timing (${habitData.timeOfDay}). This habit shows ${finalScore >= 7 ? 'high' : finalScore >= 5 ? 'moderate' : 'modest'} potential for positive life impact.`,
        factors: {
            frequency: Math.min(10, Math.max(1, Math.round(5 + (frequencyBonus[habitData.frequency] || 0) * 2))),
            category: Math.min(10, Math.max(1, Math.round(5 + (categoryBonus[habitData.category] || 0) * 2))),
            timeCommitment: Math.min(10, Math.max(1, Math.round(6 + (timeToComplete.includes('hour') ? -2 : timeToComplete.includes('2 min') ? 2 : 0)))),
            priority: Math.min(10, Math.max(1, Math.round(5 + (priorityBonus[habitData.priority] || 0) * 3))),
            timing: Math.min(10, Math.max(1, Math.round(5 + (timingBonus[habitData.timeOfDay] || 0) * 3))),
            sustainability: Math.min(10, Math.max(1, Math.round(7 + (timeToComplete.includes('hour') ? -3 : timeToComplete.includes('2 min') ? 2 : 0))))
        }
    };
}