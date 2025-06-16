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

    return openaiClient;
}

// Enhanced Types
export interface HabitPattern {
    type: 'success_pattern' | 'failure_pattern' | 'inconsistency_pattern' | 'correlation_pattern';
    title: string;
    description: string;
    confidence: number;
    timeframe: string;
    triggers: string[];
    affectedHabits: string[];
    recommendation: string;
}

export interface PersonalizedInsight {
    id: string;
    type: 'breakthrough' | 'warning' | 'optimization' | 'celebration' | 'prediction';
    title: string;
    description: string;
    actionPlan: ActionStep[];
    confidence: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
    impact: 'high' | 'medium' | 'low';
    timeframe: string;
    supportingData: {
        metrics: Record<string, number>;
        trends: string[];
        correlations: string[];
    };
    category: string;
}

export interface ActionStep {
    step: number;
    action: string;
    timeframe: string;
    difficulty: 'easy' | 'medium' | 'hard';
    expectedOutcome: string;
    successMetrics: string[];
}

export interface HabitPrediction {
    habitId: string;
    habitName: string;
    predictedSuccess: number; // 0-100%
    nextWeekSuccess: number;
    nextMonthSuccess: number;
    riskFactors: RiskFactor[];
    recommendations: SmartRecommendation[];
    optimalTiming: OptimalTiming;
    difficultyAdjustment: string;
    interventionNeeded: boolean;
}

export interface RiskFactor {
    factor: string;
    severity: 'high' | 'medium' | 'low';
    likelihood: number;
    mitigation: string;
}

export interface SmartRecommendation {
    type: 'timing' | 'frequency' | 'environment' | 'motivation' | 'social';
    title: string;
    description: string;
    implementation: string;
    expectedImprovement: number;
}

export interface OptimalTiming {
    bestTimeOfDay: string;
    bestDaysOfWeek: string[];
    avoidTimes: string[];
    reasoning: string;
}

export interface CoachingPlan {
    readinessScore: number;
    currentFocus: string;
    nextMilestone: string;
    weeklyGoals: WeeklyGoal[];
    monthlyObjectives: string[];
    personalizedStrategies: Strategy[];
    motivationalProfile: MotivationalProfile;
    progressTracking: ProgressMetric[];
}

export interface WeeklyGoal {
    week: number;
    objective: string;
    specificActions: string[];
    successCriteria: string[];
    difficultyLevel: number;
}

export interface Strategy {
    name: string;
    description: string;
    implementation: string;
    evidence: string;
    personalizedReason: string;
}

export interface MotivationalProfile {
    primaryDriver: string;
    secondaryDrivers: string[];
    demotivators: string[];
    optimalChallengeLevel: number;
    preferredRewards: string[];
    communicationStyle: string;
}

export interface ProgressMetric {
    metric: string;
    currentValue: number;
    target: number;
    timeline: string;
    trackingMethod: string;
}

export interface ComprehensiveAnalysis {
    patterns: HabitPattern[];
    insights: PersonalizedInsight[];
    predictions: HabitPrediction[];
    coachingPlan: CoachingPlan;
    behavioralProfile: BehavioralProfile;
    riskAssessment: RiskAssessment;
}

export interface BehavioralProfile {
    personalityType: string;
    habitsPersonality: string;
    strengths: string[];
    challenges: string[];
    optimalSchedule: OptimalSchedule;
    environmentalFactors: string[];
}

export interface OptimalSchedule {
    morningCapacity: number;
    afternoonCapacity: number;
    eveningCapacity: number;
    bestHabitSequence: string[];
    energyPattern: string;
}

export interface RiskAssessment {
    overallRisk: 'low' | 'medium' | 'high';
    burnoutRisk: number;
    abandonmentRisk: number;
    plateauRisk: number;
    interventions: Intervention[];
}

export interface Intervention {
    trigger: string;
    action: string;
    timing: string;
    priority: number;
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

export class AdvancedHabitAI {
    private openai: OpenAI | null;

    constructor() {
        this.openai = getOpenAIClient();
    }

    async generateComprehensiveAnalysis(
        habits: IHabit[],
        profile: IProfile
    ): Promise<ComprehensiveAnalysis> {
        if (!this.openai) {
            return this.generateFallbackAnalysis(habits, profile);
        }

        try {
            // Extract deep behavioral data
            const behavioralData = this.extractBehavioralData(habits, profile);

            // Generate AI analysis
            const analysis = await this.runAIAnalysis(behavioralData, habits, profile);

            return analysis;
        } catch (error) {
            console.error('Error in AI analysis:', error);
            return this.generateFallbackAnalysis(habits, profile);
        }
    }

    private extractBehavioralData(habits: IHabit[], profile: IProfile) {
        const timezone = profile.timezone || 'UTC';
        const last30Days = getLastNDays(30, timezone);
        const last7Days = getLastNDays(7, timezone);

        return {
            // Basic metrics
            totalHabits: habits.length,
            activeHabits: habits.filter(h => h.status === 'active').length,

            // Completion patterns by day of week
            dayOfWeekPatterns: this.analyzeDayPatterns(habits, timezone),

            // Time-based patterns
            timePatterns: this.analyzeTimePatterns(habits),

            // Streak patterns and failure points
            streakAnalysis: this.analyzeStreakPatterns(habits),

            // Category performance
            categoryPerformance: this.analyzeCategoryPerformance(habits, timezone),

            // Habit lifecycle analysis
            lifecycleAnalysis: this.analyzeHabitLifecycle(habits),

            // Correlation between habits
            habitCorrelations: this.findHabitCorrelations(habits, timezone),

            // Behavior trends
            behaviorTrends: this.identifyBehaviorTrends(habits, last30Days, timezone),

            // Performance windows
            performanceWindows: this.findOptimalPerformanceWindows(habits, timezone),

            // Consistency metrics
            consistencyMetrics: this.calculateConsistencyMetrics(habits, timezone),

            // Risk indicators
            riskIndicators: this.identifyRiskIndicators(habits, timezone),

            // User preferences derived from data
            derivedPreferences: this.deriveUserPreferences(habits, profile),
        };
    }

