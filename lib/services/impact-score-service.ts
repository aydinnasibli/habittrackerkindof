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
    confidence: 'High' | 'Medium' | 'Low';
    recommendations?: string[];
}

interface ScoringWeights {
    frequency: number;
    category: number;
    timeCommitment: number;
    priority: number;
    timing: number;
    sustainability: number;
}

// Optimized scoring weights based on habit formation research
const SCORING_WEIGHTS: ScoringWeights = {
    frequency: 0.25,      // Most important - consistency drives results
    category: 0.20,       // High impact - some categories have higher ROI
    sustainability: 0.20, // Critical - unsustainable habits fail
    timeCommitment: 0.15, // Important - time vs. impact ratio
    timing: 0.10,         // Moderate - optimal timing helps
    priority: 0.10        // Lower - user perception may be biased
};

/**
 * Generate an AI-powered impact score for a habit (1.0-10.0 with decimal precision)
 * Uses both AI analysis and deterministic fallback for reliability
 */
export async function generateHabitImpactScore(
    habitData: HabitImpactData,
    useAI: boolean = true
): Promise<ImpactScoreResult> {
    // Input validation
    if (!isValidHabitData(habitData)) {
        throw new Error('Invalid habit data provided');
    }

    // Always calculate deterministic score as baseline
    const deterministicResult = calculateDeterministicScore(habitData);

    if (!useAI || !process.env.OPENAI_API_KEY) {
        return deterministicResult;
    }

    try {
        const aiResult = await generateAIScore(habitData);

        // Validate AI result against deterministic score
        const scoreDifference = Math.abs(aiResult.score - deterministicResult.score);

        // If AI and deterministic scores are very different, use hybrid approach
        if (scoreDifference > 2.5) {
            return createHybridScore(aiResult, deterministicResult, habitData);
        }

        return {
            ...aiResult,
            confidence: getConfidenceLevel(aiResult, deterministicResult)
        };

    } catch (error) {
        console.error('AI scoring failed, using deterministic fallback:', error);
        return deterministicResult;
    }
}

function isValidHabitData(data: HabitImpactData): boolean {
    return !!(
        data.name?.trim() &&
        data.description?.trim() &&
        data.category &&
        data.frequency &&
        data.timeOfDay &&
        data.timeToComplete?.trim() &&
        data.priority
    );
}

async function generateAIScore(habitData: HabitImpactData): Promise<ImpactScoreResult> {
    const prompt = createImpactScorePrompt(habitData);

    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: getImprovedSystemPrompt()
            },
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0.1, // Even lower for more consistent decimal scoring
        max_tokens: 800,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
        throw new Error('Empty response from OpenAI');
    }

    return parseAIResponse(response, habitData);
}

