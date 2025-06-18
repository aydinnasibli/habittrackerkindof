"use client";

import { useState, useEffect } from "react";
import { Check, X, MoreHorizontal, Zap, Edit, Eye, Clock, Sun, Moon, Calendar, Flame, Target, TrendingUp, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { completeHabit, skipHabit, getUserHabits } from "@/lib/actions/habits";
import { IHabit } from "@/lib/types";
import { HabitDetailModal } from "@/components/modals/habit-detail-modal";
import { HabitEditModal } from "../modals/habit-edit-modal";

type HabitWithCompletion = IHabit & {
  completedToday: boolean;
  impactScore: number;
};

type GroupedHabits = {
  [key: string]: HabitWithCompletion[];
};

// Helper function to get user's timezone with fallback
function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Failed to get user timezone, falling back to UTC:', error);
    return 'UTC';
  }
}

// Helper function to get current date in user's timezone (YYYY-MM-DD format)
function getCurrentDateInTimezone(timezone: string): string {
  try {
    const now = new Date();
    // Use sv-SE locale for consistent YYYY-MM-DD format
    return now.toLocaleDateString('sv-SE', { timeZone: timezone });
  } catch (error) {
    console.warn('Failed to get date in timezone, falling back to UTC:', error);
    return new Date().toISOString().split('T')[0];
  }
}

// Helper function to get day of week in user's timezone (0 = Sunday, 1 = Monday, etc.)
function getDayOfWeekInTimezone(timezone: string): number {
  try {
    const now = new Date();
    const userDate = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    return userDate.getDay();
  } catch (error) {
    console.warn('Failed to get day of week in timezone, falling back to UTC:', error);
    return new Date().getDay();
  }
}

// Helper function to check if habit should show today based on frequency
function shouldShowToday(frequency: string, timezone: string): boolean {
  const userDay = getDayOfWeekInTimezone(timezone);

  switch (frequency) {
    case 'Daily':
      return true;
    case 'Weekdays':
      return userDay >= 1 && userDay <= 5; // Monday to Friday
    case 'Weekends':
      return userDay === 0 || userDay === 6; // Saturday and Sunday
    case 'Mon, Wed, Fri':
      return userDay === 1 || userDay === 3 || userDay === 5; // Monday, Wednesday, Friday
    case 'Tue, Thu':
      return userDay === 2 || userDay === 4; // Tuesday, Thursday
    default:
      // Handle custom frequencies - check if frequency string contains today's name
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayName = dayNames[userDay];
      return frequency.toLowerCase().includes(todayName);
  }
}

// Helper function to check if habit is completed today in user's timezone
function isCompletedToday(completions: any[], timezone: string): boolean {
  if (!completions || completions.length === 0) return false;

  const todayString = getCurrentDateInTimezone(timezone);

  return completions.some(completion => {
    if (!completion.completed) return false;

    try {
      const completionDate = new Date(completion.date);
      // Use sv-SE locale for consistent YYYY-MM-DD format matching
      const completionString = completionDate.toLocaleDateString('sv-SE', { timeZone: timezone });
      return completionString === todayString;
    } catch (error) {
      console.warn('Error comparing completion date:', error);
      return false;
    }
  });
}

// Helper function to calculate impact score
function calculateImpactScore(habit: IHabit): number {
  const priorityMultiplier = habit.priority === 'High' ? 1.5 : habit.priority === 'Medium' ? 1.2 : 1.0;
  const streakBonus = Math.min(habit.streak * 0.1, 3); // Max 3 points from streak
  const baseScore = 5; // Base score of 5
  const impactScore = Math.min(10, (baseScore + streakBonus) * priorityMultiplier);
  return Math.round(impactScore * 10) / 10;
}

