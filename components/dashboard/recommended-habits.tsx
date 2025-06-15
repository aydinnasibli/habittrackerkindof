// components/dashboard/enhanced-recommended-habits.tsx
"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  Sparkles,
  TrendingUp,
  Zap,
  Clock,
  Brain,
  Plus,
  Star,
  Info,
  BarChart3,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { getAIRecommendations, refreshAIRecommendations } from "@/lib/actions/ai-recommendations";
import { createHabit } from "@/lib/actions/habits";
import { AIRecommendedHabit } from "@/lib/services/openai-service";

interface RecommendationData {
  recommendations: AIRecommendedHabit[];
  isFromCache: boolean;
  weeklyTheme: string;
  canRefresh: boolean;
  nextRefreshTime?: string;
}

export function RecommendedHabits() {
  const [activeTab, setActiveTab] = useState<'for-you' | 'trending' | 'new-habits'>('for-you');
  const [recommendations, setRecommendations] = useState<Record<string, RecommendationData>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [addingHabit, setAddingHabit] = useState<string | null>(null);
  const { toast } = useToast();

  // Load recommendations for a specific section
  const loadRecommendations = async (section: 'for-you' | 'trending' | 'new-habits', force = false) => {
    setLoading(prev => ({ ...prev, [section]: true }));

    try {
      const result = force
        ? await refreshAIRecommendations(section)
        : await getAIRecommendations(section);

      setRecommendations(prev => ({
        ...prev,
        [section]: result
      }));

      if (!result.isFromCache && !force) {
        toast({
          title: "✨ Fresh AI Recommendations",
          description: `New ${section.replace('-', ' ')} habits generated just for you!`,
        });
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      toast({
        title: "Error loading recommendations",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, [section]: false }));
      setRefreshing(false);
    }
  };

  // Load initial recommendations
  useEffect(() => {
    loadRecommendations(activeTab);
  }, [activeTab]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    const section = value as 'for-you' | 'trending' | 'new-habits';
    setActiveTab(section);

    // Load recommendations if not already loaded
    if (!recommendations[section]) {
      loadRecommendations(section);
    }
  };

  // Handle refresh with feedback
  const handleRefresh = async (feedback?: 'not_relevant' | 'too_easy' | 'too_hard' | 'different_category') => {
    setRefreshing(true);
    await loadRecommendations(activeTab, true);
  };

  // Add habit to user's list
  const handleAddHabit = async (habit: AIRecommendedHabit) => {
    setAddingHabit(habit.id);

    try {
      const formData = new FormData();
      formData.append('name', habit.name);
      formData.append('description', habit.description);
      formData.append('category', habit.category);
      formData.append('frequency', habit.frequency);
      formData.append('timeOfDay', habit.timeOfDay);
      formData.append('timeToComplete', habit.timeToComplete);
      formData.append('priority', habit.priority);

      await createHabit(formData);

      toast({
        title: "🎉 Habit Added!",
        description: `"${habit.name}" has been added to your habits.`,
      });
    } catch (error) {
      toast({
        title: "Error adding habit",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setAddingHabit(null);
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'low':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Mindfulness':
        return <Brain className="h-4 w-4" />;
      case 'Health':
        return <Heart className="h-4 w-4" />;
      case 'Learning':
        return <Star className="h-4 w-4" />;
      case 'Productivity':
        return <Target className="h-4 w-4" />;
      case 'Digital Wellbeing':
        return <Zap className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const currentData = recommendations[activeTab];
  const isLoading = loading[activeTab];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header with Weekly Theme */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">AI Recommended Habits</h2>
            <p className="text-muted-foreground">
              Personalized suggestions powered by AI, updated weekly
            </p>
          </div>
        </div>

        {/* Weekly Theme Banner */}
        {currentData?.weeklyTheme && (
          <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <span className="font-medium">This Week's Theme: {currentData.weeklyTheme}</span>
              </div>
              <div className="flex items-center gap-2">
                {currentData.isFromCache && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Cached
                  </Badge>
                )}
                <Badge variant="outline" className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  AI Generated
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="for-you" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">For You</span>
              </TabsTrigger>
              <TabsTrigger value="trending" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Trending</span>
              </TabsTrigger>
              <TabsTrigger value="new-habits" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Discover</span>
              </TabsTrigger>
            </TabsList>

            {/* Refresh Controls */}
            <div className="flex items-center gap-2">
              {currentData?.canRefresh && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleRefresh()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Fresh recommendations
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRefresh('not_relevant')}>
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Not relevant
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRefresh('too_easy')}>
                      <Target className="h-4 w-4 mr-2" />
                      Too easy
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRefresh('too_hard')}>
                      <Zap className="h-4 w-4 mr-2" />
                      Too challenging
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRefresh('different_category')}>
                      <Star className="h-4 w-4 mr-2" />
                      Different category
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {refreshing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </div>
              )}
            </div>
          </div>

          {/* Tab Contents */}
          <TabsContent value="for-you" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Personalized recommendations based on your current habits and goals
            </div>
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <RecommendationGrid
                recommendations={currentData?.recommendations || []}
                onAddHabit={handleAddHabit}
                addingHabit={addingHabit}
                getPriorityColor={getPriorityColor}
                getCategoryIcon={getCategoryIcon}
              />
            )}
          </TabsContent>

          <TabsContent value="trending" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Popular habits trending in the wellness community right now
            </div>
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <RecommendationGrid
                recommendations={currentData?.recommendations || []}
                onAddHabit={handleAddHabit}
                addingHabit={addingHabit}
                getPriorityColor={getPriorityColor}
                getCategoryIcon={getCategoryIcon}
                showTrendingBadge
              />
            )}
          </TabsContent>

          <TabsContent value="new-habits" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Discover innovative habits from different cultures and disciplines
            </div>
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <RecommendationGrid
                recommendations={currentData?.recommendations || []}
                onAddHabit={handleAddHabit}
                addingHabit={addingHabit}
                getPriorityColor={getPriorityColor}
                getCategoryIcon={getCategoryIcon}
                showNewBadge
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Help Text */}
        {!isLoading && (!currentData?.recommendations || currentData.recommendations.length === 0) && (
          <Card className="text-center py-8">
            <CardContent>
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No recommendations yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add some habits to get personalized AI recommendations
              </p>
              <Button onClick={() => loadRecommendations(activeTab, true)}>
                Generate Recommendations
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-full"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
            <div className="flex gap-2 mt-4">
              <div className="h-5 bg-muted rounded w-16"></div>
              <div className="h-5 bg-muted rounded w-12"></div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="h-9 bg-muted rounded w-full"></div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

// Recommendation grid component
interface RecommendationGridProps {
  recommendations: AIRecommendedHabit[];
  onAddHabit: (habit: AIRecommendedHabit) => void;
  addingHabit: string | null;
  getPriorityColor: (priority: string) => string;
  getCategoryIcon: (category: string) => React.ReactNode;
  showTrendingBadge?: boolean;
  showNewBadge?: boolean;
}

function RecommendationGrid({
  recommendations,
  onAddHabit,
  addingHabit,
  getPriorityColor,
  getCategoryIcon,
  showTrendingBadge,
  showNewBadge
}: RecommendationGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {recommendations.map((habit) => (
        <Card key={habit.id} className="flex flex-col hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getCategoryIcon(habit.category)}
                <CardTitle className="text-lg leading-tight">{habit.name}</CardTitle>
              </div>
              <div className="flex flex-col gap-1">
                {showTrendingBadge && (
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Trending
                  </Badge>
                )}
                {showNewBadge && (
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    New
                  </Badge>
                )}
                {habit.matchScore && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="text-xs">
                        {habit.matchScore}% match
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How well this habit matches your profile</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
            <CardDescription className="text-sm">
              {habit.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 space-y-4">
            {/* Habit Details */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{habit.timeToComplete}</span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{habit.frequency}</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <Badge className={getPriorityColor(habit.priority)}>
                {habit.priority}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {habit.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {habit.timeOfDay}
              </Badge>
            </div>

            {/* Benefits */}
            {habit.benefits && habit.benefits.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Benefits:</p>
                <div className="flex flex-wrap gap-1">
                  {habit.benefits.slice(0, 3).map((benefit, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* AI Reasoning */}
            {habit.aiReasoning && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-start gap-2 p-2 bg-muted/50 rounded text-xs">
                    <Brain className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground line-clamp-2">
                      {habit.aiReasoning}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{habit.aiReasoning}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Chains With */}
            {habit.chainsWith && habit.chainsWith.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Chains well with:</p>
                <p className="text-xs text-muted-foreground">
                  {habit.chainsWith.slice(0, 2).join(', ')}
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-3">
            <Button
              onClick={() => onAddHabit(habit)}
              disabled={addingHabit === habit.id}
              className="w-full"
              size="sm"
            >
              {addingHabit === habit.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Habit
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}