function getImprovedSystemPrompt(): string {
    return `You are an expert in behavioral psychology and habit formation. Analyze habits and provide precise decimal impact scores (1.0-10.0) based on scientific evidence and practical sustainability.

CORE PRINCIPLES:
- Consistency beats intensity (frequency is key)
- Small sustainable habits compound over time
- Evidence-based practices score higher
- Time investment must be inversely related to difficulty/sustainability
- Consider realistic human behavior and limitations

DECIMAL SCORING SCALE:
1.0-2.9: Minimal impact (unclear benefit, very hard to maintain)
3.0-4.9: Low impact (limited benefit, challenging to maintain)
5.0-6.9: Moderate impact (decent benefit, achievable with effort)
7.0-8.4: High impact (significant benefit, sustainable)
8.5-10.0: Transformational (life-changing, highly sustainable)

EVALUATION CRITERIA WITH DECIMAL PRECISION:

1. FREQUENCY (25% weight) - Consistency drives exponential results
   - Daily: 8.5-9.5 (compound daily benefits, ideal consistency)
   - Weekdays: 6.8-7.8 (good routine, slight weekend gap)
   - Mon/Wed/Fri: 5.5-6.5 (decent consistency, some gaps)
   - Tue/Thu: 4.0-5.0 (limited frequency, hard to build momentum)
   - Weekends: 3.0-4.5 (very limited frequency)

2. CATEGORY EVIDENCE (20% weight) - Research-backed impact
   - Health: 8.0-9.2 (physical/mental foundation, proven ROI)
   - Mindfulness: 7.5-8.8 (stress reduction, focus, wellbeing)
   - Learning: 6.2-7.5 (cognitive growth, long-term benefits)
   - Digital Wellbeing: 6.5-8.0 (modern necessity, productivity gains)
   - Productivity: 5.0-6.8 (efficiency gains, varies by implementation)

3. TIME COMMITMENT vs SUSTAINABILITY (15% weight) - Inverse relationship crucial
   LOGICAL PRINCIPLE: More time = harder to sustain = lower score
   - 1-3 minutes: 8.5-9.5 (extremely sustainable, easy to maintain)
   - 4-8 minutes: 7.8-8.7 (very sustainable, good habit size)
   - 9-15 minutes: 6.5-7.5 (sustainable with commitment)
   - 16-25 minutes: 5.0-6.2 (requires significant commitment)
   - 26-40 minutes: 3.5-4.8 (hard to maintain consistently)
   - 41-60 minutes: 2.5-3.7 (very difficult to sustain)
   - 60+ minutes: 1.5-2.8 (unsustainable for most people)

4. SUSTAINABILITY MULTIPLIER (20% weight) - Can this realistically be maintained?
   Calculate based on: (Time difficulty × Frequency demand × Life integration)
   - Perfect storm (short time + daily): 9.0-9.8
   - Excellent (short time + frequent): 8.0-8.9
   - Good (moderate time + moderate freq): 6.5-7.8
   - Challenging (high time or high freq): 4.0-6.0
   - Unsustainable (high time + high freq): 2.0-3.8

5. TIMING OPTIMIZATION (10% weight)
   - Optimal for category + personal energy: 8.0-9.0
   - Good timing match: 6.5-7.5
   - Neutral timing: 5.0-6.0
   - Suboptimal timing: 3.5-4.8

6. USER PRIORITY ALIGNMENT (10% weight)
   - High priority + realistic expectations: 7.5-8.5
   - Medium priority + good understanding: 6.0-7.0
   - Low priority or unrealistic expectations: 4.0-5.5

CRITICAL LOGIC CHECKS:
- If time > 30 min and frequency = Daily, max score = 4.5
- If time > 60 min, max score = 3.5 regardless of other factors
- If frequency = Weekends only, max score = 5.5
- Sustainability should decrease exponentially with time commitment

RESPONSE FORMAT (JSON only):
{
  "score": 7.3,
  "reasoning": "Detailed explanation of decimal score with logical reasoning about time/sustainability relationship",
  "factors": {
    "frequency": 8.2,
    "category": 7.8,
    "timeCommitment": 6.5,
    "priority": 6.8,
    "timing": 7.1,
    "sustainability": 7.6
  }
}

BE PRECISE: Use decimals to reflect nuanced differences. Ensure time commitment scoring follows inverse logic - higher time = lower sustainability score.`;
}

function createImpactScorePrompt(habitData: HabitImpactData): string {
    return `Score this habit (1.0-10.0 with decimal precision):

HABIT: "${habitData.name}"
DESCRIPTION: "${habitData.description}"
CATEGORY: ${habitData.category}
FREQUENCY: ${habitData.frequency}
TIME OF DAY: ${habitData.timeOfDay}
TIME NEEDED: ${habitData.timeToComplete}
USER PRIORITY: ${habitData.priority}

CRITICAL ANALYSIS POINTS:
1. Extract exact minutes from "${habitData.timeToComplete}" - be precise
2. Apply inverse time logic: More minutes = Lower sustainability = Lower score
3. Consider frequency-time interaction: Daily + Long time = Unsustainable
4. Evaluate evidence base for "${habitData.category}" category
5. Assess realistic maintenance for average person

LOGICAL CONSTRAINTS:
- If time > 45 minutes: Maximum possible score = 4.0
- If time > 30 minutes AND frequency = Daily: Maximum score = 5.0
- If time ≤ 5 minutes AND frequency = Daily: Minimum score = 7.0
- Weekend-only habits: Maximum score = 5.5

Provide a precise decimal score that reflects the mathematical relationship between time investment and sustainable impact.`;
}

