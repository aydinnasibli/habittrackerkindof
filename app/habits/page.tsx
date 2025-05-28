import { HabitList } from "@/components/habits/habit-list";
import { HabitChains } from "@/components/habits/habit-chains";
import { ParallelUniverses } from "@/components/habits/parallel-universes";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default function HabitsPage() {
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
          <TabsTrigger value="universes">Parallel Universes</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <HabitList />
        </TabsContent>

        <TabsContent value="chains">
          <HabitChains />
        </TabsContent>

        <TabsContent value="universes">
          <ParallelUniverses />
        </TabsContent>
      </Tabs>
    </div>
  );
}