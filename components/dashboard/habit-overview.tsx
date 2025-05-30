"use client";

import { useState, useEffect } from "react";
import { Check, X, MoreHorizontal, Zap, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
        })
        .sort((a, b) => {
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

      if (currentStatus) {
        // If completed, skip it (mark as not completed)
        const result = await skipHabit(habitId, userTimezone);
        if (!result.success) {
          throw new Error(result.error);
        }
        toast({
          title: "Habit unmarked",
          description: "Habit marked as not completed for today.",
        });
      } else {
        // If not completed, complete it
        const result = await completeHabit(habitId, userTimezone);
        if (!result.success) {
          throw new Error(result.error);
        }

        const habit = habits.find(h => h._id === habitId);
        toast({
          title: "Habit completed! 🎉",
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
                title: "Chain Reaction! ⚡",
                description: "Consider drinking water next - it pairs well with meditation!",
                action: (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                    onClick={() => toggleHabit(waterHabit._id, false)}
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

      // Reload habits to get updated data
      await loadHabits();
    } catch (error) {
      console.error('Error toggling habit:', error);
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
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Today's Habits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-muted rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedCount = habits.filter((habit) => habit.completedToday).length;
  const completionPercentage = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-xl font-bold">Today's Habits</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {getCurrentDateInTimezone(userTimezone)} • {userTimezone}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground text-right">
              <div>{completedCount} of {habits.length} completed</div>
              <div className="text-xs">{Math.round(completionPercentage)}% done</div>
            </div>
            <Progress value={completionPercentage} className="w-24" />
          </div>
        </CardHeader>
        <CardContent>
          {habits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No habits scheduled for today.</p>
              <p className="text-sm mt-2">Check back on your scheduled days!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {habits.map((habit) => (
                <div
                  key={habit._id}
                  className={`p-4 border rounded-lg flex items-center justify-between group transition-all duration-200 ${habit.completedToday
                      ? "bg-muted/30 border-muted"
                      : "bg-card border-border hover:bg-muted/10 hover:border-muted-foreground/20"
                    }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Button
                      size="icon"
                      variant={habit.completedToday ? "default" : "outline"}
                      className={`h-10 w-10 rounded-full transition-all duration-200 ${habit.completedToday
                          ? "bg-primary hover:bg-primary/90"
                          : "hover:bg-primary/10 hover:border-primary/50"
                        } ${isToggling[habit._id] ? "animate-pulse" : ""}`}
                      onClick={() => toggleHabit(habit._id, habit.completedToday)}
                      disabled={isToggling[habit._id]}
                    >
                      {habit.completedToday ? (
                        <Check className="h-5 w-5 text-primary-foreground" />
                      ) : (
                        <div className="h-5 w-5" />
                      )}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-medium cursor-pointer hover:text-primary transition-colors truncate ${habit.completedToday ? "line-through text-muted-foreground" : ""
                          }`}
                        onClick={() => handleHabitNameClick(habit)}
                        title={habit.name}
                      >
                        {habit.name}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                        <span>{habit.timeOfDay}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                        <span>{habit.frequency}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                        <span>{habit.streak} day{habit.streak !== 1 ? 's' : ''} streak</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                        <span className="capitalize">{habit.priority.toLowerCase()} priority</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm px-2 py-1 bg-secondary rounded-full hidden md:inline-block">
                      Impact: {habit.impactScore}/10
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Options</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => toggleHabit(habit._id, habit.completedToday)}
                          className="cursor-pointer"
                          disabled={isToggling[habit._id]}
                        >
                          {habit.completedToday ? (
                            <>
                              <X className="mr-2 h-4 w-4" />
                              Mark as incomplete
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Mark as complete
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