function parseAIResponse(response: string, habitData: HabitImpactData): ImpactScoreResult {
    try {
        let jsonStr = response.trim();

        // Clean markdown formatting
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/\n?```$/g, '').replace(/```/g, '');

        const parsed = JSON.parse(jsonStr);

        // Validate and constrain all scores with decimal precision
        const score = constrainScoreDecimal(parsed.score);
        const factors = {
            frequency: constrainScoreDecimal(parsed.factors?.frequency),
            category: constrainScoreDecimal(parsed.factors?.category),
            timeCommitment: constrainScoreDecimal(parsed.factors?.timeCommitment),
            priority: constrainScoreDecimal(parsed.factors?.priority),
            timing: constrainScoreDecimal(parsed.factors?.timing),
            sustainability: constrainScoreDecimal(parsed.factors?.sustainability)
        };

        return {
            score,
            reasoning: parsed.reasoning || 'AI-generated impact assessment',
            factors,
            confidence: 'High'
        };

    } catch (error) {
        console.error('Failed to parse AI response:', error, 'Response:', response);
        throw new Error('Invalid AI response format');
    }
}

function constrainScoreDecimal(score: any): number {
    const num = Number(score);
    if (isNaN(num)) return 5.0;
    // Round to 1 decimal place and constrain between 1.0 and 10.0
    return Math.min(Math.max(Math.round(num * 10) / 10, 1.0), 10.0);
}

/**
 * Calculate deterministic impact score using research-based weights with decimal precision
 * This is our reliable baseline that always works
 */
function calculateDeterministicScore(habitData: HabitImpactData): ImpactScoreResult {
    const factors = calculateFactorScores(habitData);

    // Calculate weighted average with decimal precision
    const weightedScore = Object.entries(SCORING_WEIGHTS).reduce((sum, [factor, weight]) => {
        return sum + (factors[factor as keyof ScoringWeights] * weight);
    }, 0);

    const finalScore = Math.min(Math.max(Math.round(weightedScore * 10) / 10, 1.0), 10.0);

    const reasoning = generateDeterministicReasoning(habitData, factors, finalScore);
    const recommendations = generateRecommendations(habitData, factors);

    return {
        score: finalScore,
        reasoning,
        factors,
        confidence: 'High',
        recommendations
    };
}

function calculateFactorScores(habitData: HabitImpactData): ScoringWeights {
    return {
        frequency: calculateFrequencyScore(habitData.frequency),
        category: calculateCategoryScore(habitData.category),
        timeCommitment: calculateTimeCommitmentScore(habitData.timeToComplete),
        priority: calculatePriorityScore(habitData.priority),
        timing: calculateTimingScore(habitData.timeOfDay, habitData.category),
        sustainability: calculateSustainabilityScore(habitData.timeToComplete, habitData.frequency)
    };
}

function calculateFrequencyScore(frequency: string): number {
    const scores = {
        'Daily': 9.2,
        'Weekdays': 7.3,
        'Mon, Wed, Fri': 6.1,
        'Tue, Thu': 4.7,
        'Weekends': 3.8
    };
    return scores[frequency as keyof typeof scores] || 5.0;
}

function calculateCategoryScore(category: string): number {
    // Based on research evidence for life impact - decimal precision
    const scores = {
        'Health': 8.6,           // Physical/mental foundation
        'Mindfulness': 8.1,      // Stress, focus, emotional regulation  
        'Digital Wellbeing': 7.2, // Modern necessity
        'Learning': 6.9,         // Cognitive growth
        'Productivity': 6.2      // Efficiency gains
    };
    return scores[category as keyof typeof scores] || 5.0;
}

function calculateTimeCommitmentScore(timeToComplete: string): number {
    const minutes = extractMinutesFromTimeString(timeToComplete);

    // Inverse relationship: More time = Lower score (sustainability decreases)
    // Using logarithmic decay for realistic modeling
    if (minutes <= 2) return 9.5;       // Extremely sustainable
    if (minutes <= 5) return 8.8;       // Very sustainable  
    if (minutes <= 10) return 7.6;      // Sustainable
    if (minutes <= 15) return 6.7;      // Good commitment level
    if (minutes <= 20) return 5.9;      // Moderate commitment
    if (minutes <= 30) return 4.8;      // High commitment required
    if (minutes <= 45) return 3.6;      // Very high commitment
    if (minutes <= 60) return 2.7;      // Difficult to maintain
    if (minutes <= 90) return 2.1;      // Very difficult
    return 1.5;                         // Unsustainable for most
}

