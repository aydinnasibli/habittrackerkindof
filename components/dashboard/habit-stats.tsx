// components/dashboard/enhanced-habit-stats.tsx
"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Zap,
  Brain,
  Heart,
  Clock,
  Star,
  Award,
  ChevronRight,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Radar as RadarIcon,
  RefreshCw,
  Sparkles
} from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { getUserHabits } from "@/lib/actions/habits";
import { getOrCreateProfile } from "@/lib/actions/profile";
import { generateHabitAnalytics } from "@/lib/services/habit-analytics-ai";
import { IHabit, IProfile } from "@/lib/types";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))"
];

// Enhanced data types
interface EnhancedWeeklyData {
  name: string;
  date: string;
  completed: number;
  total: number;
  percentage: number;
  streak: number;
  newHabits: number;
}

interface CategoryInsight {
  name: string;
  value: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  color: string;
  completionRate: number;
  averageStreak: number;
}

interface HabitPerformance {
  name: string;
  category: string;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  weeklyTrend: number;
  difficulty: 'easy' | 'medium' | 'hard';
  consistency: number;
}

interface AIInsight {
  type: 'success' | 'warning' | 'tip' | 'achievement';
  title: string;
  description: string;
  action?: string;
  data?: any;
  priority: 'high' | 'medium' | 'low';
}

