"use client";

import { useState } from "react";
import { Check, X, MoreHorizontal, Zap } from "lucide-react";
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

// Mock data for habits
const mockHabits = [
  {
    id: "1",
    name: "Morning Meditation",
    streak: 21,
    completed: false,
    time: "07:00 AM",
    impact: 8.5,
  },
  {
    id: "2",
    name: "Drink Water",
    streak: 15,
    completed: true,
    time: "Throughout day",
    impact: 7.8,
  },
  {
    id: "3",
    name: "Read for 30 minutes",
    streak: 8,
    completed: false,
    time: "09:00 PM",
    impact: 9.2,
  },
  {
    id: "4",
    name: "Exercise",
    streak: 12,
    completed: false,
    time: "06:00 PM",
    impact: 9.5,
  },
];

export function HabitOverview() {
  const [habits, setHabits] = useState(mockHabits);
  const { toast } = useToast();

  const toggleHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id === id) {
          const newStatus = !habit.completed;
          
          // Show toast for completion
          if (newStatus) {
            toast({
              title: "Habit completed!",
              description: `You've completed "${habit.name}". Keep it up!`,
            });
            
            // Check for chain reaction
            if (habit.id === "1") {
              setTimeout(() => {
                toast({
                  title: "Chain Reaction!",
                  description: "Consider drinking water next - it pairs well with meditation!",
                  action: (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={() => {
                        setHabits((prev) =>
                          prev.map((h) => h.id === "2" ? { ...h, completed: true } : h)
                        );
                      }}
                    >
                      <Zap className="h-3 w-3" />
                      Do it now
                    </Button>
                  ),
                });
              }, 1000);
            }
          }
          
          return { ...habit, completed: newStatus };
        }
        return habit;
      })
    );
  };

  const completedCount = habits.filter((habit) => habit.completed).length;
  const completionPercentage = (completedCount / habits.length) * 100;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">Today's Habits</CardTitle>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            {completedCount} of {habits.length} completed
          </div>
          <Progress value={completionPercentage} className="w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className={`p-4 border rounded-lg flex items-center justify-between group ${
                habit.completed
                  ? "bg-muted/30 border-muted"
                  : "bg-card border-border"
              }`}
            >
              <div className="flex items-center gap-4">
                <Button
                  size="icon"
                  variant={habit.completed ? "default" : "outline"}
                  className={`h-10 w-10 rounded-full transition-colors ${
                    habit.completed ? "bg-primary" : ""
                  }`}
                  onClick={() => toggleHabit(habit.id)}
                >
                  {habit.completed ? (
                    <Check className="h-5 w-5 text-primary-foreground" />
                  ) : (
                    <div className="h-5 w-5" />
                  )}
                </Button>
                <div>
                  <div
                    className={`font-medium ${
                      habit.completed ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {habit.name}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>{habit.time}</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                    <span>{habit.streak} day streak</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm px-2 py-1 bg-secondary rounded-full hidden md:inline-block">
                  Impact: {habit.impact}/10
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => toggleHabit(habit.id)}
                      className="cursor-pointer"
                    >
                      {habit.completed ? (
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
                    <DropdownMenuItem className="cursor-pointer">
                      Edit habit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      View details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}