function extractMinutesFromTimeString(timeStr: string): number {
    const lowerStr = timeStr.toLowerCase();

    // Handle hours first
    if (lowerStr.includes('hour')) {
        const hourMatch = lowerStr.match(/(\d+(?:\.\d+)?)\s*hours?/);
        if (hourMatch) {
            return parseFloat(hourMatch[1]) * 60;
        }
        return 60; // Default 1 hour
    }

    // Handle minutes
    const minMatch = lowerStr.match(/(\d+(?:\.\d+)?)\s*(?:min|minute)/);
    if (minMatch) {
        return parseFloat(minMatch[1]);
    }

    // Handle seconds (convert to minutes)
    const secMatch = lowerStr.match(/(\d+(?:\.\d+)?)\s*(?:sec|second)/);
    if (secMatch) {
        return parseFloat(secMatch[1]) / 60;
    }

    // Handle ranges (take average)
    const rangeMatch = lowerStr.match(/(\d+)\s*-\s*(\d+)/);
    if (rangeMatch) {
        return (parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2;
    }

    // Extract any number as fallback
    const numMatch = lowerStr.match(/(\d+)/);
    if (numMatch) {
        return parseInt(numMatch[1]);
    }

    return 15; // Default fallback
}

function calculatePriorityScore(priority: string): number {
    const scores = {
        'High': 7.8,
        'Medium': 6.2,
        'Low': 4.4
    };
    return scores[priority as keyof typeof scores] || 5.0;
}

function calculateTimingScore(timeOfDay: string, category: string): number {
    // Base timing scores with decimal precision
    const baseScores = {
        'Morning': 7.8,        // Generally best for consistency
        'Throughout day': 6.1, // Flexible but less routine
        'Afternoon': 5.4,      // Moderate energy period
        'Evening': 6.3         // Good for reflection/wind-down
    };

    let score = baseScores[timeOfDay as keyof typeof baseScores] || 5.0;

    // Category-specific timing bonuses (more nuanced)
    if (category === 'Health' && timeOfDay === 'Morning') score += 0.8;
    if (category === 'Mindfulness' && (timeOfDay === 'Morning' || timeOfDay === 'Evening')) score += 0.6;
    if (category === 'Learning' && timeOfDay === 'Morning') score += 0.7;
    if (category === 'Digital Wellbeing' && timeOfDay === 'Evening') score += 0.5;
    if (category === 'Productivity' && timeOfDay === 'Morning') score += 0.4;

    return Math.min(score, 10.0);
}

function calculateSustainabilityScore(timeToComplete: string, frequency: string): number {
    const minutes = extractMinutesFromTimeString(timeToComplete);
    const freqScore = calculateFrequencyScore(frequency);
    const timeScore = calculateTimeCommitmentScore(timeToComplete);

    // Advanced sustainability calculation considering interaction effects
    let sustainabilityMultiplier = 1.0;

    // Penalize high time + high frequency combinations exponentially
    if (frequency === 'Daily') {
        if (minutes > 60) sustainabilityMultiplier = 0.3;
        else if (minutes > 45) sustainabilityMultiplier = 0.4;
        else if (minutes > 30) sustainabilityMultiplier = 0.6;
        else if (minutes > 20) sustainabilityMultiplier = 0.8;
        else if (minutes > 15) sustainabilityMultiplier = 0.9;
    } else if (frequency === 'Weekdays') {
        if (minutes > 45) sustainabilityMultiplier = 0.7;
        else if (minutes > 30) sustainabilityMultiplier = 0.85;
    }

    // Reward highly sustainable combinations
    if (frequency === 'Daily' && minutes <= 5) sustainabilityMultiplier = 1.2;
    if (frequency === 'Daily' && minutes <= 10) sustainabilityMultiplier = 1.1;

    const baseScore = (timeScore * 0.6 + freqScore * 0.4) * sustainabilityMultiplier;
    return Math.min(Math.max(Math.round(baseScore * 10) / 10, 1.0), 10.0);
}

function generateDeterministicReasoning(
    habitData: HabitImpactData,
    factors: ScoringWeights,
    score: number
): string {
    const minutes = extractMinutesFromTimeString(habitData.timeToComplete);
    const impactLevel = score >= 8 ? 'high' : score >= 6.5 ? 'moderate-to-high' : score >= 5 ? 'moderate' : 'modest';

    const topFactors = Object.entries(factors)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2)
        .map(([factor]) => factor);

    const timeLogic = minutes <= 10 ?
        'short duration enhances sustainability' :
        minutes <= 30 ?
            'moderate time commitment requires dedication' :
            'extended duration may challenge consistency';

    return `This habit shows ${impactLevel} impact potential (${score}/10). Key strengths: ${topFactors.join(' and ')}. The ${habitData.frequency.toLowerCase()} frequency with ${minutes} minutes commitment shows ${timeLogic}. Sustainability score: ${factors.sustainability}/10 reflects the time-frequency interaction for ${habitData.category.toLowerCase()} habits.`;
}