interface AnalyticsData {
  weeklyData: EnhancedWeeklyData[];
  monthlyData: any[];
  categoryInsights: CategoryInsight[];
  habitPerformance: HabitPerformance[];
  aiInsights: AIInsight[];
  streakData: any[];
  timePatterns: any[];
  motivationScore: number;
  consistencyScore: number;
  diversityScore: number;
  overallTrend: 'improving' | 'declining' | 'stable';
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-32">
      <p className="text-card-foreground font-medium mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-card-foreground">
            {entry.name}: {formatter ? formatter(entry.value, entry.name)[0] : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function HabitStats() {
  const [habits, setHabits] = useState<IHabit[]>([]);
  const [profile, setProfile] = useState<IProfile | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [fetchedHabits, fetchedProfile] = await Promise.all([
        getUserHabits(),
        getOrCreateProfile()
      ]);

      setHabits(fetchedHabits);
      setProfile(fetchedProfile);

      if (fetchedHabits.length > 0) {
        const analytics = await generateEnhancedAnalytics(fetchedHabits, fetchedProfile);
        setAnalyticsData(analytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error loading analytics",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
    toast({
      title: "✨ Analytics Refreshed",
      description: "Your habit insights have been updated with the latest data.",
    });
  };

  const generateEnhancedAnalytics = async (
    habits: IHabit[],
    profile: IProfile | null
  ): Promise<AnalyticsData> => {
    // Generate comprehensive analytics
    const weeklyData = calculateEnhancedWeeklyStats(habits);
    const monthlyData = calculateMonthlyStats(habits);
    const categoryInsights = calculateCategoryInsights(habits);
    const habitPerformance = calculateHabitPerformance(habits);
    const streakData = calculateStreakData(habits);
    const timePatterns = calculateTimePatterns(habits);

    // Calculate scores
    const scores = calculateScores(habits, habitPerformance);

    // Generate AI insights
    const aiInsights = await generateHabitAnalytics(habits, profile, {
      weeklyData,
      categoryInsights,
      habitPerformance,
      scores
    });

    return {
      weeklyData,
      monthlyData,
      categoryInsights,
      habitPerformance,
      aiInsights,
      streakData,
      timePatterns,
      motivationScore: scores.motivation,
      consistencyScore: scores.consistency,
      diversityScore: scores.diversity,
      overallTrend: calculateOverallTrend(weeklyData)
    };
  };

  // Enhanced calculation functions
  const calculateEnhancedWeeklyStats = (habits: IHabit[]): EnhancedWeeklyData[] => {
    const today = new Date();
    const weekData: EnhancedWeeklyData[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 13; i >= 0; i--) { // Last 14 days for better trend analysis
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayName = dayNames[date.getDay()];
      let completed = 0;
      let total = 0;
      let streakCount = 0;
      let newHabits = 0;

      habits.forEach(habit => {
        if (habit.status === 'active') {
          total++;

          // Check if habit was created on this day
          const createdDate = new Date(habit.createdAt);
          createdDate.setHours(0, 0, 0, 0);
          if (createdDate.getTime() === date.getTime()) {
            newHabits++;
          }

          const dayCompletion = habit.completions?.find(comp => {
            const compDate = new Date(comp.date);
            compDate.setHours(0, 0, 0, 0);
            return compDate.getTime() === date.getTime();
          });

          if (dayCompletion?.completed) {
            completed++;
            if (habit.streak > 0) streakCount++;
          }
        }
      });

      weekData.push({
        name: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : dayName,
        date: date.toISOString().split('T')[0],
        completed,
        total: total || 1,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        streak: streakCount,
        newHabits
      });
    }

    return weekData;
  };

  const calculateCategoryInsights = (habits: IHabit[]): CategoryInsight[] => {
    const categoryMap = new Map<string, {
      count: number;
      completions: number;
      totalAttempts: number;
      streaks: number[];
      weeklyCompletions: number[];
    }>();

    const colors = {
      'Mindfulness': 'hsl(280, 100%, 70%)',
      'Health': 'hsl(0, 100%, 70%)',
      'Learning': 'hsl(45, 100%, 70%)',
      'Productivity': 'hsl(200, 100%, 70%)',
      'Digital Wellbeing': 'hsl(120, 100%, 70%)'
    };

    habits.forEach(habit => {
      if (!categoryMap.has(habit.category)) {
        categoryMap.set(habit.category, {
          count: 0,
          completions: 0,
          totalAttempts: 0,
          streaks: [],
          weeklyCompletions: []
        });
      }

      const data = categoryMap.get(habit.category)!;
      data.count++;
      data.streaks.push(habit.streak);

      const completions = habit.completions?.filter(c => c.completed).length || 0;
      const attempts = habit.completions?.length || 0;

      data.completions += completions;
      data.totalAttempts += attempts;

      // Calculate weekly completions for trend
      const weeklyCompletions = habit.completions?.filter(c => {
        const compDate = new Date(c.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return compDate >= weekAgo && c.completed;
      }).length || 0;

      data.weeklyCompletions.push(weeklyCompletions);
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => {
      const completionRate = data.totalAttempts > 0
        ? Math.round((data.completions / data.totalAttempts) * 100)
        : 0;

      const averageStreak = data.streaks.length > 0
        ? Math.round(data.streaks.reduce((a, b) => a + b, 0) / data.streaks.length)
        : 0;

      const weeklyTotal = data.weeklyCompletions.reduce((a, b) => a + b, 0);
      const previousWeekTotal = Math.floor(weeklyTotal * 0.8); // Simulated previous week
      const trendValue = previousWeekTotal > 0
        ? Math.round(((weeklyTotal - previousWeekTotal) / previousWeekTotal) * 100)
        : 0;

      return {
        name: category,
        value: data.count,
        percentage: Math.round((data.count / habits.length) * 100),
        trend: trendValue > 5 ? 'up' : trendValue < -5 ? 'down' : 'stable',
        trendValue,
        color: colors[category as keyof typeof colors] || 'hsl(0, 0%, 50%)',
        completionRate,
        averageStreak
      };
    });
  };

  const calculateHabitPerformance = (habits: IHabit[]): HabitPerformance[] => {
    return habits.map(habit => {
      const completions = habit.completions?.filter(c => c.completed).length || 0;
      const attempts = habit.completions?.length || 0;
      const completionRate = attempts > 0 ? Math.round((completions / attempts) * 100) : 0;

      // Calculate consistency (how regular the completions are)
      const recentCompletions = habit.completions?.slice(-14) || [];
      const consistencyScore = calculateConsistencyScore(recentCompletions);

      // Calculate weekly trend
      const thisWeekCompletions = habit.completions?.filter(c => {
        const compDate = new Date(c.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return compDate >= weekAgo && c.completed;
      }).length || 0;

      const lastWeekCompletions = habit.completions?.filter(c => {
        const compDate = new Date(c.date);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return compDate >= twoWeeksAgo && compDate < weekAgo && c.completed;
      }).length || 0;

      const weeklyTrend = lastWeekCompletions > 0
        ? Math.round(((thisWeekCompletions - lastWeekCompletions) / lastWeekCompletions) * 100)
        : 0;

      // Calculate difficulty based on completion rate and consistency
      let difficulty: 'easy' | 'medium' | 'hard';
      if (completionRate >= 80 && consistencyScore >= 70) difficulty = 'easy';
      else if (completionRate >= 60 && consistencyScore >= 50) difficulty = 'medium';
      else difficulty = 'hard';

      // Calculate longest streak
      const longestStreak = calculateLongestStreak(habit.completions || []);

      return {
        name: habit.name,
        category: habit.category,
        completionRate,
        currentStreak: habit.streak,
        longestStreak,
        weeklyTrend,
        difficulty,
        consistency: consistencyScore
      };
    });
  };

  const calculateConsistencyScore = (completions: any[]): number => {
    if (completions.length < 3) return 0;

    const completedDays = completions.filter(c => c.completed).length;
    const totalDays = completions.length;
    const baseScore = (completedDays / totalDays) * 100;

    // Bonus for consecutive completions
    let consecutiveBonus = 0;
    let currentConsecutive = 0;
    let maxConsecutive = 0;

    completions.forEach(completion => {
      if (completion.completed) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    });

    consecutiveBonus = Math.min((maxConsecutive / totalDays) * 20, 20);

    return Math.round(Math.min(baseScore + consecutiveBonus, 100));
  };

  const calculateLongestStreak = (completions: any[]): number => {
    let maxStreak = 0;
    let currentStreak = 0;

    completions.forEach(completion => {
      if (completion.completed) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    return maxStreak;
  };

  const calculateScores = (habits: IHabit[], performance: HabitPerformance[]) => {
    const totalHabits = habits.length;
    if (totalHabits === 0) return { motivation: 0, consistency: 0, diversity: 0 };

    // Motivation score based on streaks and recent activity
    const avgStreak = habits.reduce((sum, h) => sum + h.streak, 0) / totalHabits;
    const recentActivity = habits.filter(h => {
      const lastCompletion = h.completions?.slice(-1)[0];
      if (!lastCompletion) return false;
      const daysSinceLastCompletion = Math.floor(
        (Date.now() - new Date(lastCompletion.date).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceLastCompletion <= 3;
    }).length;

    const motivationScore = Math.round(
      (avgStreak * 10 + (recentActivity / totalHabits) * 50) * 0.8
    );

    // Consistency score
    const avgConsistency = performance.reduce((sum, p) => sum + p.consistency, 0) / performance.length;
    const consistencyScore = Math.round(avgConsistency || 0);

    // Diversity score based on category distribution
    const categories = new Set(habits.map(h => h.category));
    const diversityScore = Math.round((categories.size / 5) * 100); // 5 total categories

    return {
      motivation: Math.min(motivationScore, 100),
      consistency: consistencyScore,
      diversity: diversityScore
    };
  };

  const calculateMonthlyStats = (habits: IHabit[]) => {
    // Implementation for monthly statistics
    const monthlyData = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      let completed = 0;
      let total = 0;

      habits.forEach(habit => {
        if (habit.status === 'active') {
          total++;
          const dayCompletion = habit.completions?.find(comp => {
            const compDate = new Date(comp.date);
            compDate.setHours(0, 0, 0, 0);
            date.setHours(0, 0, 0, 0);
            return compDate.getTime() === date.getTime();
          });

          if (dayCompletion?.completed) {
            completed++;
          }
        }
      });

      monthlyData.push({
        name: `Day ${30 - i}`,
        date: date.toISOString().split('T')[0],
        completed,
        total: total || 1,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      });
    }

    return monthlyData;
  };

  const calculateStreakData = (habits: IHabit[]) => {
    return habits.map(habit => ({
      name: habit.name.length > 15 ? habit.name.substring(0, 12) + '...' : habit.name,
      streak: habit.streak,
      category: habit.category
    })).sort((a, b) => b.streak - a.streak);
  };

  const calculateTimePatterns = (habits: IHabit[]) => {
    const timeSlots = ['Morning', 'Afternoon', 'Evening', 'Throughout day'];
    const patterns = timeSlots.map(slot => {
      const habitsInSlot = habits.filter(h => h.timeOfDay === slot);
      const completions = habitsInSlot.reduce((sum, habit) => {
        return sum + (habit.completions?.filter(c => c.completed).length || 0);
      }, 0);

      return {
        time: slot,
        habits: habitsInSlot.length,
        completions,
        averageCompletion: habitsInSlot.length > 0 ? Math.round(completions / habitsInSlot.length) : 0
      };
    });

    return patterns;
  };

  const calculateOverallTrend = (weeklyData: EnhancedWeeklyData[]): 'improving' | 'declining' | 'stable' => {
    if (weeklyData.length < 7) return 'stable';

    const recentWeek = weeklyData.slice(-7);
    const previousWeek = weeklyData.slice(-14, -7);

    const recentAvg = recentWeek.reduce((sum, day) => sum + day.percentage, 0) / 7;
    const previousAvg = previousWeek.reduce((sum, day) => sum + day.percentage, 0) / 7;

    const improvement = recentAvg - previousAvg;

    if (improvement > 5) return 'improving';
    if (improvement < -5) return 'declining';
    return 'stable';
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 animate-pulse" />
            <CardTitle>Loading Analytics...</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData || habits.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
            <CardTitle>Habit Analytics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Data Yet</h3>
            <p className="text-muted-foreground">
              Start tracking habits to see your analytics and insights.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    weeklyData,
    categoryInsights,
    habitPerformance,
    aiInsights,
    streakData,
    timePatterns,
    motivationScore,
    consistencyScore,
    diversityScore,
    overallTrend
  } = analyticsData;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header with Key Metrics */}
        <Card className="w-full border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 shadow-sm">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Habit Analytics & Insights
                  </CardTitle>
                  <CardDescription>
                    AI-powered analysis of your habit patterns and performance
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAnalytics}
                disabled={refreshing}
                className="bg-white/80 hover:bg-white dark:bg-gray-800/80"
              >
                {refreshing ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Refresh Insights
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Overall Trend */}
              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {overallTrend === 'improving' ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : overallTrend === 'declining' ? (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  ) : (
                    <Activity className="h-5 w-5 text-blue-500" />
                  )}
                  <span className="text-sm font-medium text-muted-foreground">Overall Trend</span>
                </div>
                <div className="text-2xl font-bold capitalize">{overallTrend}</div>
              </div>

              {/* Motivation Score */}
              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium text-muted-foreground">Motivation</span>
                </div>
                <div className="text-2xl font-bold">{motivationScore}/100</div>
                <Progress value={motivationScore} className="mt-2" />
              </div>

              {/* Consistency Score */}
              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-muted-foreground">Consistency</span>
                </div>
                <div className="text-2xl font-bold">{consistencyScore}/100</div>
                <Progress value={consistencyScore} className="mt-2" />
              </div>

              {/* Diversity Score */}
              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-purple-500" />
                  <span className="text-sm font-medium text-muted-foreground">Diversity</span>
                </div>
                <div className="text-2xl font-bold">{diversityScore}/100</div>
                <Progress value={diversityScore} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        {aiInsights.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                <CardTitle>AI Insights & Recommendations</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {aiInsights.map((insight, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${insight.type === 'success'
                      ? 'bg-green-50 border-green-500 dark:bg-green-900/20'
                      : insight.type === 'warning'
                        ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20'
                        : insight.type === 'achievement'
                          ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20'
                          : 'bg-purple-50 border-purple-500 dark:bg-purple-900/20'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {insight.type === 'success' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : insight.type === 'warning' ? (
                          <AlertCircle className="h-5 w-5 text-yellow-500" />
                        ) : insight.type === 'achievement' ? (
                          <Award className="h-5 w-5 text-blue-500" />
                        ) : (
                          <Lightbulb className="h-5 w-5 text-purple-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {insight.description}
                        </p>
                        {insight.action && (
                          <Button variant="outline" size="sm">
                            {insight.action}
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <LineChartIcon className="h-4 w-4" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="patterns" className="flex items-center gap-2">
              <RadarIcon className="h-4 w-4" />
              Patterns
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Weekly Progress</CardTitle>
                  <CardDescription>Last 14 days completion rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="percentage"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Streaks</CardTitle>
                  <CardDescription>Your longest active streaks</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={streakData.slice(0, 5)} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="streak" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">30-Day Trend Analysis</CardTitle>
                <CardDescription>Daily completion patterns over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analyticsData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="percentage"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Category Distribution</CardTitle>
                  <CardDescription>Habits by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryInsights}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryInsights.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Category Performance</CardTitle>
                  <CardDescription>Completion rates by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryInsights.map((category, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="font-medium">{category.name}</span>
                            {category.trend === 'up' ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : category.trend === 'down' ? (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            ) : null}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {category.completionRate}%
                          </span>
                        </div>
                        <Progress value={category.completionRate} />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{category.value} habits</span>
                          <span>Avg streak: {category.averageStreak} days</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Habit Performance Analysis</CardTitle>
                <CardDescription>Detailed performance metrics for each habit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {habitPerformance.map((habit, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{habit.name}</h4>
                          <p className="text-sm text-muted-foreground">{habit.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              habit.difficulty === 'easy'
                                ? 'default'
                                : habit.difficulty === 'medium'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                          >
                            {habit.difficulty}
                          </Badge>
                          {habit.weeklyTrend > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : habit.weeklyTrend < 0 ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          ) : null}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Completion</span>
                          <div className="font-medium">{habit.completionRate}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Current Streak</span>
                          <div className="font-medium">{habit.currentStreak} days</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Best Streak</span>
                          <div className="font-medium">{habit.longestStreak} days</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Consistency</span>
                          <div className="font-medium">{habit.consistency}/100</div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <Progress value={habit.completionRate} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Time Patterns</CardTitle>
                  <CardDescription>When you're most active</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={timePatterns}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="time" />
                      <PolarRadiusAxis />
                      <Radar
                        name="Habits"
                        dataKey="habits"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Weekly Patterns</CardTitle>
                  <CardDescription>Your productivity throughout the week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyData.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="percentage" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}