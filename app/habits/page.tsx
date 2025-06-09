"use client";

import { HabitList } from "@/components/habits/habit-list";
import { HabitChains } from "@/components/habits/habit-chains";
import { ParallelUniverses } from "@/components/habits/parallel-universes";
import { PastSessions } from "@/components/habits/past-sessions";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import React, { useState, useEffect } from "react";

export default function HabitsPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Delay the page render by 1 second to show global loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Show loading state while delayed
  if (isLoading) {
    // Import and use your Loading component directly
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-8 p-8">
          <div className="relative">
            <div className="w-16 h-16 border-3 border-border rounded-full">
              <div className="absolute inset-0 border-3 border-transparent border-t-primary rounded-full animate-spin" />
            </div>
            <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-primary rounded-full animate-pulse" />
            <div className="absolute -inset-2 border border-primary/20 rounded-full animate-ping" />
          </div>
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <h1 className="text-2xl font-semibold text-foreground">Loading</h1>
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1 h-1 bg-primary rounded-full animate-bounce"
                    style={{
                      animationDelay: `${i * 0.15}s`,
                      animationDuration: '0.8s'
                    }}
                  />
                ))}
              </div>
            </div>
            <p className="text-muted-foreground text-sm max-w-sm">
              Preparing your habits dashboard...
            </p>
          </div>
          <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Habits</h1>
          <p className="text-muted-foreground text-lg">
            Manage, track, and analyze your habits
          </p>
        </div>
        <Button asChild>
          <Link href="/habits/new">
            <Plus className="mr-2 h-4 w-4" /> Add New Habit
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-8">
        <TabsList>
          <TabsTrigger value="all">All Habits</TabsTrigger>
          <TabsTrigger value="chains">Habit Chains</TabsTrigger>
          <TabsTrigger value="sessions">Past Sessions</TabsTrigger>
          <TabsTrigger value="universes">Parallel Universes</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <HabitList />
        </TabsContent>

        <TabsContent value="chains">
          <HabitChains />
        </TabsContent>

        <TabsContent value="sessions">
          <PastSessions />
        </TabsContent>

        <TabsContent value="universes">
          <ParallelUniverses />
        </TabsContent>
      </Tabs>
    </div>
  );
}