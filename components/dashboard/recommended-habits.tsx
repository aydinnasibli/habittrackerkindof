// components/dashboard/recommended-habits.tsx
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
  Target,
  CheckCircle
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
import { getAIRecommendations, refreshAIRecommendations, checkHabitExists } from "@/lib/actions/ai-recommendations";
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
  const [addedHabits, setAddedHabits] = useState<Set<string>>(new Set());
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
        [section]: result as RecommendationData
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

  // Add habit to user's list with duplicate check
  const handleAddHabit = async (habit: AIRecommendedHabit) => {
    setAddingHabit(habit.id);

    try {
      // Check if habit already exists
      const exists = await checkHabitExists(habit.name);
      if (exists) {
        toast({
          title: "Habit Already Exists",
          description: `You already have a habit called "${habit.name}". Try modifying the name if you want to add a similar habit.`,
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append('name', habit.name);
      formData.append('description', habit.description);
      formData.append('category', habit.category);
      formData.append('frequency', habit.frequency);
      formData.append('timeOfDay', habit.timeOfDay);
      formData.append('timeToComplete', habit.timeToComplete);
      formData.append('priority', habit.priority);

      await createHabit(formData);

      // Mark as added
      setAddedHabits(prev => new Set([...Array.from(prev), habit.id]));

      toast({
        title: "🎉 Habit Added!",
        description: `"${habit.name}" has been added to your habits.`,
      });
    } catch (error) {
      console.error('Error adding habit:', error);
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
        return 'bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:text-yellow-400';
      case 'low':
        return 'bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20 dark:text-gray-400';
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
        return <Plus className="h-4 w-4" />;
    }
  };

  // Get section info
  const getSectionInfo = (section: string) => {
    switch (section) {
      case 'for-you':
        return {
          icon: <Sparkles className="h-5 w-5" />,
          title: 'For You',
          description: 'Personalized habits based on your profile and current routine'
        };
      case 'trending':
        return {
          icon: <TrendingUp className="h-5 w-5" />,
          title: 'Trending',
          description: 'Popular habits that are working for others right now'
        };
      case 'new-habits':
        return {
          icon: <Zap className="h-5 w-5" />,
          title: 'New Habits',
          description: 'Beginner-friendly habits perfect for getting started'
        };
      default:
        return {
          icon: <Plus className="h-5 w-5" />,
          title: 'Habits',
          description: 'Recommended habits for you'
        };
    }
  };

  const currentData = recommendations[activeTab];
  const isLoading = loading[activeTab];

  return (
    <TooltipProvider>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-500" />
              <div>
                <CardTitle>AI Recommended Habits</CardTitle>
                <CardDescription>
                  {currentData?.weeklyTheme && (
                    <span className="text-purple-600 dark:text-purple-400 font-medium">
                      This week: {currentData.weeklyTheme}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {currentData?.canRefresh && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={refreshing}
                    >
                      {refreshing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Refresh
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleRefresh()}>
                      🔄 Fresh recommendations
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRefresh('not_relevant')}>
                      👎 Not relevant to me
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRefresh('too_easy')}>
                      😴 Too easy
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRefresh('too_hard')}>
                      😰 Too challenging
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRefresh('different_category')}>
                      🔀 Different categories
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>AI recommendations refresh weekly and adapt to your progress</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="for-you" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                For You
              </TabsTrigger>
              <TabsTrigger value="trending" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="new-habits" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                New Habits
              </TabsTrigger>
            </TabsList>

            {(['for-you', 'trending', 'new-habits'] as const).map((section) => (
              <TabsContent key={section} value={section} className="mt-6">
                <div className="space-y-4">
                  {/* Section Description */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {getSectionInfo(section).icon}
                    <span>{getSectionInfo(section).description}</span>
                    {currentData?.isFromCache && (
                      <Badge variant="outline" className="ml-auto">
                        Cached
                      </Badge>
                    )}
                  </div>

                  {/* Loading State */}
                  {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {[...Array(6)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                          <CardHeader>
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="h-3 bg-muted rounded"></div>
                              <div className="h-3 bg-muted rounded w-5/6"></div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : currentData?.recommendations?.length ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {currentData.recommendations.map((habit) => (
                        <Card key={habit.id} className="group hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                {getCategoryIcon(habit.category)}
                                <div>
                                  <CardTitle className="text-sm leading-tight">
                                    {habit.name}
                                  </CardTitle>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {habit.category}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${getPriorityColor(habit.priority)}`}
                                    >
                                      {habit.priority}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              {habit.matchScore && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <BarChart3 className="h-3 w-3" />
                                      {habit.matchScore}%
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Match score based on your profile</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </CardHeader>

                          <CardContent className="py-3">
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {habit.description}
                            </p>

                            <div className="space-y-2 text-xs">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{habit.timeToComplete} • {habit.frequency} • {habit.timeOfDay}</span>
                              </div>

                              {habit.benefits && habit.benefits.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {habit.benefits.slice(0, 2).map((benefit, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs px-2 py-0">
                                      {benefit}
                                    </Badge>
                                  ))}
                                  {habit.benefits.length > 2 && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="secondary" className="text-xs px-2 py-0 cursor-help">
                                          +{habit.benefits.length - 2} more
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="max-w-xs">
                                          <p className="font-medium mb-1">All Benefits:</p>
                                          <ul className="text-xs space-y-1">
                                            {habit.benefits.map((benefit, index) => (
                                              <li key={index}>• {benefit}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              )}

                              {habit.aiReasoning && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-start gap-1 p-2 bg-muted/50 rounded text-xs cursor-help">
                                      <Brain className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                      <span className="line-clamp-2">{habit.aiReasoning}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p>{habit.aiReasoning}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </CardContent>

                          <CardFooter className="pt-3">
                            {addedHabits.has(habit.id) ? (
                              <Button
                                className="w-full"
                                variant="outline"
                                disabled
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                Added to Habits
                              </Button>
                            ) : (
                              <Button
                                className="w-full cursor-pointer"
                                variant="outline"
                                onClick={() => handleAddHabit(habit)}
                                disabled={addingHabit === habit.id}
                              >
                                {addingHabit === habit.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add to My Habits
                                  </>
                                )}
                              </Button>
                            )}
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
                        <Sparkles className="h-full w-full" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No recommendations yet</h3>
                      <p className="text-muted-foreground mb-4">
                        We're generating personalized recommendations for you.
                      </p>
                      <Button onClick={() => loadRecommendations(activeTab, true)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Generate Recommendations
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}