    private async runAIAnalysis(
        behavioralData: any,
        habits: IHabit[],
        profile: IProfile
    ): Promise<ComprehensiveAnalysis> {
        const prompt = this.createAdvancedAnalysisPrompt(behavioralData, habits, profile);

        const completion = await this.openai!.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                {
                    role: "system",
                    content: `You are Dr. Sarah Chen, a world-renowned behavioral psychologist and habit formation expert with 20+ years of experience helping people build lasting habits.

Your expertise combines:
- Behavioral Psychology (Fogg Behavior Model, Habit Loop Theory, Implementation Intentions)
- Data Science (Pattern Recognition, Predictive Modeling, Statistical Analysis)
- Personalized Coaching (Individual Difference Theory, Motivation Science)
- Neuroscience (Neural Plasticity, Reward Systems, Executive Function)

ANALYSIS METHODOLOGY:
1. Identify deep behavioral patterns beyond surface metrics
2. Apply psychological theories to explain user behavior
3. Predict future challenges using data patterns
4. Create personalized interventions based on individual psychology
5. Provide evidence-based recommendations with clear rationale

CRITICAL REQUIREMENTS:
- All insights must be actionable and specific
- Predictions must include confidence levels and timeframes  
- Recommendations must be personalized to the user's patterns
- Action plans must be broken into manageable steps
- Risk assessments must be accurate and helpful

RESPONSE FORMAT: Return ONLY valid JSON matching the ComprehensiveAnalysis interface.
Focus on providing genuine value that will help the user improve their habit consistency and achieve their goals.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.2,
            max_tokens: 4000
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
            throw new Error('No AI response received');
        }

        try {
            return JSON.parse(response);
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            return this.generateFallbackAnalysis(habits, profile);
        }
    }

    private createAdvancedAnalysisPrompt(
        behavioralData: any,
        habits: IHabit[],
        profile: IProfile
    ): string {
        const recentPerformance = habits.map(h => ({
            name: h.name,
            category: h.category,
            streak: h.streak,
            recentRate: this.calculateRecentCompletionRate(h, profile.timezone)
        }));

        return `
COMPREHENSIVE HABIT ANALYSIS FOR ${profile.firstName || 'User'}

USER PROFILE:
- Name: ${profile.firstName} ${profile.lastName}
- Experience Level: ${this.getUserExperienceLevel(habits)}
- Total XP: ${profile.xp?.total || 0}
- Current Rank: ${profile.rank?.title || 'Novice'}
- Daily Target: ${profile.goals?.dailyHabitTarget || 3} habits
- Timezone: ${profile.timezone}

BEHAVIORAL DATA DEEP DIVE:
${JSON.stringify(behavioralData, null, 2)}

HABIT PERFORMANCE MATRIX:
${recentPerformance.map(h => `
- ${h.name} (${h.category}):
  * Current Streak: ${h.streak} days
  * Recent Performance: ${h.recentRate}%
  * Status: ${h.recentRate > 80 ? 'Excellent' : h.recentRate > 60 ? 'Good' : h.recentRate > 40 ? 'Struggling' : 'At Risk'}
`).join('')}

KEY PATTERNS IDENTIFIED:
- Strongest Performance Day: ${behavioralData.dayOfWeekPatterns.reduce((best: any, day: any) => day.completionRate > best.completionRate ? day : best, { day: 'None', completionRate: 0 }).day}
- Optimal Time Slot: ${behavioralData.performanceWindows.bestTime}
- Most Consistent Category: ${behavioralData.categoryPerformance.reduce((best: any, cat: any) => cat.consistency > best.consistency ? cat : best, { name: 'None' }).name}
- Primary Risk Factor: ${behavioralData.riskIndicators.primary}

ANALYSIS REQUESTS:

1. BEHAVIORAL PATTERN ANALYSIS:
   - What hidden patterns explain success vs failure?
   - Which environmental/temporal factors drive performance?
   - Are there habit combinations that work synergistically?
   - What does the streak data reveal about persistence patterns?

2. PREDICTIVE MODELING:
   - Which habits have highest abandonment risk in next 2-4 weeks?
   - What specific triggers might cause setbacks?
   - When is user most vulnerable to breaking streaks?
   - What growth opportunities exist based on current trajectory?

3. PERSONALIZED INTERVENTION DESIGN:
   - What behavioral modifications would yield biggest improvements?
   - How should habits be sequenced/timed for optimal success?
   - What environmental changes would support consistency?
   - Which psychological levers work best for this user?

4. COACHING STRATEGY:
   - What's the user's optimal challenge progression?
   - How should setbacks be handled based on their patterns?
   - What motivation strategies align with their behavioral profile?
   - What are the key milestones for the next 30-90 days?

Provide specific, evidence-based insights that will genuinely help this user succeed.
`;
    }

    // Behavioral Analysis Helper Methods
    private analyzeDayPatterns(habits: IHabit[], timezone: string) {
        const dayData = new Array(7).fill(0).map(() => ({ completed: 0, total: 0 }));
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        habits.forEach(habit => {
            habit.completions?.forEach(completion => {
                const date = new Date(completion.date);
                const dayOfWeek = date.getDay();
                dayData[dayOfWeek].total++;
                if (completion.completed) {
                    dayData[dayOfWeek].completed++;
                }
            });
        });

        return dayData.map((data, index) => ({
            day: dayNames[index],
            completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
            totalAttempts: data.total,
            isWeekend: index === 0 || index === 6
        }));
    }

    private analyzeTimePatterns(habits: IHabit[]) {
        const timeslots = ['Morning', 'Afternoon', 'Evening', 'Throughout day'];
        return timeslots.map(slot => ({
            timeSlot: slot,
            habitCount: habits.filter(h => h.timeOfDay === slot).length,
            avgCompletionRate: this.calculateAvgCompletionRateForTimeSlot(habits, slot),
            avgStreak: this.calculateAvgStreakForTimeSlot(habits, slot)
        }));
    }

    private analyzeStreakPatterns(habits: IHabit[]) {
        return habits.map(habit => {
            const streaks = this.calculateAllStreaks(habit);
            const failurePoints = this.identifyFailurePoints(habit);

            return {
                habitName: habit.name,
                currentStreak: habit.streak,
                longestStreak: Math.max(...streaks, 0),
                averageStreak: streaks.length > 0 ? Math.round(streaks.reduce((a, b) => a + b, 0) / streaks.length) : 0,
                streakConsistency: this.calculateStreakConsistency(streaks),
                failurePoints,
                recoveryRate: this.calculateRecoveryRate(habit),
                streakTrend: this.calculateStreakTrend(streaks)
            };
        });
    }

    private analyzeCategoryPerformance(habits: IHabit[], timezone: string) {
        const categories = ['Mindfulness', 'Health', 'Learning', 'Productivity', 'Digital Wellbeing'];

        return categories.map(category => {
            const categoryHabits = habits.filter(h => h.category === category);
            if (categoryHabits.length === 0) {
                return {
                    name: category,
                    habitCount: 0,
                    avgCompletionRate: 0,
                    avgStreak: 0,
                    consistency: 0,
                    trend: 'stable' as const
                };
            }

            const completionRates = categoryHabits.map(h => this.calculateRecentCompletionRate(h, timezone));
            const avgCompletionRate = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;
            const avgStreak = categoryHabits.reduce((sum, h) => sum + h.streak, 0) / categoryHabits.length;

            return {
                name: category,
                habitCount: categoryHabits.length,
                avgCompletionRate: Math.round(avgCompletionRate),
                avgStreak: Math.round(avgStreak),
                consistency: this.calculateCategoryConsistency(categoryHabits),
                trend: this.calculateCategoryTrend(categoryHabits, timezone)
            };
        });
    }

    private analyzeHabitLifecycle(habits: IHabit[]) {
        const now = new Date();

        return habits.map(habit => {
            const ageInDays = Math.floor((now.getTime() - new Date(habit.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            const phase = this.determineHabitPhase(ageInDays, habit.streak);

            return {
                habitName: habit.name,
                ageInDays,
                phase,
                stabilityScore: this.calculateStabilityScore(habit),
                momentumScore: this.calculateMomentumScore(habit),
                riskLevel: this.assessHabitRisk(habit, ageInDays)
            };
        });
    }

    private findHabitCorrelations(habits: IHabit[], timezone: string) {
        const correlations = [];
        const last30Days = getLastNDays(30, timezone);

        for (let i = 0; i < habits.length; i++) {
            for (let j = i + 1; j < habits.length; j++) {
                const correlation = this.calculateHabitCorrelation(habits[i], habits[j], last30Days, timezone);
                if (Math.abs(correlation.strength) > 0.3) {
                    correlations.push(correlation);
                }
            }
        }

        return correlations.sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength));
    }

    private identifyBehaviorTrends(habits: IHabit[], days: string[], timezone: string) {
        const weeklyPerformance = [];

        for (let i = 0; i < days.length; i += 7) {
            const weekDays = days.slice(i, i + 7);
            const weekPerformance = this.calculateWeekPerformance(habits, weekDays, timezone);
            weeklyPerformance.push(weekPerformance);
        }

        return {
            overallTrend: this.calculateOverallTrend(weeklyPerformance),
            improvementRate: this.calculateImprovementRate(weeklyPerformance),
            volatility: this.calculateVolatility(weeklyPerformance),
            seasonalPatterns: this.identifySeasonalPatterns(weeklyPerformance)
        };
    }

    private findOptimalPerformanceWindows(habits: IHabit[], timezone: string) {
        const timeSlotPerformance = this.analyzeTimePatterns(habits);
        const dayPerformance = this.analyzeDayPatterns(habits, timezone);

        const bestTime = timeSlotPerformance.reduce((best, current) =>
            current.avgCompletionRate > best.avgCompletionRate ? current : best
        );

        const bestDays = dayPerformance
            .filter(day => day.completionRate > 70)
            .map(day => day.day);

        return {
            bestTime: bestTime.timeSlot,
            bestDays,
            worstTime: timeSlotPerformance.reduce((worst, current) =>
                current.avgCompletionRate < worst.avgCompletionRate ? current : worst
            ).timeSlot,
            optimalSchedule: this.generateOptimalSchedule(timeSlotPerformance, dayPerformance)
        };
    }

    private calculateConsistencyMetrics(habits: IHabit[], timezone: string) {
        const last30Days = getLastNDays(30, timezone);

        return habits.map(habit => {
            const completions = this.getCompletionsForDays(habit, last30Days, timezone);
            const consistency = this.calculateHabitConsistency(completions);
            const predictability = this.calculatePredictability(completions);

            return {
                habitName: habit.name,
                consistency,
                predictability,
                reliability: (consistency + predictability) / 2,
                variability: this.calculateVariability(completions)
            };
        });
    }

    private identifyRiskIndicators(habits: IHabit[], timezone: string) {
        const indicators = {
            primary: 'None',
            secondary: [],
            burnoutRisk: 0,
            abandonmentRisk: 0,
            plateauRisk: 0
        };

        // Analyze patterns for risk indicators
        const recentDeclines = habits.filter(h => this.hasRecentDecline(h, timezone));
        const longPlateaus = habits.filter(h => this.hasLongPlateau(h));
        const overcommitted = this.checkOvercommitment(habits);

        if (recentDeclines.length > habits.length * 0.5) {
            indicators.primary = 'Performance Decline';
            indicators.abandonmentRisk = 70;
        } else if (overcommitted) {
            indicators.primary = 'Overcommitment';
            indicators.burnoutRisk = 80;
        } else if (longPlateaus.length > habits.length * 0.3) {
            indicators.primary = 'Lack of Progress';
            indicators.plateauRisk = 60;
        }

        return indicators;
    }

    private deriveUserPreferences(habits: IHabit[], profile: IProfile) {
        const timePreference = this.getMostPreferredTime(habits);
        const categoryPreference = this.getMostPreferredCategory(habits);
        const difficultyPreference = this.getPreferredDifficulty(habits);

        return {
            timePreference,
            categoryPreference,
            difficultyPreference,
            frequencyPreference: this.getPreferredFrequency(habits),
            durationPreference: this.getPreferredDuration(habits),
            motivationStyle: this.inferMotivationStyle(habits, profile)
        };
    }

    // Helper method implementations
    private calculateRecentCompletionRate(habit: IHabit, timezone: string): number {
        const last7Days = getLastNDays(7, timezone);
        const completions = habit.completions || [];

        let completed = 0;
        let total = 0;

        last7Days.forEach(day => {
            const completion = completions.find(c =>
                getDateString(new Date(c.date), timezone) === day
            );
            if (completion) {
                total++;
                if (completion.completed) completed++;
            }
        });

        return total > 0 ? Math.round((completed / total) * 100) : 0;
    }

    private getUserExperienceLevel(habits: IHabit[]): string {
        const totalHabits = habits.length;
        const avgStreak = habits.length > 0 ?
            habits.reduce((sum, h) => sum + h.streak, 0) / habits.length : 0;

        if (totalHabits >= 10 && avgStreak >= 30) return 'Expert';
        if (totalHabits >= 5 && avgStreak >= 14) return 'Intermediate';
        if (totalHabits >= 3 && avgStreak >= 7) return 'Beginner';
        return 'Novice';
    }

    private calculateAvgCompletionRateForTimeSlot(habits: IHabit[], timeSlot: string): number {
        const timeSlotHabits = habits.filter(h => h.timeOfDay === timeSlot);
        if (timeSlotHabits.length === 0) return 0;

        const rates = timeSlotHabits.map(h => {
            const completions = h.completions || [];
            if (completions.length === 0) return 0;
            const completed = completions.filter(c => c.completed).length;
            return (completed / completions.length) * 100;
        });

        return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
    }

    private calculateAvgStreakForTimeSlot(habits: IHabit[], timeSlot: string): number {
        const timeSlotHabits = habits.filter(h => h.timeOfDay === timeSlot);
        if (timeSlotHabits.length === 0) return 0;

        const avgStreak = timeSlotHabits.reduce((sum, h) => sum + h.streak, 0) / timeSlotHabits.length;
        return Math.round(avgStreak);
    }

    private calculateAllStreaks(habit: IHabit): number[] {
        // Implementation for calculating all historical streaks
        const completions = habit.completions || [];
        const streaks = [];
        let currentStreak = 0;

        completions.forEach(completion => {
            if (completion.completed) {
                currentStreak++;
            } else {
                if (currentStreak > 0) {
                    streaks.push(currentStreak);
                    currentStreak = 0;
                }
            }
        });

        if (currentStreak > 0) {
            streaks.push(currentStreak);
        }

        return streaks;
    }

    private calculateStreakConsistency(streaks: number[]): number {
        if (streaks.length <= 1) return streaks.length > 0 ? 100 : 0;

        const mean = streaks.reduce((a, b) => a + b, 0) / streaks.length;
        const variance = streaks.reduce((sum, streak) => sum + Math.pow(streak - mean, 2), 0) / streaks.length;
        const standardDeviation = Math.sqrt(variance);

        // Lower standard deviation relative to mean indicates higher consistency
        const coefficientOfVariation = mean > 0 ? (standardDeviation / mean) : 1;
        return Math.max(0, Math.round((1 - coefficientOfVariation) * 100));
    }

    private identifyFailurePoints(habit: IHabit): string[] {
        // Analyze when streaks typically break
        const completions = habit.completions || [];
        const failurePoints = [];

        // Look for patterns in streak breaks
        let streakLength = 0;
        completions.forEach((completion, index) => {
            if (completion.completed) {
                streakLength++;
            } else {
                if (streakLength > 0) {
                    const dayOfWeek = new Date(completion.date).toLocaleDateString('en-US', { weekday: 'long' });
                    failurePoints.push(`After ${streakLength} days (${dayOfWeek})`);
                    streakLength = 0;
                }
            }
        });

        return failurePoints.slice(0, 3); // Return top 3 failure patterns
    }

    private calculateRecoveryRate(habit: IHabit): number {
        const completions = habit.completions || [];
        let failures = 0;
        let recoveries = 0;

        for (let i = 0; i < completions.length - 1; i++) {
            if (!completions[i].completed) {
                failures++;
                if (completions[i + 1].completed) {
                    recoveries++;
                }
            }
        }

        return failures > 0 ? Math.round((recoveries / failures) * 100) : 100;
    }

    private calculateStreakTrend(streaks: number[]): 'improving' | 'declining' | 'stable' {
        if (streaks.length < 3) return 'stable';

        const recent = streaks.slice(-3);
        const earlier = streaks.slice(-6, -3);

        if (earlier.length === 0) return 'stable';

        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

        if (recentAvg > earlierAvg * 1.2) return 'improving';
        if (recentAvg < earlierAvg * 0.8) return 'declining';
        return 'stable';
    }

    private calculateCategoryConsistency(habits: IHabit[]): number {
        if (habits.length === 0) return 0;

        const consistencyScores = habits.map(habit => {
            const completions = habit.completions || [];
            if (completions.length === 0) return 0;

            const completionRate = completions.filter(c => c.completed).length / completions.length;
            return completionRate * 100;
        });

        return Math.round(consistencyScores.reduce((a, b) => a + b, 0) / consistencyScores.length);
    }

    private calculateCategoryTrend(habits: IHabit[], timezone: string): 'improving' | 'declining' | 'stable' {
        const last14Days = getLastNDays(14, timezone);
        const first7Days = last14Days.slice(0, 7);
        const second7Days = last14Days.slice(7, 14);

        const firstWeekRate = this.calculateWeekPerformanceForHabits(habits, first7Days, timezone);
        const secondWeekRate = this.calculateWeekPerformanceForHabits(habits, second7Days, timezone);

        if (secondWeekRate > firstWeekRate * 1.1) return 'improving';
        if (secondWeekRate < firstWeekRate * 0.9) return 'declining';
        return 'stable';
    }

    private determineHabitPhase(ageInDays: number, streak: number): string {
        if (ageInDays < 7) return 'Formation';
        if (ageInDays < 21) return 'Establishment';
        if (ageInDays < 66) return 'Integration';
        if (streak > 30) return 'Mastery';
        return 'Maintenance';
    }

    private calculateStabilityScore(habit: IHabit): number {
        const completions = habit.completions || [];
        if (completions.length < 7) return 50;

        const last7 = completions.slice(-7);
        const completionRate = last7.filter(c => c.completed).length / 7;
        const variability = this.calculateVariability(last7.map(c => c.completed ? 1 : 0));

        return Math.round((completionRate * 70 + (1 - variability) * 30) * 100);
    }

    private calculateMomentumScore(habit: IHabit): number {
        const recentStreak = habit.streak;
        const allStreaks = this.calculateAllStreaks(habit);
        const maxStreak = Math.max(...allStreaks, 0);

        if (maxStreak === 0) return 0;

        const momentumFromStreak = (recentStreak / maxStreak) * 60;
        const momentumFromTrend = this.calculateStreakTrend(allStreaks) === 'improving' ? 40 :
            this.calculateStreakTrend(allStreaks) === 'declining' ? -20 : 20;

        return Math.max(0, Math.min(100, Math.round(momentumFromStreak + momentumFromTrend)));
    }

    private assessHabitRisk(habit: IHabit, ageInDays: number): 'low' | 'medium' | 'high' {
        const stability = this.calculateStabilityScore(habit);
        const momentum = this.calculateMomentumScore(habit);

        if (stability < 40 || momentum < 30) return 'high';
        if (stability < 60 || momentum < 50) return 'medium';
        return 'low';
    }

    private calculateHabitCorrelation(habit1: IHabit, habit2: IHabit, days: string[], timezone: string) {
        const completions1 = this.getCompletionsForDays(habit1, days, timezone);
        const completions2 = this.getCompletionsForDays(habit2, days, timezone);

        const correlation = this.pearsonCorrelation(completions1, completions2);

        return {
            habit1: habit1.name,
            habit2: habit2.name,
            strength: correlation,
            type: correlation > 0 ? 'positive' : 'negative',
            significance: Math.abs(correlation) > 0.5 ? 'strong' : Math.abs(correlation) > 0.3 ? 'moderate' : 'weak'
        };
    }

    private calculateWeekPerformance(habits: IHabit[], weekDays: string[], timezone: string): number {
        let totalCompleted = 0;
        let totalPossible = 0;

        habits.forEach(habit => {
            weekDays.forEach(day => {
                const completion = habit.completions?.find(c =>
                    getDateString(new Date(c.date), timezone) === day
                );
                if (completion) {
                    totalPossible++;
                    if (completion.completed) totalCompleted++;
                }
            });
        });

        return totalPossible > 0 ? (totalCompleted / totalPossible) * 100 : 0;
    }

    private calculateWeekPerformanceForHabits(habits: IHabit[], days: string[], timezone: string): number {
        return this.calculateWeekPerformance(habits, days, timezone);
    }

    private calculateOverallTrend(weeklyPerformance: number[]): 'improving' | 'declining' | 'stable' {
        if (weeklyPerformance.length < 2) return 'stable';

        const firstHalf = weeklyPerformance.slice(0, Math.floor(weeklyPerformance.length / 2));
        const secondHalf = weeklyPerformance.slice(Math.floor(weeklyPerformance.length / 2));

        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        if (secondAvg > firstAvg * 1.1) return 'improving';
        if (secondAvg < firstAvg * 0.9) return 'declining';
        return 'stable';
    }

    private calculateImprovementRate(weeklyPerformance: number[]): number {
        if (weeklyPerformance.length < 2) return 0;

        const first = weeklyPerformance[0];
        const last = weeklyPerformance[weeklyPerformance.length - 1];

        return first > 0 ? Math.round(((last - first) / first) * 100) : 0;
    }

    private calculateVolatility(weeklyPerformance: number[]): number {
        if (weeklyPerformance.length < 2) return 0;

        const mean = weeklyPerformance.reduce((a, b) => a + b, 0) / weeklyPerformance.length;
        const variance = weeklyPerformance.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / weeklyPerformance.length;

        return Math.round(Math.sqrt(variance));
    }

    private identifySeasonalPatterns(weeklyPerformance: number[]): string[] {
        // Simple seasonal pattern detection
        const patterns = [];

        if (weeklyPerformance.length >= 4) {
            const quarters = this.groupIntoQuarters(weeklyPerformance);
            const bestQuarter = quarters.indexOf(Math.max(...quarters));
            const worstQuarter = quarters.indexOf(Math.min(...quarters));

            const quarterNames = ['Early Period', 'Growth Period', 'Peak Period', 'Maintenance Period'];
            patterns.push(`Peak performance in ${quarterNames[bestQuarter]}`);
            patterns.push(`Lower performance in ${quarterNames[worstQuarter]}`);
        }

        return patterns;
    }

    private generateOptimalSchedule(timeSlotPerformance: any[], dayPerformance: any[]) {
        const bestTimeSlots = timeSlotPerformance
            .filter(slot => slot.avgCompletionRate > 70)
            .sort((a, b) => b.avgCompletionRate - a.avgCompletionRate)
            .slice(0, 2);

        const bestDays = dayPerformance
            .filter(day => day.completionRate > 70)
            .map(day => day.day);

        return {
            recommendedTimeSlots: bestTimeSlots.map(slot => slot.timeSlot),
            recommendedDays: bestDays,
            avoidTimeSlots: timeSlotPerformance
                .filter(slot => slot.avgCompletionRate < 50)
                .map(slot => slot.timeSlot)
        };
    }

    private calculateHabitConsistency(completions: number[]): number {
        if (completions.length === 0) return 0;

        const completionRate = completions.reduce((a, b) => a + b, 0) / completions.length;
        const variability = this.calculateVariability(completions);

        return Math.round((completionRate * 70 + (1 - variability) * 30) * 100);
    }

    private calculatePredictability(completions: number[]): number {
        if (completions.length < 7) return 50;

        // Calculate how predictable the pattern is
        const patterns = this.findWeeklyPatterns(completions);
        return patterns.consistency;
    }

    private calculateVariability(values: number[]): number {
        if (values.length === 0) return 1;

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

        return mean > 0 ? Math.sqrt(variance) / mean : 1;
    }

    private hasRecentDecline(habit: IHabit, timezone: string): boolean {
        const last14Days = getLastNDays(14, timezone);
        const first7 = last14Days.slice(0, 7);
        const second7 = last14Days.slice(7, 14);

        const firstWeekRate = this.calculateCompletionRateForDays(habit, first7, timezone);
        const secondWeekRate = this.calculateCompletionRateForDays(habit, second7, timezone);

        return secondWeekRate < firstWeekRate * 0.7;
    }

    private hasLongPlateau(habit: IHabit): boolean {
        const streaks = this.calculateAllStreaks(habit);
        if (streaks.length < 3) return false;

        const lastThreeStreaks = streaks.slice(-3);
        const variance = this.calculateVariability(lastThreeStreaks);

        return variance < 0.1 && habit.streak < 7; // Low variance but low streak indicates plateau
    }

    private checkOvercommitment(habits: IHabit[]): boolean {
        const activeHabits = habits.filter(h => h.status === 'active');
        const totalDailyTime = activeHabits.reduce((total, habit) => {
            const timeMatch = habit.timeToComplete.match(/(\d+)/);
            const minutes = timeMatch ? parseInt(timeMatch[1]) : 15;
            return total + minutes;
        }, 0);

        return activeHabits.length > 10 || totalDailyTime > 180; // More than 10 habits or 3 hours daily
    }

    private getMostPreferredTime(habits: IHabit[]): string {
        const timeCounts = habits.reduce((counts, habit) => {
            counts[habit.timeOfDay] = (counts[habit.timeOfDay] || 0) + 1;
            return counts;
        }, {} as Record<string, number>);

        return Object.entries(timeCounts).reduce((a, b) => timeCounts[a[0]] > timeCounts[b[0]] ? a : b)[0] || 'Morning';
    }

    private getMostPreferredCategory(habits: IHabit[]): string {
        const categoryCounts = habits.reduce((counts, habit) => {
            counts[habit.category] = (counts[habit.category] || 0) + 1;
            return counts;
        }, {} as Record<string, number>);

        return Object.entries(categoryCounts).reduce((a, b) => categoryCounts[a[0]] > categoryCounts[b[0]] ? a : b)[0] || 'Health';
    }

    private getPreferredDifficulty(habits: IHabit[]): string {
        const priorityCounts = habits.reduce((counts, habit) => {
            counts[habit.priority] = (counts[habit.priority] || 0) + 1;
            return counts;
        }, {} as Record<string, number>);

        return Object.entries(priorityCounts).reduce((a, b) => priorityCounts[a[0]] > priorityCounts[b[0]] ? a : b)[0] || 'Medium';
    }

    private getPreferredFrequency(habits: IHabit[]): string {
        const frequencyCounts = habits.reduce((counts, habit) => {
            counts[habit.frequency] = (counts[habit.frequency] || 0) + 1;
            return counts;
        }, {} as Record<string, number>);

        return Object.entries(frequencyCounts).reduce((a, b) => frequencyCounts[a[0]] > frequencyCounts[b[0]] ? a : b)[0] || 'Daily';
    }

    private getPreferredDuration(habits: IHabit[]): string {
        const durations = habits.map(h => h.timeToComplete);
        const durationCounts = durations.reduce((counts, duration) => {
            counts[duration] = (counts[duration] || 0) + 1;
            return counts;
        }, {} as Record<string, number>);

        return Object.entries(durationCounts).reduce((a, b) => durationCounts[a[0]] > durationCounts[b[0]] ? a : b)[0] || '15 minutes';
    }

    private inferMotivationStyle(habits: IHabit[], profile: IProfile): string {
        const avgStreak = habits.length > 0 ? habits.reduce((sum, h) => sum + h.streak, 0) / habits.length : 0;
        const totalXP = profile.xp?.total || 0;

        if (avgStreak > 30 && totalXP > 1000) return 'Achievement-oriented';
        if (habits.filter(h => h.category === 'Mindfulness').length > habits.length * 0.3) return 'Wellness-focused';
        if (habits.filter(h => h.category === 'Productivity').length > habits.length * 0.3) return 'Goal-driven';
        if (habits.length > 8) return 'Comprehensive-approach';
        return 'Balanced-approach';
    }

    // Additional helper methods
    private getCompletionsForDays(habit: IHabit, days: string[], timezone: string): number[] {
        return days.map(day => {
            const completion = habit.completions?.find(c =>
                getDateString(new Date(c.date), timezone) === day
            );
            return completion?.completed ? 1 : 0;
        });
    }

    private pearsonCorrelation(x: number[], y: number[]): number {
        if (x.length !== y.length || x.length === 0) return 0;

        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
    }

    private groupIntoQuarters(data: number[]): number[] {
        const quarterSize = Math.ceil(data.length / 4);
        const quarters = [];

        for (let i = 0; i < 4; i++) {
            const start = i * quarterSize;
            const end = Math.min(start + quarterSize, data.length);
            const quarter = data.slice(start, end);
            const avg = quarter.length > 0 ? quarter.reduce((a, b) => a + b, 0) / quarter.length : 0;
            quarters.push(avg);
        }

        return quarters;
    }

    private findWeeklyPatterns(completions: number[]): { consistency: number } {
        if (completions.length < 14) return { consistency: 50 };

        const weeks = [];
        for (let i = 0; i < completions.length; i += 7) {
            weeks.push(completions.slice(i, i + 7));
        }

        if (weeks.length < 2) return { consistency: 50 };

        // Calculate how similar weekly patterns are
        const weeklyTotals = weeks.map(week => week.reduce((a, b) => a + b, 0));
        const consistency = 100 - (this.calculateVariability(weeklyTotals) * 100);

        return { consistency: Math.max(0, Math.min(100, Math.round(consistency))) };
    }

    private calculateCompletionRateForDays(habit: IHabit, days: string[], timezone: string): number {
        const completions = this.getCompletionsForDays(habit, days, timezone);
        return completions.length > 0 ? (completions.reduce((a, b) => a + b, 0) / completions.length) * 100 : 0;
    }

    // Fallback analysis for when AI is not available
    private generateFallbackAnalysis(habits: IHabit[], profile: IProfile): ComprehensiveAnalysis {
        const behavioralData = this.extractBehavioralData(habits, profile);

        return {
            patterns: this.generateFallbackPatterns(habits, behavioralData),
            insights: this.generateFallbackInsights(habits, behavioralData),
            predictions: this.generateFallbackPredictions(habits),
            coachingPlan: this.generateFallbackCoachingPlan(habits, profile),
            behavioralProfile: this.generateFallbackBehavioralProfile(habits, profile),
            riskAssessment: this.generateFallbackRiskAssessment(habits)
        };
    }

    private generateFallbackPatterns(habits: IHabit[], behavioralData: any): HabitPattern[] {
        const patterns: HabitPattern[] = [];

        // Identify time-based success pattern
        const bestTimeSlot = behavioralData.performanceWindows.bestTime;
        if (bestTimeSlot) {
            patterns.push({
                type: 'success_pattern',
                title: `${bestTimeSlot} Peak Performance`,
                description: `You perform significantly better with habits scheduled for ${bestTimeSlot.toLowerCase()}.`,
                confidence: 85,
                timeframe: 'Daily',
                triggers: [bestTimeSlot.toLowerCase(), 'routine', 'energy levels'],
                affectedHabits: habits.filter(h => h.timeOfDay === bestTimeSlot).map(h => h.name),
                recommendation: `Schedule new habits during ${bestTimeSlot.toLowerCase()} for optimal success.`
            });
        }

        // Identify day-of-week patterns
        const dayPatterns = behavioralData.dayOfWeekPatterns;
        const bestDay = dayPatterns.reduce((best: any, day: any) =>
            day.completionRate > best.completionRate ? day : best, { day: 'None', completionRate: 0 });

        if (bestDay.completionRate > 70) {
            patterns.push({
                type: 'success_pattern',
                title: `${bestDay.day} Success Pattern`,
                description: `Your completion rate on ${bestDay.day}s is ${bestDay.completionRate}%, significantly higher than other days.`,
                confidence: 75,
                timeframe: 'Weekly',
                triggers: [bestDay.day.toLowerCase(), 'routine', 'schedule'],
                affectedHabits: habits.map(h => h.name),
                recommendation: `Consider reviewing what makes ${bestDay.day}s successful and replicate those conditions.`
            });
        }

        return patterns;
    }

    private generateFallbackInsights(habits: IHabit[], behavioralData: any): PersonalizedInsight[] {
        const insights: PersonalizedInsight[] = [];

        // Analyze struggling habits
        const strugglingHabits = habits.filter(h => {
            const recentRate = this.calculateRecentCompletionRate(h, 'UTC');
            return recentRate < 50 && h.status === 'active';
        });

        if (strugglingHabits.length > 0) {
            insights.push({
                id: 'struggling-habits',
                type: 'warning',
                title: `${strugglingHabits.length} Habit${strugglingHabits.length > 1 ? 's' : ''} Need Attention`,
                description: `These habits have completion rates below 50% and may benefit from adjustments: ${strugglingHabits.map(h => h.name).join(', ')}.`,
                actionPlan: [
                    {
                        step: 1,
                        action: 'Review the difficulty and timing of struggling habits',
                        timeframe: 'This week',
                        difficulty: 'easy',
                        expectedOutcome: 'Better understanding of obstacles',
                        successMetrics: ['Identified specific challenges', 'Documented blockers']
                    },
                    {
                        step: 2,
                        action: 'Reduce habit complexity or frequency temporarily',
                        timeframe: '1-2 weeks',
                        difficulty: 'medium',
                        expectedOutcome: 'Improved completion rates',
                        successMetrics: ['20% improvement in completion rate']
                    }
                ],
                confidence: 80,
                priority: 'high',
                impact: 'high',
                timeframe: '2-3 weeks',
                supportingData: {
                    metrics: { strugglingCount: strugglingHabits.length },
                    trends: ['Declining performance'],
                    correlations: []
                },
                category: 'Performance'
            });
        }

        // Celebrate high performers
        const excellentHabits = habits.filter(h => {
            const recentRate = this.calculateRecentCompletionRate(h, 'UTC');
            return recentRate >= 80 && h.streak >= 7;
        });

        if (excellentHabits.length > 0) {
            insights.push({
                id: 'excellent-habits',
                type: 'celebration',
                title: `🎉 ${excellentHabits.length} Habit${excellentHabits.length > 1 ? 's' : ''} Mastered!`,
                description: `You're crushing these habits with 80%+ completion rates: ${excellentHabits.map(h => h.name).join(', ')}.`,
                actionPlan: [
                    {
                        step: 1,
                        action: 'Identify what makes these habits successful',
                        timeframe: 'This week',
                        difficulty: 'easy',
                        expectedOutcome: 'Success pattern recognition',
                        successMetrics: ['Listed 3-5 success factors']
                    },
                    {
                        step: 2,
                        action: 'Apply successful strategies to struggling habits',
                        timeframe: '2-3 weeks',
                        difficulty: 'medium',
                        expectedOutcome: 'Improved overall consistency',
                        successMetrics: ['10% improvement in overall completion rate']
                    }
                ],
                confidence: 90,
                priority: 'medium',
                impact: 'medium',
                timeframe: '1 week',
                supportingData: {
                    metrics: { excellentCount: excellentHabits.length },
                    trends: ['Strong performance'],
                    correlations: []
                },
                category: 'Success'
            });
        }

