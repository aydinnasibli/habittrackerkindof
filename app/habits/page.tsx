"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import React, { useState, useCallback } from "react";
import dynamic from "next/dynamic";

// Dynamically import heavy client components
const HabitList = dynamic(() => import("@/components/habits/habit-list").then(mod => ({ default: mod.HabitList })), {
  ssr: false,
  loading: () => <ComponentLoading />
});

const HabitChains = dynamic(() => import("@/components/habits/habit-chains").then(mod => ({ default: mod.HabitChains })), {
  ssr: false,
  loading: () => <ComponentLoading />
});

const ParallelUniverses = dynamic(() => import("@/components/habits/parallel-universes").then(mod => ({ default: mod.ParallelUniverses })), {
  ssr: false,
  loading: () => <ComponentLoading />
});

const PastSessions = dynamic(() => import("@/components/habits/past-sessions").then(mod => ({ default: mod.PastSessions })), {
  ssr: false,
  loading: () => <ComponentLoading />
});

// Lightweight component loading placeholder
const ComponentLoading = () => (
  <div className="flex items-center justify-center py-12">
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="w-8 h-8 border-2 border-border rounded-full">
          <div className="absolute inset-0 border-2 border-transparent border-t-primary rounded-full animate-spin" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Loading component...</p>
    </div>
  </div>
);

// Main loading screen (now renders faster without heavy components)
const LoadingScreen = () => (
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

export default function HabitsPage() {
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Callback to handle when habits are loaded
  const handleHabitsLoaded = useCallback(() => {
    setIsPageLoaded(true);
  }, []);

  // Show loading screen initially - now renders much faster
  if (!isPageLoaded) {
    return (
      <>
        <LoadingScreen />

      </>
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
          <HabitList onLoadingComplete={handleHabitsLoaded} showInternalLoading={false} />
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