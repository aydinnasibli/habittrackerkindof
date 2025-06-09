"use client";

import { useState, useEffect } from "react";
import { Check, X, MoreHorizontal, Zap, Edit, Eye, Clock, Sun, Moon, Calendar, Flame, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
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
      <Card className="shadow-sm border-0 bg-gradient-to-br from-slate-50 to-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Today's Habits
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Loading your habits...
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {['Morning', 'Afternoon', 'Evening', 'Throughout day'].map((timeOfDay) => (
            <div key={timeOfDay} className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="h-6 w-6 bg-slate-200 rounded-lg animate-pulse"></div>
                <div className="h-5 w-20 bg-slate-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="p-5 bg-white border border-slate-100 rounded-xl shadow-sm animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-slate-200 rounded-full"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-5 bg-slate-200 rounded w-2/3"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
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
      <Card className="shadow-sm border-0 bg-gradient-to-br from-slate-50 to-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Today's Habits
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {getCurrentDateInTimezone(userTimezone)}
                <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                <span>{userTimezone}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-slate-700">
                  {completedCount} of {habits.length} completed
                </div>
                <div className="text-xs text-slate-500">
                  {Math.round(completionPercentage)}% progress
                </div>
              </div>
              <div className="relative">
                <Progress
                  value={completionPercentage}
                  className="w-32 h-2 bg-slate-100"
                />
                <div className="absolute -top-1 -right-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {habits.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">No habits scheduled for today</p>
              <p className="text-sm text-slate-500 mt-1">Check back on your scheduled days!</p>
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
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <TimeIcon className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{timeOfDay}</h3>
                          <p className="text-xs text-slate-500">{timeHabits.length} habit{timeHabits.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                        {completedInTime}/{timeHabits.length}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {timeHabits.map((habit) => (
                        <div
                          key={habit._id}
                          className={`group relative p-5 rounded-xl border transition-all duration-200 ${habit.completedToday
                            ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                            }`}
                        >
                          <div className="flex items-center gap-4">
                            <Button
                              size="icon"
                              variant={habit.completedToday ? "default" : "outline"}
                              className={`h-12 w-12 rounded-full transition-all duration-200 ${habit.completedToday
                                ? "bg-green-500 hover:bg-green-600 border-green-500 shadow-sm"
                                : "border-slate-300 hover:border-green-400 hover:bg-green-50"
                                } ${isToggling[habit._id!] ? "animate-pulse" : ""}`}
                              onClick={() => toggleHabit(habit._id!, habit.completedToday)}
                              disabled={isToggling[habit._id!]}
                            >
                              {habit.completedToday ? (
                                <Check className="h-5 w-5 text-white" />
                              ) : (
                                <div className="h-5 w-5" />
                              )}
                            </Button>

                            <div className="flex-1 min-w-0">
                              <div
                                className={`font-semibold text-lg cursor-pointer hover:text-blue-600 transition-colors truncate ${habit.completedToday ? "line-through text-slate-500" : "text-slate-900"
                                  }`}
                                onClick={() => handleHabitNameClick(habit)}
                                title={habit.name}
                              >
                                {habit.name}
                              </div>

                              <div className="flex items-center gap-4 mt-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {habit.frequency}
                                </Badge>

                                <div className="flex items-center gap-1 text-sm text-slate-600">
                                  <Flame className="h-4 w-4 text-orange-500" />
                                  <span className="font-medium">{habit.streak}</span>
                                  <span>day{habit.streak !== 1 ? 's' : ''}</span>
                                </div>

                                <Badge className={`text-xs font-medium ${getPriorityColor(habit.priority)}`}>
                                  {habit.priority} Priority
                                </Badge>

                                <div className="hidden md:flex items-center gap-1 text-sm text-slate-600">
                                  <Target className="h-4 w-4" />
                                  <span>Impact: {habit.impactScore}/10</span>
                                </div>
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => toggleHabit(habit._id!, habit.completedToday)}
                                  className="cursor-pointer"
                                  disabled={isToggling[habit._id!]}
                                >
                                  {habit.completedToday ? (
                                    <>
                                      <X className="mr-2 h-4 w-4" />
                                      Mark incomplete
                                    </>
                                  ) : (
                                    <>
                                      <Check className="mr-2 h-4 w-4" />
                                      Mark complete
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => handleEditHabit(habit)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit habit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => handleViewDetails(habit)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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