        return insights;
    }

    private generateFallbackPredictions(habits: IHabit[]): HabitPrediction[] {
        return habits.map(habit => {
            const recentRate = this.calculateRecentCompletionRate(habit, 'UTC');
            const trend = habit.streak > 0 ? 'stable' : 'declining';

            let predictedSuccess = recentRate;
            if (trend === 'declining') predictedSuccess *= 0.8;
            if (habit.streak > 14) predictedSuccess *= 1.1;

            predictedSuccess = Math.max(0, Math.min(100, predictedSuccess));

            const riskFactors: RiskFactor[] = [];
            if (recentRate < 60) {
                riskFactors.push({
                    factor: 'Low recent completion rate',
                    severity: 'high',
                    likelihood: 80,
                    mitigation: 'Reduce habit complexity or frequency'
                });
            }

            if (habit.streak === 0) {
                riskFactors.push({
                    factor: 'No current streak momentum',
                    severity: 'medium',
                    likelihood: 60,
                    mitigation: 'Focus on consistency over perfection'
                });
            }

            const recommendations: SmartRecommendation[] = [];
            if (recentRate < 70) {
                recommendations.push({
                    type: 'timing',
                    title: 'Optimize Timing',
                    description: 'Consider adjusting when you perform this habit',
                    implementation: 'Track energy levels and reschedule accordingly',
                    expectedImprovement: 15
                });
            }

            return {
                habitId: habit._id || '',
                habitName: habit.name,
                predictedSuccess: Math.round(predictedSuccess),
                nextWeekSuccess: Math.round(predictedSuccess * 0.95),
                nextMonthSuccess: Math.round(predictedSuccess * 0.9),
                riskFactors,
                recommendations,
                optimalTiming: {
                    bestTimeOfDay: habit.timeOfDay,
                    bestDaysOfWeek: ['Monday', 'Tuesday', 'Wednesday'],
                    avoidTimes: [],
                    reasoning: 'Based on current schedule and historical performance'
                },
                difficultyAdjustment: recentRate < 60 ? 'Reduce complexity' : 'Maintain current level',
                interventionNeeded: recentRate < 50
            };
        });
    }

    private generateFallbackCoachingPlan(habits: IHabit[], profile: IProfile): CoachingPlan {
        const totalHabits = habits.length;
        const avgCompletionRate = habits.length > 0 ?
            habits.reduce((sum, h) => sum + this.calculateRecentCompletionRate(h, profile.timezone), 0) / habits.length : 0;

        const readinessScore = Math.min(100, Math.round(avgCompletionRate * 0.7 + totalHabits * 5));

        return {
            readinessScore,
            currentFocus: avgCompletionRate < 60 ? 'Stabilizing existing habits' : 'Building momentum',
            nextMilestone: totalHabits < 5 ? 'Establish 5 core habits' : 'Achieve 80% overall consistency',
            weeklyGoals: [
                {
                    week: 1,
                    objective: 'Focus on consistency over performance',
                    specificActions: ['Complete at least 50% of daily habits', 'Track completion patterns'],
                    successCriteria: ['5+ days of habit tracking', 'Identify 2 improvement areas'],
                    difficultyLevel: 3
                },
                {
                    week: 2,
                    objective: 'Optimize your best-performing habits',
                    specificActions: ['Analyze successful habit patterns', 'Apply learnings to struggling habits'],
                    successCriteria: ['10% improvement in overall completion rate'],
                    difficultyLevel: 4
                }
            ],
            monthlyObjectives: [
                'Achieve 70% overall completion rate',
                'Establish at least one 14-day streak',
                'Identify and address top 3 habit obstacles'
            ],
            personalizedStrategies: [
                {
                    name: 'Time-based Optimization',
                    description: 'Align habits with your natural energy patterns',
                    implementation: 'Schedule demanding habits during peak energy times',
                    evidence: 'Research shows 40% better adherence when habits match circadian rhythms',
                    personalizedReason: 'Your data shows better performance during specific time slots'
                }
            ],
            motivationalProfile: {
                primaryDriver: 'Progress tracking',
                secondaryDrivers: ['Achievement badges', 'Streak building'],
                demotivators: ['Perfectionism', 'All-or-nothing thinking'],
                optimalChallengeLevel: 7,
                preferredRewards: ['Progress visualization', 'Milestone celebrations'],
                communicationStyle: 'Encouraging with specific feedback'
            },
            progressTracking: [
                {
                    metric: 'Overall Completion Rate',
                    currentValue: Math.round(avgCompletionRate),
                    target: Math.min(100, Math.round(avgCompletionRate + 20)),
                    timeline: '30 days',
                    trackingMethod: 'Daily habit check-ins'
                }
            ]
        };
    }

    private generateFallbackBehavioralProfile(habits: IHabit[], profile: IProfile): BehavioralProfile {
        const mostCommonTime = this.getMostPreferredTime(habits);
        const mostCommonCategory = this.getMostPreferredCategory(habits);

        return {
            personalityType: 'Structured Builder',
            habitsPersonality: habits.length > 8 ? 'Comprehensive Optimizer' : 'Focused Practitioner',
            strengths: ['Consistent tracking', 'Goal-oriented', 'Data-driven decisions'],
            challenges: ['Overcommitment tendency', 'Perfectionism', 'All-or-nothing thinking'],
            optimalSchedule: {
                morningCapacity: mostCommonTime === 'Morning' ? 4 : 2,
                afternoonCapacity: mostCommonTime === 'Afternoon' ? 4 : 2,
                eveningCapacity: mostCommonTime === 'Evening' ? 4 : 2,
                bestHabitSequence: ['Quick wins first', 'Most important second', 'Enjoyable last'],
                energyPattern: 'Steady with morning peak'
            },
            environmentalFactors: ['Routine-dependent', 'Schedule-sensitive', 'Progress-motivated']
        };
    }

    private generateFallbackRiskAssessment(habits: IHabit[]): RiskAssessment {
        const strugglingHabits = habits.filter(h => this.calculateRecentCompletionRate(h, 'UTC') < 50);
        const overcommitted = habits.length > 10;

        let overallRisk: 'low' | 'medium' | 'high' = 'low';
        if (strugglingHabits.length > habits.length * 0.5) overallRisk = 'high';
        else if (strugglingHabits.length > habits.length * 0.25 || overcommitted) overallRisk = 'medium';

        return {
            overallRisk,
            burnoutRisk: overcommitted ? 70 : 30,
            abandonmentRisk: strugglingHabits.length > 0 ? 60 : 20,
            plateauRisk: habits.every(h => h.streak < 7) ? 50 : 25,
            interventions: [
                {
                    trigger: 'Completion rate drops below 40%',
                    action: 'Reduce habit complexity',
                    timing: 'Within 3 days',
                    priority: 1
                },
                {
                    trigger: 'No streaks over 7 days',
                    action: 'Focus on one keystone habit',
                    timing: 'Within 1 week',
                    priority: 2
                }
            ]
        };
    }
}

// Export the main function for backwards compatibility
export async function generateHabitAnalytics(
    habits: IHabit[],
    profile: IProfile | null,
    analyticsData?: any
): Promise<PersonalizedInsight[]> {
    if (!profile) return [];

    const aiService = new AdvancedHabitAI();
    const analysis = await aiService.generateComprehensiveAnalysis(habits, profile);
    return analysis.insights;
}