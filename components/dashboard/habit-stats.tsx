// components/dashboard/optimized-habit-stats.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Zap,
  Award,
  RefreshCw,
  Sparkles,
  User,
  BarChart3,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Trophy,
  Flame,
  Star,
  Clock
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { getQuickAnalytics, getFullAnalytics, refreshAnalytics, getAnalyticsStatus } from "@/lib/actions/ai-analytics";
import { OptimizedAnalysis } from "@/lib/services/habit-analytics-ai";
import { cn } from "@/lib/utils";

// Modern loading skeleton
function ModernLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Quick stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </CardContent>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
          </Card>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Trend indicator component
function TrendIndicator({ trend, value }: { trend: 'up' | 'down' | 'stable'; value?: number }) {
  const icons = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus
  };

  const colors = {
    up: 'text-green-500',
    down: 'text-red-500',
    stable: 'text-yellow-500'
  };

  const Icon = icons[trend];

  return (
    <div className={cn("flex items-center gap-1", colors[trend])}>
      <Icon className="h-4 w-4" />
      {value && <span className="text-sm font-medium">{value > 0 ? '+' : ''}{value}</span>}
    </div>
  );
}

// Insight card component
function InsightCard({ insight }: { insight: any }) {
  const typeConfig = {
    success: { bg: 'bg-green-50 dark:bg-green-950', border: 'border-green-200 dark:border-green-800', text: 'text-green-800 dark:text-green-200' },
    warning: { bg: 'bg-yellow-50 dark:bg-yellow-950', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-800 dark:text-yellow-200' },
    opportunity: { bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-200' },
    achievement: { bg: 'bg-purple-50 dark:bg-purple-950', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-800 dark:text-purple-200' }
  };

  const config = typeConfig[insight.type as keyof typeof typeConfig] || typeConfig.opportunity;

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-md", config.bg, config.border)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{insight.icon}</div>
          <div className="flex-1 min-w-0">
            <h4 className={cn("font-semibold text-sm mb-1", config.text)}>
              {insight.title}
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {insight.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={insight.impact === 'high' ? 'default' : 'secondary'} className="text-xs">
                {insight.impact} impact
              </Badge>
              {insight.actionable && (
                <Badge variant="outline" className="text-xs">
                  Actionable
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main component
export function HabitStats() {
  const [quickStats, setQuickStats] = useState<OptimizedAnalysis['quickStats'] | null>(null);
  const [fullAnalysis, setFullAnalysis] = useState<OptimizedAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  // Poll for generation status when AI is generating
  useEffect(() => {
    if (generationStatus === 'generating') {
      const interval = setInterval(async () => {
        try {
          const status = await getAnalyticsStatus();
          setGenerationStatus(status);

          if (status === 'completed') {
            const analysis = await getFullAnalytics();
            if (analysis) {
              setFullAnalysis(analysis);
              toast({
                title: "✨ AI Analysis Complete",
                description: "Your personalized insights are now ready!",
              });
            }
          }
        } catch (error) {
          console.error('Error polling status:', error);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [generationStatus, toast]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load quick stats first (always fast)
      const quick = await getQuickAnalytics();
      setQuickStats(quick);

      if (quick) {
        setLoading(false); // Show quick stats immediately

        // Then try to load full analysis
        const full = await getFullAnalytics();
        if (full) {
          if ((full as any).status === 'generating') {
            setGenerationStatus('generating');
            toast({
              title: "🧠 AI Analysis In Progress",
              description: "Generating your personalized insights...",
            });
          } else {
            setFullAnalysis(full);
            setGenerationStatus('completed');
          }
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      setLoading(false);
      toast({
        title: "Error loading analytics",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setGenerationStatus('generating');

      const analysis = await refreshAnalytics();
      if (analysis) {
        setFullAnalysis(analysis);
        setGenerationStatus('completed');
        toast({
          title: "✨ Analytics Refreshed",
          description: "Your insights have been updated with fresh AI analysis.",
        });
      }
    } catch (error) {
      console.error('Error refreshing analytics:', error);
      setGenerationStatus('failed');
      toast({
        title: "Error refreshing analytics",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <ModernLoadingSkeleton />;
  }

  if (!quickStats) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create some habits to unlock AI-powered insights and analytics
          </p>
          <Button variant="outline">
            Create Your First Habit
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Habit Analytics
          </h2>
          <p className="text-muted-foreground">
            AI-powered insights to optimize your habit-building journey
          </p>
        </div>
        <div className="flex items-center gap-2">
          {generationStatus === 'generating' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Generating insights...
            </div>
          )}
          <Button
            onClick={handleRefresh}
            disabled={refreshing || generationStatus === 'generating'}
            variant="outline"
            size="sm"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {refreshing ? 'Refreshing...' : 'Refresh Analysis'}
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Active Habits</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{quickStats.activeHabits}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <Badge variant="secondary" className="text-xs">
                {quickStats.totalHabits} total
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Success Rate</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{quickStats.completionRate}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendIndicator
                trend={quickStats.momentum === 'gaining' ? 'up' : quickStats.momentum === 'losing' ? 'down' : 'stable'}
              />
              <span className="ml-1 text-muted-foreground capitalize">{quickStats.momentum}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Current Streak</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{quickStats.longestStreak}</p>
              </div>
              <Flame className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <Badge variant="secondary" className="text-xs">
                {quickStats.totalStreak} total days
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">This Week</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{quickStats.thisWeekCompletions}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendIndicator
                trend={quickStats.thisWeekCompletions > quickStats.lastWeekCompletions ? 'up' :
                  quickStats.thisWeekCompletions < quickStats.lastWeekCompletions ? 'down' : 'stable'}
                value={quickStats.thisWeekCompletions - quickStats.lastWeekCompletions}
              />
              <span className="ml-1 text-muted-foreground">vs last week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Weekly Progress
          </CardTitle>
          <CardDescription>Your habit completion trend over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-32 gap-2">
            {quickStats.trendData.map((day, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <div
                        className="w-full bg-primary/20 rounded-t-md relative overflow-hidden"
                        style={{
                          height: `${Math.max(8, (day.value / Math.max(...quickStats.trendData.map(d => d.value))) * 100)}px`
                        }}
                      >
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-md transition-all duration-300"
                          style={{
                            height: `${Math.max(8, (day.value / Math.max(...quickStats.trendData.map(d => d.value))) * 100)}px`
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">{day.period}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{day.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights" className="relative">
            Insights
            {generationStatus === 'generating' && (
              <RefreshCw className="h-3 w-3 ml-1 animate-spin" />
            )}
          </TabsTrigger>
          <TabsTrigger value="personality">Personality</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Next Week Prediction
                </CardTitle>
                <CardDescription>AI prediction based on your patterns</CardDescription>
              </CardHeader>
              <CardContent>
                {fullAnalysis?.predictions ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary mb-2">
                        {fullAnalysis.predictions.nextWeekSuccess}%
                      </div>
                      <p className="text-sm text-muted-foreground">Expected success rate</p>
                    </div>
                    <Progress value={fullAnalysis.predictions.nextWeekSuccess} className="h-2" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Recommended Focus:</p>
                      <p className="text-sm text-muted-foreground">
                        {fullAnalysis.predictions.recommendedFocus}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {generationStatus === 'generating' ? 'Generating predictions...' : 'Refresh to get AI predictions'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Recommended next steps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickStats.completionRate < 70 && (
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">Focus on consistency</p>
                        <p className="text-yellow-700 dark:text-yellow-300">Try reducing habit difficulty</p>
                      </div>
                    </div>
                  )}

                  {quickStats.longestStreak < 7 && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <Flame className="h-5 w-5 text-blue-600" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-800 dark:text-blue-200">Build a 7-day streak</p>
                        <p className="text-blue-700 dark:text-blue-300">Focus on one core habit</p>
                      </div>
                    </div>
                  )}

                  {quickStats.activeHabits > 5 && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                      <Target className="h-5 w-5 text-purple-600" />
                      <div className="text-sm">
                        <p className="font-medium text-purple-800 dark:text-purple-200">Simplify your routine</p>
                        <p className="text-purple-700 dark:text-purple-300">Focus on 3-5 core habits</p>
                      </div>
                    </div>
                  )}

                  {quickStats.completionRate >= 80 && quickStats.longestStreak >= 7 && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                      <Trophy className="h-5 w-5 text-green-600" />
                      <div className="text-sm">
                        <p className="font-medium text-green-800 dark:text-green-200">You're crushing it! 🎉</p>
                        <p className="text-green-700 dark:text-green-300">Consider adding a challenging habit</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          {fullAnalysis?.insights ? (
            <div className="grid md:grid-cols-2 gap-4">
              {fullAnalysis.insights.map((insight, index) => (
                <InsightCard key={insight.id || index} insight={insight} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                {generationStatus === 'generating' ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <Brain className="h-16 w-16 text-primary mx-auto animate-pulse" />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">AI is analyzing your habits...</h3>
                      <p className="text-muted-foreground">This usually takes 10-30 seconds</p>
                    </div>
                    <div className="flex justify-center">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Lightbulb className="h-16 w-16 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">No AI Insights Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Click "Refresh Analysis" to generate personalized insights
                      </p>
                      <Button onClick={handleRefresh} disabled={refreshing}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Insights
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="personality" className="mt-6">
          {fullAnalysis?.personalityProfile ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {fullAnalysis.personalityProfile.title}
                </CardTitle>
                <CardDescription>{fullAnalysis.personalityProfile.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {fullAnalysis.personalityProfile.compatibility}%
                  </div>
                  <p className="text-sm text-muted-foreground">Compatibility with your habits</p>
                  <Progress value={fullAnalysis.personalityProfile.compatibility} className="mt-2" />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Your Strengths
                    </h4>
                    <ul className="space-y-2">
                      {fullAnalysis.personalityProfile.strengths.map((strength, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-500" />
                      Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {fullAnalysis.personalityProfile.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Zap className="h-4 w-4 text-blue-500" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Personality Profile</h3>
                <p className="text-muted-foreground mb-4">
                  {generationStatus === 'generating' ? 'Analyzing your habit personality...' : 'Generate AI analysis to discover your habit personality'}
                </p>
                {generationStatus !== 'generating' && (
                  <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
                    <Brain className="h-4 w-4 mr-2" />
                    Discover My Personality
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          {fullAnalysis?.achievements ? (
            <div className="space-y-6">
              {/* Recent Achievements */}
              {fullAnalysis.achievements.recent.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      Recent Achievements
                    </CardTitle>
                    <CardDescription>Celebrate your recent wins!</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {fullAnalysis.achievements.recent.map((achievement, index) => (
                        <div key={index} className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <div className="text-3xl">{achievement.icon}</div>
                          <div>
                            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                              {achievement.title}
                            </h4>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                              {achievement.description}
                            </p>
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {achievement.rarity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Progress Towards Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Achievement Progress
                  </CardTitle>
                  <CardDescription>Keep going to unlock these achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {fullAnalysis.achievements.progress.map((progress, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{progress.title}</h4>
                          <span className="text-sm text-muted-foreground">
                            {progress.current}/{progress.target}
                          </span>
                        </div>
                        <Progress value={progress.percentage} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {progress.percentage}% complete
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Achievements</h3>
                <p className="text-muted-foreground mb-4">
                  Track your progress and unlock achievements as you build habits
                </p>
                {generationStatus !== 'generating' && (
                  <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
                    <Trophy className="h-4 w-4 mr-2" />
                    Load Achievements
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}