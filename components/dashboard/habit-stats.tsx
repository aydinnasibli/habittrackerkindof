// components/dashboard/habit-stats.tsx
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
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Activity,
  RefreshCw,
  Sparkles,
  BarChart3,
  Users,
  Flame,
  Trophy,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { getAnalytics, refreshAnalytics } from "@/lib/actions/analytics";
import { EnhancedAnalyticsData } from "@/lib/services/analytics-generator";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))"
];

// Custom tooltip component for charts
const CustomTooltip = ({ active, payload, label }: any) => {
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
            {entry.name}: {typeof entry.value === 'number' ? Math.round(entry.value) : entry.value}
            {entry.name.includes('Rate') || entry.name.includes('percentage') ? '%' : ''}
          </span>
        </div>
      ))}
    </div>
  );
};

// Metric card component
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  color?: string;
}

function MetricCard({ title, value, subtitle, icon, trend, trendValue, color = "primary" }: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend || trend === 'stable') return <Minus className="h-3 w-3" />;
    return trend === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (!trend || trend === 'stable') return 'text-muted-foreground';
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-${color}/10`}>
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          {trend && trendValue !== undefined && (
            <div className={`flex items-center gap-1 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-sm font-medium">{trendValue}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// AI Insight card component
interface AIInsightCardProps {
  insight: EnhancedAnalyticsData['aiInsights'][0];
  onAction?: () => void;
}

function AIInsightCard({ insight, onAction }: AIInsightCardProps) {
  const getIcon = () => {
    switch (insight.type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'tip':
        return <Lightbulb className="h-5 w-5 text-blue-600" />;
      case 'achievement':
        return <Trophy className="h-5 w-5 text-purple-600" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const getBorderColor = () => {
    switch (insight.type) {
      case 'success':
        return 'border-l-green-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'tip':
        return 'border-l-blue-500';
      case 'achievement':
        return 'border-l-purple-500';
      default:
        return 'border-l-border';
    }
  };

  return (
    <Card className={`border-l-4 ${getBorderColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
            <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
            {insight.action && (
              <Button
                size="sm"
                variant="outline"
                onClick={onAction}
                className="text-xs"
              >
                {insight.action}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function HabitStats() {
  const [analyticsData, setAnalyticsData] = useState<EnhancedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getAnalytics();
      setAnalyticsData(data);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await refreshAnalytics();
      setAnalyticsData(data);
      toast({
        title: "✨ Analytics Refreshed",
        description: "Your habit insights have been updated with the latest data.",
      });
    } catch (error) {
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
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
            <p className="text-muted-foreground">Loading your habit insights...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Analytics Available</h3>
          <p className="text-muted-foreground">
            Start tracking some habits to see your analytics dashboard!
          </p>
        </CardContent>
      </Card>
    );
  }

  const { metrics, dailyData, categoryInsights, habitPerformance, timePatterns, streakData, aiInsights } = analyticsData;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
            <p className="text-muted-foreground">
              AI-powered insights into your habit journey
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Completion Rate"
            value={`${metrics.completionRate}%`}
            subtitle="Last 30 days"
            icon={<Target className="h-5 w-5" />}
            color="blue"
          />
          <MetricCard
            title="Current Streak"
            value={`${metrics.averageStreak} days`}
            subtitle="Average across habits"
            icon={<Flame className="h-5 w-5" />}
            color="orange"
          />
          <MetricCard
            title="Consistency Score"
            value={`${metrics.consistencyScore}%`}
            subtitle="How regular you are"
            icon={<Activity className="h-5 w-5" />}
            color="green"
          />
          <MetricCard
            title="Active Habits"
            value={metrics.activeHabits}
            subtitle={`of ${metrics.totalHabits} total`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            color="purple"
          />
        </div>

        {/* AI Insights */}
        {aiInsights.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">AI Insights</h3>
              <Badge variant="secondary">Powered by AI</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiInsights.slice(0, 4).map((insight, index) => (
                <AIInsightCard key={index} insight={insight} />
              ))}
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Progress Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Daily Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="dayName"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="percentage"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.1}
                    strokeWidth={1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Category Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryInsights.filter(cat => cat.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryInsights.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {data.value} habits ({data.percentage}%)
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {data.completionRate}% completion rate
                          </p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {categoryInsights.filter(cat => cat.value > 0).map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span>{category.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>{category.completionRate}%</span>
                      {category.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                      {category.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Patterns & Habit Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Time Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={timePatterns} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis dataKey="timeSlot" type="category" width={100} fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="completionRate"
                    fill="hsl(var(--chart-3))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Performing Habits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Top Performing Habits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {habitPerformance.slice(0, 5).map((habit, index) => (
                  <div key={habit.habitId} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{habit.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {habit.category}
                        </Badge>
                      </div>
                      <Progress value={habit.completionRate} className="h-2" />
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-sm font-semibold">{habit.completionRate}%</p>
                      <p className="text-xs text-muted-foreground">
                        {habit.currentStreak} day streak
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Detailed Performance Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-2">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="hsl(var(--muted))"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - metrics.motivationScore / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold">{metrics.motivationScore}</span>
                  </div>
                </div>
                <h4 className="font-semibold">Motivation Score</h4>
                <p className="text-sm text-muted-foreground">Based on recent activity</p>
              </div>

              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-2">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="hsl(var(--muted))"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - metrics.consistencyScore / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold">{metrics.consistencyScore}</span>
                  </div>
                </div>
                <h4 className="font-semibold">Consistency Score</h4>
                <p className="text-sm text-muted-foreground">How regular you are</p>
              </div>

              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-2">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="hsl(var(--muted))"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="hsl(var(--chart-3))"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - metrics.diversityScore / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold">{metrics.diversityScore}</span>
                  </div>
                </div>
                <h4 className="font-semibold">Diversity Score</h4>
                <p className="text-sm text-muted-foreground">Category variety</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Last updated: {new Date(analyticsData.lastUpdated).toLocaleString()}
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}