function generateRecommendations(habitData: HabitImpactData, factors: ScoringWeights): string[] {
    const recommendations: string[] = [];
    const minutes = extractMinutesFromTimeString(habitData.timeToComplete);

    if (factors.frequency < 6.0) {
        recommendations.push("Consider increasing frequency for better compound benefits");
    }

    if (factors.sustainability < 6.0) {
        recommendations.push("Try reducing time commitment to improve long-term sustainability");
    }

    if (minutes > 30 && habitData.frequency === 'Daily') {
        recommendations.push("Daily habits over 30 minutes are hard to maintain - consider starting with 10-15 minutes");
    }

    if (factors.timing < 6.0) {
        recommendations.push("Experiment with different times of day to optimize consistency");
    }

    if (factors.timeCommitment < 5.0) {
        recommendations.push("Current time commitment might be too demanding - consider the 2-minute rule to start");
    }

    if (minutes > 60) {
        recommendations.push("Consider breaking this into smaller, more manageable sessions");
    }

    return recommendations;
}

function createHybridScore(
    aiResult: ImpactScoreResult,
    deterministicResult: ImpactScoreResult,
    habitData: HabitImpactData
): ImpactScoreResult {
    // Weighted blend: 65% deterministic (reliable), 35% AI (nuanced)
    const hybridScore = Math.round((deterministicResult.score * 0.65 + aiResult.score * 0.35) * 10) / 10;

    const blendFactors = (det: number, ai: number) =>
        Math.round((det * 0.65 + ai * 0.35) * 10) / 10;

    return {
        score: hybridScore,
        reasoning: `Hybrid analysis (${hybridScore}/10): ${deterministicResult.reasoning} AI refinements: ${aiResult.reasoning}`,
        factors: {
            frequency: blendFactors(deterministicResult.factors.frequency, aiResult.factors.frequency),
            category: blendFactors(deterministicResult.factors.category, aiResult.factors.category),
            timeCommitment: blendFactors(deterministicResult.factors.timeCommitment, aiResult.factors.timeCommitment),
            priority: blendFactors(deterministicResult.factors.priority, aiResult.factors.priority),
            timing: blendFactors(deterministicResult.factors.timing, aiResult.factors.timing),
            sustainability: blendFactors(deterministicResult.factors.sustainability, aiResult.factors.sustainability)
        },
        confidence: 'Medium',
        recommendations: deterministicResult.recommendations
    };
}

function getConfidenceLevel(
    aiResult: ImpactScoreResult,
    deterministicResult: ImpactScoreResult
): 'High' | 'Medium' | 'Low' {
    const scoreDiff = Math.abs(aiResult.score - deterministicResult.score);

    if (scoreDiff <= 0.8) return 'High';
    if (scoreDiff <= 1.5) return 'Medium';
    return 'Low';
}

// Utility function for batch processing
export async function batchCalculateImpactScores(
    habits: HabitImpactData[],
    useAI: boolean = false
): Promise<ImpactScoreResult[]> {
    const results = await Promise.allSettled(
        habits.map(habit => generateHabitImpactScore(habit, useAI))
    );

    return results.map((result, index) => {
        if (result.status === 'fulfilled') {
            return result.value;
        } else {
            console.error(`Failed to score habit ${index}:`, result.reason);
            return calculateDeterministicScore(habits[index]);
        }
    });
}

// Export for testing
export { calculateDeterministicScore, SCORING_WEIGHTS, extractMinutesFromTimeString };