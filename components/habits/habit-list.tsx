"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Search,
  ListFilter,
  Calendar,
  Clock,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

// Mock data for habits
const initialHabits = [
  {
    id: "1",
    name: "Morning Meditation",
    category: "Mindfulness",
    frequency: "Daily",
    streak: 21,
    timeOfDay: "Morning",
    timeToComplete: "10 min",
    priority: "High",
    status: "active",
  },
  {
    id: "2",
    name: "Exercise",
    category: "Health",
    frequency: "Mon, Wed, Fri",
    streak: 12,
    timeOfDay: "Evening",
    timeToComplete: "45 min",
    priority: "High",
    status: "active",
  },
  {
    id: "3",
    name: "Read",
    category: "Learning",
    frequency: "Daily",
    streak: 8,
    timeOfDay: "Evening",
    timeToComplete: "30 min",
    priority: "Medium",
    status: "active",
  },
  {
    id: "4",
    name: "Drink Water",
    category: "Health",
    frequency: "Daily",
    streak: 15,
    timeOfDay: "Throughout day",
    timeToComplete: "1 min",
    priority: "Medium",
    status: "active",
  },
  {
    id: "5",
    name: "Journal",
    category: "Mindfulness",
    frequency: "Daily",
    streak: 5,
    timeOfDay: "Evening",
    timeToComplete: "15 min",
    priority: "Low",
    status: "active",
  },
  {
    id: "6",
    name: "No Social Media",
    category: "Digital Wellbeing",
    frequency: "Weekdays",
    streak: 0,
    timeOfDay: "All day",
    timeToComplete: "All day",
    priority: "Medium",
    status: "paused",
  }
];

export function HabitList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [habits, setHabits] = useState(() => {
    // Try to get habits from localStorage
    const savedHabits = localStorage.getItem("habits");
    return savedHabits ? JSON.parse(savedHabits) : initialHabits;
  });
  const { toast } = useToast();
  const router = useRouter();

  // Save habits to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem("habits", JSON.stringify(habits));
  }, [habits]);

  // Filter habits based on search and tab
  const filterHabits = (status: string) => {
    return habits
      .filter(habit => 
        habit.status === status && 
        (habit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         habit.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
  };

  const handleArchiveHabit = (id: string) => {
    setHabits(habits.map(habit => 
      habit.id === id ? { ...habit, status: "archived" } : habit
    ));
    toast({
      title: "Habit archived",
      description: "You can still view this habit in the archived tab."
    });
  };

  const handlePauseHabit = (id: string) => {
    setHabits(habits.map(habit => 
      habit.id === id ? { ...habit, status: habit.status === "paused" ? "active" : "paused" } : habit
    ));
    toast({
      title: habits.find(h => h.id === id)?.status === "paused" ? "Habit resumed" : "Habit paused",
      description: habits.find(h => h.id === id)?.status === "paused" ? 
        "Tracking for this habit has been resumed." : 
        "Tracking for this habit has been paused."
    });
  };

  const handleCompleteHabit = (id: string) => {
    setHabits(habits.map(habit => 
      habit.id === id ? { ...habit, streak: habit.streak + 1 } : habit
    ));
    toast({
      title: "Habit completed",
      description: "Great job! Keep up the momentum!"
    });
  };

  const handleSkipHabit = (id: string) => {
    setHabits(habits.map(habit => 
      habit.id === id ? { ...habit, streak: 0 } : habit
    ));
    toast({
      title: "Habit skipped",
      description: "Don't worry, you can start a new streak tomorrow!"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case "paused":
        return <Badge variant="outline">Paused</Badge>;
      case "archived":
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return null;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "High":
        return <ArrowUp className="h-4 w-4 text-red-500" />;
      case "Medium":
        return <Activity className="h-4 w-4 text-yellow-500" />;
      case "Low":
        return <ArrowDown className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search habits..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="sm:w-auto w-full">
          <ListFilter className="mr-2 h-4 w-4" />
          Filter
        </Button>
        <Button onClick={() => router.push('/habits/new')}>
          Add New Habit
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        
        {["active", "paused", "archived"].map((status) => (
          <TabsContent key={status} value={status}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>
                  {status === "active" ? "Active Habits" : 
                   status === "paused" ? "Paused Habits" : "Archived Habits"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filterHabits(status).length > 0 ? (
                    filterHabits(status).map((habit) => (
                      <div
                        key={habit.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-lg">{habit.name}</span>
                            {getPriorityIcon(habit.priority)}
                            <Badge variant="outline">{habit.category}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Calendar className="mr-1 h-4 w-4" />
                              {habit.frequency}
                            </div>
                            <div className="flex items-center">
                              <Clock className="mr-1 h-4 w-4" />
                              {habit.timeOfDay}
                            </div>
                            <div className="flex items-center">
                              <Activity className="mr-1 h-4 w-4" />
                              Streak: {habit.streak} days
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {status === "active" && (
                            <Badge variant="outline\" className="bg-secondary">
                              {habit.timeToComplete}
                            </Badge>
                          )}
                          {getStatusBadge(habit.status)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Options</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleCompleteHabit(habit.id)}>
                                <Check className="mr-2 h-4 w-4" /> Complete Today
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSkipHabit(habit.id)}>
                                <X className="mr-2 h-4 w-4" /> Skip Today
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handlePauseHabit(habit.id)}>
                                {habit.status === "paused" ? "Resume Habit" : "Pause Habit"}
                              </DropdownMenuItem>
                              {habit.status !== "archived" && (
                                <DropdownMenuItem onClick={() => handleArchiveHabit(habit.id)}>
                                  Archive Habit
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery ? (
                        <>
                          No {status} habits match your search.
                          <div className="mt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSearchQuery("")}
                            >
                              Clear search
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          {status === "active" 
                            ? "You don't have any active habits. Add one to get started!" 
                            : status === "paused" 
                            ? "You don't have any paused habits."
                            : "You don't have any archived habits."}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}