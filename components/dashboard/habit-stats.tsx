// components/dashboard/habit-stats.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Lightbulb,
  Calendar,
  Clock,
  Award,
  Zap,
  ChevronRight,
  ChevronDown,
  Star,
  Shield,
  Activity,
  Users,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Flame,
  BarChart3
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { getAIAnalytics } from "@/lib/actions/ai-analytics";
import {
  ComprehensiveAnalysis,
  PersonalizedInsight,
  HabitPrediction,
  HabitPattern,
  CoachingPlan,
  BehavioralProfile,
  RiskAssessment,
  ActionStep
} from "@/lib/services/habit-analytics-ai";

// Loading skeleton component
function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-muted animate-pulse rounded" />
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center space-y-2">
                <div className="h-8 w-16 bg-muted animate-pulse rounded mx-auto" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-4 w-4/5 bg-muted animate-pulse rounded" />
                <div className="h-4 w-3/5 bg-muted animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function HabitStats() {
  const [analysis, setAnalysis] = useState<ComprehensiveAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeInsight, setActiveInsight] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('insights');
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const result = await getAIAnalytics();
      setAnalysis(result);
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
    try {
      setRefreshing(true);
      const result = await getAIAnalytics();
      setAnalysis(result);
      toast({
        title: "✨ Analytics Refreshed",
        description: "Your insights have been updated with the latest data.",
      });
    } catch (error) {
      console.error('Error refreshing analytics:', error);
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
    return <AnalyticsLoadingSkeleton />;
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-muted-foreground" />
            <CardTitle>AI Analytics</CardTitle>
          </div>
          <CardDescription>
            Create some habits to unlock AI-powered insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Start tracking habits to receive personalized insights and recommendations.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* AI Summary Header */}
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary animate-pulse" />
                <div>
                  <CardTitle className="flex items-center gap-2">
                    AI Behavioral Analysis
                    <Badge variant="secondary" className="text-xs">
                      Powered by GPT-4
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Deep insights powered by behavioral psychology and your personal data
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAnalytics}
                disabled={refreshing}
                className="shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="ml-2 hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {analysis.coachingPlan.readinessScore}%
                </div>
                <div className="text-sm text-muted-foreground">Success Readiness</div>
                <Progress value={analysis.coachingPlan.readinessScore} className="mt-2" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500 mb-1">
                  {analysis.predictions.filter(p => p.interventionNeeded).length}
                </div>
                <div className="text-sm text-muted-foreground">Need Intervention</div>
                <div className="flex justify-center mt-2">
                  {analysis.predictions.filter(p => p.interventionNeeded).length > 0 ? (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500 mb-1">
                  {analysis.insights.filter(i => i.type === 'optimization').length}
                </div>
                <div className="text-sm text-muted-foreground">Opportunities</div>
                <Sparkles className="h-4 w-4 text-green-500 mx-auto mt-2" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500 mb-1">
                  {analysis.riskAssessment.overallRisk === 'low' ? '✓' :
                    analysis.riskAssessment.overallRisk === 'medium' ? '⚠' : '⚠⚠'}
                </div>
                <div className="text-sm text-muted-foreground">Risk Level</div>
                <Badge variant={
                  analysis.riskAssessment.overallRisk === 'low' ? 'secondary' :
                    analysis.riskAssessment.overallRisk === 'medium' ? 'destructive' : 'destructive'
                } className="mt-2 text-xs">
                  {analysis.riskAssessment.overallRisk.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Predictions</span>
            </TabsTrigger>
            <TabsTrigger value="patterns" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Patterns</span>
            </TabsTrigger>
            <TabsTrigger value="coaching" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Coaching</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Personalized Insights</h3>
              <Badge variant="outline">{analysis.insights.length} insights</Badge>
            </div>
            <div className="space-y-4">
              {analysis.insights
                .sort((a, b) => {
                  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                  return priorityOrder[b.priority] - priorityOrder[a.priority];
                })
                .map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    isActive={activeInsight === insight.id}
                    onToggle={() => setActiveInsight(
                      activeInsight === insight.id ? null : insight.id
                    )}
                  />
                ))}
            </div>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Habit Predictions</h3>
              <Badge variant="outline">{analysis.predictions.length} habits analyzed</Badge>
            </div>
            <div className="grid gap-4">
              {analysis.predictions
                .sort((a, b) => a.predictedSuccess - b.predictedSuccess)
                .map((prediction, index) => (
                  <PredictionCard key={index} prediction={prediction} />
                ))}
            </div>
          </TabsContent>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Behavioral Patterns</h3>
              <Badge variant="outline">{analysis.patterns.length} patterns found</Badge>
            </div>
            <PatternAnalysis patterns={analysis.patterns} />
          </TabsContent>

          {/* Coaching Plan Tab */}
          <TabsContent value="coaching" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Coaching Plan</h3>
              <Badge variant="outline">Personalized</Badge>
            </div>
            <CoachingPlanView plan={analysis.coachingPlan} />
          </TabsContent>

          {/* Behavioral Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Behavioral Profile</h3>
              <Badge variant="outline">AI Generated</Badge>
            </div>
            <BehavioralProfileView
              profile={analysis.behavioralProfile}
              riskAssessment={analysis.riskAssessment}
            />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

// Individual component implementations
function InsightCard({ insight, isActive, onToggle }: {
  insight: PersonalizedInsight;
  isActive: boolean;
  onToggle: () => void;
}) {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'breakthrough': return <Zap className="h-5 w-5 text-yellow-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'optimization': return <Target className="h-5 w-5 text-blue-500" />;
      case 'celebration': return <Award className="h-5 w-5 text-green-500" />;
      case 'prediction': return <Brain className="h-5 w-5 text-purple-500" />;
      default: return <Lightbulb className="h-5 w-5 text-orange-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${isActive ? 'ring-2 ring-primary shadow-lg' : ''
      }`}>
      <CardHeader className="pb-3" onClick={onToggle}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {getInsightIcon(insight.type)}
            <div className="flex-1">
              <CardTitle className="text-lg leading-tight">{insight.title}</CardTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={getPriorityColor(insight.priority)} className="text-xs">
                  {insight.priority} priority
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {insight.confidence}% confidence
                </Badge>
                <span className={`text-xs font-medium ${getImpactColor(insight.impact)}`}>
                  {insight.impact} impact
                </span>
                <span className="text-xs text-muted-foreground">
                  {insight.timeframe}
                </span>
              </div>
            </div>
          </div>
          <div className="shrink-0 ml-2">
            {isActive ?
              <ChevronDown className="h-4 w-4 text-muted-foreground" /> :
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            }
          </div>
        </div>
      </CardHeader>

      {isActive && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {insight.description}
            </p>

            {insight.supportingData && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                {Object.entries(insight.supportingData.metrics).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="font-semibold text-sm">{value}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {insight.actionPlan && insight.actionPlan.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Action Plan
                </h4>
                {insight.actionPlan.map((step, index) => (
                  <ActionStepCard key={index} step={step} />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function ActionStepCard({ step }: { step: ActionStep }) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'hard': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="flex gap-3 p-4 bg-card border rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
        {step.step}
      </div>
      <div className="flex-1 space-y-2">
        <p className="font-medium leading-tight">{step.action}</p>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{step.timeframe}</span>
          </div>
          <Badge
            variant="outline"
            className={`text-xs ${getDifficultyColor(step.difficulty)}`}
          >
            {step.difficulty}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">Expected:</span> {step.expectedOutcome}
        </p>
        {step.successMetrics && step.successMetrics.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Success Metrics:</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {step.successMetrics.map((metric, index) => (
                <li key={index} className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  {metric}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function PredictionCard({ prediction }: { prediction: HabitPrediction }) {
  const getSuccessColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSuccessIcon = (percentage: number) => {
    if (percentage >= 80) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (percentage >= 60) return <Activity className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card className={`${prediction.interventionNeeded ? 'border-red-200 bg-red-50/30' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {prediction.habitName}
            {prediction.interventionNeeded && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </CardTitle>
          <div className="flex items-center gap-3">
            {getSuccessIcon(prediction.predictedSuccess)}
            <div className="text-right">
              <div className={`text-lg font-bold ${getSuccessColor(prediction.predictedSuccess)}`}>
                {prediction.predictedSuccess}%
              </div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </div>
        <Progress value={prediction.predictedSuccess} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time-based predictions */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="font-semibold">{prediction.nextWeekSuccess}%</div>
            <div className="text-xs text-muted-foreground">Next Week</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{prediction.nextMonthSuccess}%</div>
            <div className="text-xs text-muted-foreground">Next Month</div>
          </div>
        </div>

        {/* Risk factors */}
        {prediction.riskFactors.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risk Factors
            </h4>
            <div className="space-y-2">
              {prediction.riskFactors.map((risk, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full mt-2 ${risk.severity === 'high' ? 'bg-red-500' :
                    risk.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                  <div className="flex-1">
                    <p className="text-muted-foreground">{risk.factor}</p>
                    <p className="text-xs text-green-600 mt-1">
                      <strong>Solution:</strong> {risk.mitigation}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {risk.likelihood}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Smart recommendations */}
        {prediction.recommendations.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 text-green-600 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Recommendations
            </h4>
            <div className="space-y-2">
              {prediction.recommendations.map((rec, index) => (
                <div key={index} className="p-3 border rounded-lg bg-green-50/50">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{rec.title}</p>
                    <Badge variant="secondary" className="text-xs">
                      +{rec.expectedImprovement}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                  <p className="text-xs text-green-600 mt-1">
                    <strong>How:</strong> {rec.implementation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optimal timing */}
        <div className="p-3 bg-blue-50/50 rounded-lg border">
          <h4 className="font-semibold text-sm mb-2 text-blue-600 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Optimal Timing
          </h4>
          <div className="text-sm space-y-1">
            <p><strong>Best time:</strong> {prediction.optimalTiming.bestTimeOfDay}</p>
            <p><strong>Best days:</strong> {prediction.optimalTiming.bestDaysOfWeek.join(', ')}</p>
            {prediction.optimalTiming.avoidTimes.length > 0 && (
              <p><strong>Avoid:</strong> {prediction.optimalTiming.avoidTimes.join(', ')}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {prediction.optimalTiming.reasoning}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PatternAnalysis({ patterns }: { patterns: HabitPattern[] }) {
  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'success_pattern': return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'failure_pattern': return <TrendingDown className="h-5 w-5 text-red-500" />;
      case 'inconsistency_pattern': return <Activity className="h-5 w-5 text-yellow-500" />;
      case 'correlation_pattern': return <BarChart3 className="h-5 w-5 text-blue-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPatternColor = (type: string) => {
    switch (type) {
      case 'success_pattern': return 'border-green-200 bg-green-50/30';
      case 'failure_pattern': return 'border-red-200 bg-red-50/30';
      case 'inconsistency_pattern': return 'border-yellow-200 bg-yellow-50/30';
      case 'correlation_pattern': return 'border-blue-200 bg-blue-50/30';
      default: return 'border-gray-200 bg-gray-50/30';
    }
  };

  if (patterns.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Not enough data to identify patterns yet. Keep tracking your habits!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {patterns.map((pattern, index) => (
        <Card key={index} className={getPatternColor(pattern.type)}>
          <CardHeader>
            <div className="flex items-start gap-3">
              {getPatternIcon(pattern.type)}
              <div className="flex-1">
                <CardTitle className="text-lg">{pattern.title}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {pattern.confidence}% confidence
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {pattern.timeframe}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{pattern.description}</p>

            {pattern.triggers.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Key Triggers:</h4>
                <div className="flex flex-wrap gap-2">
                  {pattern.triggers.map((trigger, triggerIndex) => (
                    <Badge key={triggerIndex} variant="outline" className="text-xs">
                      {trigger}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {pattern.affectedHabits.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Affected Habits:</h4>
                <div className="text-sm text-muted-foreground">
                  {pattern.affectedHabits.join(', ')}
                </div>
              </div>
            )}

            <div className="p-3 bg-card border rounded-lg">
              <h4 className="font-semibold text-sm mb-1 text-green-600">Recommendation:</h4>
              <p className="text-sm text-muted-foreground">{pattern.recommendation}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CoachingPlanView({ plan }: { plan: CoachingPlan }) {
  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Focus Area</div>
              <div className="font-medium">{plan.currentFocus}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Next Milestone</div>
              <div className="font-medium">{plan.nextMilestone}</div>
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-2">Success Readiness</div>
            <div className="flex items-center gap-3">
              <Progress value={plan.readinessScore} className="flex-1" />
              <span className="font-semibold">{plan.readinessScore}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Weekly Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {plan.weeklyGoals.map((goal, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Week {goal.week}</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < goal.difficultyLevel
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Difficulty
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{goal.objective}</p>

                <div className="space-y-2">
                  <div>
                    <h5 className="text-xs font-semibold mb-1">Actions:</h5>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {goal.specificActions.map((action, actionIndex) => (
                        <li key={actionIndex} className="flex items-start gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-xs font-semibold mb-1">Success Criteria:</h5>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {goal.successCriteria.map((criteria, criteriaIndex) => (
                        <li key={criteriaIndex} className="flex items-start gap-1">
                          <Target className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
                          {criteria}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Objectives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Monthly Objectives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {plan.monthlyObjectives.map((objective, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Award className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                {objective}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Personalized Strategies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Your Personal Strategies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {plan.personalizedStrategies.map((strategy, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">{strategy.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">{strategy.description}</p>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-green-600">How to implement:</span>
                    <p className="text-muted-foreground mt-1">{strategy.implementation}</p>
                  </div>

                  <div>
                    <span className="font-medium text-blue-600">Why this works:</span>
                    <p className="text-muted-foreground mt-1">{strategy.evidence}</p>
                  </div>

                  <div>
                    <span className="font-medium text-purple-600">For you specifically:</span>
                    <p className="text-muted-foreground mt-1">{strategy.personalizedReason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Motivational Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-500" />
            Your Motivation Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Primary Driver</h4>
              <Badge variant="default" className="mb-3">
                {plan.motivationalProfile.primaryDriver}
              </Badge>

              <h4 className="font-semibold text-sm mb-2">Secondary Drivers</h4>
              <div className="flex flex-wrap gap-1">
                {plan.motivationalProfile.secondaryDrivers.map((driver, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {driver}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">Challenge Level</h4>
              <div className="flex items-center gap-2 mb-3">
                <Progress value={plan.motivationalProfile.optimalChallengeLevel * 10} className="flex-1" />
                <span className="text-sm">{plan.motivationalProfile.optimalChallengeLevel}/10</span>
              </div>

              <h4 className="font-semibold text-sm mb-2">Preferred Rewards</h4>
              <div className="flex flex-wrap gap-1">
                {plan.motivationalProfile.preferredRewards.map((reward, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {reward}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {plan.motivationalProfile.demotivators.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2 text-red-600">Watch Out For</h4>
              <div className="flex flex-wrap gap-1">
                {plan.motivationalProfile.demotivators.map((demotivator, index) => (
                  <Badge key={index} variant="destructive" className="text-xs">
                    {demotivator}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BehavioralProfileView({ profile, riskAssessment }: {
  profile: BehavioralProfile;
  riskAssessment: RiskAssessment;
}) {
  return (
    <div className="space-y-6">
      {/* Personality Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Your Habit Personality
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Personality Type</div>
              <Badge variant="default" className="mb-3">{profile.personalityType}</Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Habits Style</div>
              <Badge variant="secondary">{profile.habitsPersonality}</Badge>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm mb-2 text-green-600">Your Strengths</h4>
              <ul className="space-y-1">
                {profile.strengths.map((strength, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2 text-orange-600">Growth Areas</h4>
              <ul className="space-y-1">
                {profile.challenges.map((challenge, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-3 w-3 text-orange-500" />
                    {challenge}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimal Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Your Optimal Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-lg font-bold text-orange-500">
                {profile.optimalSchedule.morningCapacity}
              </div>
              <div className="text-sm text-muted-foreground">Morning Habits</div>
              <Progress value={profile.optimalSchedule.morningCapacity * 25} className="mt-2" />
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-lg font-bold text-blue-500">
                {profile.optimalSchedule.afternoonCapacity}
              </div>
              <div className="text-sm text-muted-foreground">Afternoon Habits</div>
              <Progress value={profile.optimalSchedule.afternoonCapacity * 25} className="mt-2" />
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-lg font-bold text-purple-500">
                {profile.optimalSchedule.eveningCapacity}
              </div>
              <div className="text-sm text-muted-foreground">Evening Habits</div>
              <Progress value={profile.optimalSchedule.eveningCapacity * 25} className="mt-2" />
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2">Recommended Habit Sequence</h4>
            <div className="flex flex-wrap gap-2">
              {profile.optimalSchedule.bestHabitSequence.map((sequence, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {index + 1}. {sequence}
                  </Badge>
                  {index < profile.optimalSchedule.bestHabitSequence.length - 1 && (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-blue-50/50 rounded-lg">
            <h4 className="font-semibold text-sm mb-1 text-blue-600">Energy Pattern</h4>
            <p className="text-sm text-muted-foreground">{profile.optimalSchedule.energyPattern}</p>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card className={`${riskAssessment.overallRisk === 'high' ? 'border-red-200 bg-red-50/30' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            Risk Assessment
            <Badge variant={
              riskAssessment.overallRisk === 'low' ? 'secondary' :
                riskAssessment.overallRisk === 'medium' ? 'default' : 'destructive'
            }>
              {riskAssessment.overallRisk.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-red-500">{riskAssessment.burnoutRisk}%</div>
              <div className="text-sm text-muted-foreground">Burnout Risk</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-500">{riskAssessment.abandonmentRisk}%</div>
              <div className="text-sm text-muted-foreground">Abandonment Risk</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-500">{riskAssessment.plateauRisk}%</div>
              <div className="text-sm text-muted-foreground">Plateau Risk</div>
            </div>
          </div>

          {riskAssessment.interventions.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Recommended Interventions</h4>
              <div className="space-y-2">
                {riskAssessment.interventions
                  .sort((a, b) => a.priority - b.priority)
                  .map((intervention, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 border rounded-lg">
                      <div className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                        {intervention.priority}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{intervention.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <strong>When:</strong> {intervention.trigger}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Timeline:</strong> {intervention.timing}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Environmental Factors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Environmental Factors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {profile.environmentalFactors.map((factor, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {factor}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            These factors significantly influence your habit success. Consider them when planning new habits or troubleshooting existing ones.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}