// Helper function to group habits by time of day
function groupHabitsByTimeOfDay(habits: HabitWithCompletion[]): GroupedHabits {
  const grouped: GroupedHabits = {
    'Morning': [],
    'Afternoon': [],
    'Evening': [],
    'Throughout day': []
  };

  habits.forEach(habit => {
    const timeOfDay = habit.timeOfDay;
    if (grouped[timeOfDay]) {
      grouped[timeOfDay].push(habit);
    } else {
      // Handle any unexpected timeOfDay values by putting them in "Throughout day"
      grouped['Throughout day'].push(habit);
    }
  });

  // Sort habits within each time group
  Object.keys(grouped).forEach(timeOfDay => {
    grouped[timeOfDay].sort((a, b) => {
      // Sort by completion status (incomplete first), then by priority, then by name
      if (a.completedToday !== b.completedToday) {
        return a.completedToday ? 1 : -1;
      }
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
        (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return a.name.localeCompare(b.name);
    });
  });

  return grouped;
}

// Helper function to get time of day icon
function getTimeOfDayIcon(timeOfDay: string) {
  switch (timeOfDay) {
    case 'Morning':
      return Sun;
    case 'Afternoon':
      return Sun;
    case 'Evening':
      return Moon;
    case 'Throughout day':
      return Clock;
    default:
      return Clock;
  }
}

// Helper function to get priority color
function getPriorityColor(priority: string) {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'medium':
      return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20';
    case 'low':
      return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

export function HabitOverview() {
  const [habits, setHabits] = useState<HabitWithCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHabit, setSelectedHabit] = useState<IHabit | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userTimezone, setUserTimezone] = useState<string>('UTC');
  const [isToggling, setIsToggling] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Initialize timezone on component mount
  useEffect(() => {
    const detectedTimezone = getUserTimezone();
    setUserTimezone(detectedTimezone);
  }, []);

  // Load habits when timezone is available
  useEffect(() => {
    if (userTimezone) {
      loadHabits();
    }
  }, [userTimezone]);

  const loadHabits = async () => {
    try {
      setLoading(true);
      const fetchedHabits = await getUserHabits(userTimezone);

      const habitsWithCompletion = fetchedHabits
        .filter(habit => habit.status === 'active')
        .filter(habit => shouldShowToday(habit.frequency, userTimezone))
        .map(habit => {
          const completedToday = isCompletedToday(habit.completions, userTimezone);
          const impactScore = calculateImpactScore(habit);

          return {
            ...habit,
            completedToday,
            impactScore
          };
        });

      setHabits(habitsWithCompletion);
    } catch (error) {
      console.error('Error loading habits:', error);
      toast({
        title: "Error",
        description: "Failed to load habits. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = async (habitId: string, currentStatus: boolean) => {
    if (isToggling[habitId]) return; // Prevent double-clicking

    try {
      setIsToggling(prev => ({ ...prev, [habitId]: true }));

      // Find the habit to update optimistically
      const habitIndex = habits.findIndex(h => h._id === habitId);
      if (habitIndex === -1) {
        throw new Error('Habit not found');
      }

      const habit = habits[habitIndex];

      // Define the result type based on the return type of skipHabit/completeHabit
      let result: { success: boolean; error?: string; newStreak?: number };

      if (currentStatus) {
        // If completed, skip it (mark as not completed)
        result = await skipHabit(habitId, userTimezone);
        if (!result.success) {
          throw new Error(result.error);
        }

        // Update local state optimistically
        setHabits(prevHabits => {
          const updatedHabits = [...prevHabits];
          updatedHabits[habitIndex] = {
            ...updatedHabits[habitIndex],
            completedToday: false,
            streak: result.newStreak || 0
          };
          return updatedHabits;
        });

        toast({
          title: "Habit unmarked",
          description: "Habit marked as not completed for today.",
        });
      } else {
        // If not completed, complete it
        result = await completeHabit(habitId, userTimezone);
        if (!result.success) {
          throw new Error(result.error);
        }

        // Update local state optimistically
        setHabits(prevHabits => {
          const updatedHabits = [...prevHabits];
          updatedHabits[habitIndex] = {
            ...updatedHabits[habitIndex],
            completedToday: true,
            streak: result.newStreak || 0
          };
          return updatedHabits;
        });

        toast({
          title: "Habit completed!",
          description: `You've completed "${habit?.name}". Great job!`,
        });

        // Check for chain reaction with meditation -> hydration
        if (habit?.name.toLowerCase().includes('meditation')) {
          setTimeout(() => {
            const waterHabit = habits.find(h =>
              (h.name.toLowerCase().includes('water') ||
                h.name.toLowerCase().includes('hydrat')) &&
              !h.completedToday
            );

            if (waterHabit) {
              toast({
                title: "Chain Reaction!",
                description: "Consider drinking water next - it pairs well with meditation!",
                action: (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                    onClick={() => toggleHabit(waterHabit._id!, false)}
                  >
                    <Zap className="h-3 w-3" />
                    Do it now
                  </Button>
                ),
              });
            }
          }, 1000);
        }
      }

      // Reload habits to ensure consistency (but don't wait for it)
      setTimeout(() => loadHabits(), 100);

    } catch (error) {
      console.error('Error toggling habit:', error);

      // Revert optimistic update on error
      await loadHabits();

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update habit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsToggling(prev => ({ ...prev, [habitId]: false }));
    }
  };

  const handleHabitNameClick = (habit: IHabit) => {
    setSelectedHabit(habit);
    setIsDetailModalOpen(true);
  };

  const handleEditHabit = (habit: IHabit) => {
    setSelectedHabit(habit);
    setIsEditModalOpen(true);
  };

  const handleViewDetails = (habit: IHabit) => {
    setSelectedHabit(habit);
    setIsDetailModalOpen(true);
  };

  const handleModalClose = () => {
    setSelectedHabit(null);
    setIsDetailModalOpen(false);
    setIsEditModalOpen(false);
  };

  const handleHabitUpdate = async () => {
    await loadHabits();
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-muted animate-pulse rounded-lg"></div>
              <div className="h-5 w-32 bg-muted/60 animate-pulse rounded"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                <div className="h-3 w-16 bg-muted/60 animate-pulse rounded"></div>
              </div>
              <div className="h-2 w-32 bg-muted animate-pulse rounded-full"></div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {['Morning', 'Afternoon', 'Evening', 'Throughout day'].map((timeOfDay) => (
            <div key={timeOfDay} className="space-y-4">
              <div className="flex items-center gap-3 pb-4">
                <div className="h-8 w-8 bg-muted animate-pulse rounded-xl"></div>
                <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
              </div>
              <div className="grid gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-muted/30 animate-pulse rounded-xl"></div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const completedCount = habits.filter((habit) => habit.completedToday).length;
  const completionPercentage = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;
  const groupedHabits = groupHabitsByTimeOfDay(habits);

  // Define the order of time periods
  const timeOrder = ['Morning', 'Afternoon', 'Evening', 'Throughout day'];

  return (
    <>
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

        <CardHeader className="relative pb-6 border-b border-border/50">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Today's Habits
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {getCurrentDateInTimezone(userTimezone)}
                </div>
                <div className="w-1 h-1 rounded-full bg-muted-foreground/50"></div>
                <span className="font-medium">{userTimezone}</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right space-y-1">
                <div className="text-sm font-semibold text-foreground">
                  {completedCount} of {habits.length}
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(completionPercentage)}% complete
                </div>
              </div>

              <div className="relative">
                <div className="w-16 h-16 relative">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="100, 100"
                      className="text-muted/30"
                    />
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${completionPercentage}, 100`}
                      className="text-primary transition-all duration-500 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative p-6">
          {habits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-muted/50 rounded-2xl flex items-center justify-center mb-6">
                <Activity className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-foreground">No habits for today</h3>
                <p className="text-muted-foreground max-w-sm">
                  Your scheduled habits will appear here on their designated days
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {timeOrder.map((timeOfDay) => {
                const timeHabits = groupedHabits[timeOfDay];
                if (!timeHabits || timeHabits.length === 0) return null;

                const completedInTime = timeHabits.filter(h => h.completedToday).length;
                const TimeIcon = getTimeOfDayIcon(timeOfDay);

                return (
                  <div key={timeOfDay} className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center">
                          <TimeIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">{timeOfDay}</h3>
                          <p className="text-xs text-muted-foreground">
                            {timeHabits.length} habit{timeHabits.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary border-primary/20 font-medium"
                        >
                          {completedInTime}/{timeHabits.length}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      {timeHabits.map((habit) => (
                        <div
                          key={habit._id}
                          className={`group relative overflow-hidden rounded-xl border transition-all duration-200 ${habit.completedToday
                            ? "bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent border-green-500/20 shadow-sm"
                            : "bg-card/80 border-border/50 hover:border-border hover:shadow-md hover:bg-card"
                            }`}
                        >
                          <div className="p-5">
                            <div className="flex items-center gap-4">
                              <Button
                                size="icon"
                                variant={habit.completedToday ? "default" : "outline"}
                                className={`h-12 w-12 rounded-full transition-all cursor-pointer duration-300 shrink-0 ${habit.completedToday
                                  ? "bg-primary hover:bg-primary/90 border-primary shadow-lg scale-105 ring-2 ring-primary/20"
                                  : "border-border hover:border-primary/50 hover:bg-primary/5 hover:scale-105"
                                  } ${isToggling[habit._id!] ? "animate-pulse" : ""}`}
                                onClick={() => toggleHabit(habit._id!, habit.completedToday)}
                                disabled={isToggling[habit._id!]}
                              >
                                {habit.completedToday ? (
                                  <Check className="h-5 w-5 scale-125 text-primary-foreground drop-shadow-sm" />
                                ) : (
                                  <div className="h-5 w-5" />
                                )}
                              </Button>

                              <div className="flex-1 min-w-0 space-y-3">
                                <div
                                  className={`font-semibold text-lg cursor-pointer hover:text-primary transition-colors truncate ${habit.completedToday ? "line-through text-muted-foreground" : "text-foreground"
                                    }`}
                                  onClick={() => handleHabitNameClick(habit)}
                                  title={habit.name}
                                >
                                  {habit.name}
                                </div>

                                <div className="flex items-center gap-3 flex-wrap">
                                  <Badge variant="outline" className="text-xs bg-background/50">
                                    {habit.frequency}
                                  </Badge>

                                  <div className="flex items-center gap-1.5 text-sm">
                                    <Flame className="h-4 w-4 text-orange-500" />
                                    <span className="font-medium text-foreground">{habit.streak}</span>
                                    <span className="text-muted-foreground">day{habit.streak !== 1 ? 's' : ''}</span>
                                  </div>

                                  <Badge className={`text-xs cursor-default font-medium ${getPriorityColor(habit.priority)}`}>
                                    {habit.priority}
                                  </Badge>

                                  <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Target className="h-4 w-4" />
                                    <span className="font-medium">{habit.impactScore}/10</span>
                                  </div>
                                </div>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="transition-all cursor-pointer duration-200 h-10 w-10 hover:bg-muted hover:scale-105 active:scale-95"
                                  >
                                    <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 shadow-lg border-border/50 bg-card/95 backdrop-blur-sm">
                                  <DropdownMenuLabel className="text-sm font-semibold text-foreground">
                                    Habit Actions
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator className="bg-border/50" />
                                  <DropdownMenuItem
                                    onClick={() => toggleHabit(habit._id!, habit.completedToday)}
                                    className="cursor-pointer hover:bg-muted/80 focus:bg-muted/80 transition-colors py-2.5"
                                    disabled={isToggling[habit._id!]}
                                  >
                                    {habit.completedToday ? (
                                      <>
                                        <X className="mr-3 h-4 w-4 text-destructive" />
                                        <span className="text-sm">Mark as incomplete</span>
                                      </>
                                    ) : (
                                      <>
                                        <Check className="mr-3 h-4 w-4 text-primary" />
                                        <span className="text-sm">Mark as complete</span>
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="cursor-pointer hover:bg-muted/80 focus:bg-muted/80 transition-colors py-2.5"
                                    onClick={() => handleEditHabit(habit)}
                                  >
                                    <Edit className="mr-3 h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Edit habit</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="cursor-pointer hover:bg-muted/80 focus:bg-muted/80 transition-colors py-2.5"
                                    onClick={() => handleViewDetails(habit)}
                                  >
                                    <Eye className="mr-3 h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">View details</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Subtle gradient overlay for completed habits */}
                          {habit.completedToday && (
                            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent pointer-events-none" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <HabitDetailModal
        habit={selectedHabit}
        isOpen={isDetailModalOpen}
        onClose={handleModalClose}
      />

      <HabitEditModal
        habit={selectedHabit}
        isOpen={isEditModalOpen}
        onClose={handleModalClose}
        onUpdate={handleHabitUpdate}
      />
    </>
  );
}