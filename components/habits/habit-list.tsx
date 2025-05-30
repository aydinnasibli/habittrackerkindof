"use client";

import { useEffect, useState } from "react";
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
  ArrowUp,
  ArrowDown,
  Search,
  ListFilter,
  Calendar,
  Clock,
  Activity,
  Loader2,
  Edit,
  Archive,
  Play,
  Pause,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { IHabit } from "@/lib/types";
import {
  getUserHabits,
  updateHabitStatus,
  deleteHabit
} from "@/lib/actions/habits";
import { HabitDetailModal } from "@/components/modals/habit-detail-modal";
import { HabitEditModal } from "@/components/modals/habit-edit-modal";
import { HabitFilterModal } from "@/components/modals/habit-filter-modal";

interface FilterOptions {
  categories: string[];
  priorities: string[];
  timeOfDay: string[];
  frequencies: string[];
}

export function HabitList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [habits, setHabits] = useState<IHabit[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<IHabit | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    priorities: [],
    timeOfDay: [],
    frequencies: []
  });
  const { toast } = useToast();
  const router = useRouter();

  // Load habits from database
  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      setLoading(true);
      const fetchedHabits = await getUserHabits();
      setHabits(fetchedHabits);
    } catch (error) {
      console.error('Error loading habits:', error);
      toast({
        title: "Error",
        description: "Failed to load habits. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter habits based on search, filters, and tab
  const filterHabits = (status: string) => {
    return habits
      .filter(habit => {
        // Status filter
        if (habit.status !== status) return false;

        // Search filter
        const matchesSearch = habit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          habit.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          habit.description.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        // Category filter
        if (filters.categories.length > 0 && !filters.categories.includes(habit.category)) {
          return false;
        }

        // Priority filter
        if (filters.priorities.length > 0 && !filters.priorities.includes(habit.priority)) {
          return false;
        }

        // Time of day filter
        if (filters.timeOfDay.length > 0 && !filters.timeOfDay.includes(habit.timeOfDay)) {
          return false;
        }

        // Frequency filter
        if (filters.frequencies.length > 0 && !filters.frequencies.includes(habit.frequency)) {
          return false;
        }

        return true;
      });
  };

  const handleHabitNameClick = (habit: IHabit) => {
    setSelectedHabit(habit);
    setShowDetailModal(true);
  };

  const handleEditClick = (habit: IHabit) => {
    setSelectedHabit(habit);
    setShowEditModal(true);
  };

  const handleArchiveHabit = async (id: string) => {
    setActionLoading(id);
    try {
      const result = await updateHabitStatus(id, "archived");
      if (result.success) {
        await loadHabits();
        toast({
          title: "Habit archived",
          description: "You can still view this habit in the archived tab."
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive habit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePauseHabit = async (id: string) => {
    setActionLoading(id);
    try {
      const habit = habits.find(h => h._id === id);
      const newStatus = habit?.status === "paused" ? "active" : "paused";

      const result = await updateHabitStatus(id, newStatus);
      if (result.success) {
        await loadHabits();
        toast({
          title: newStatus === "paused" ? "Habit paused" : "Habit resumed",
          description: newStatus === "paused" ?
            "Tracking for this habit has been paused." :
            "Tracking for this habit has been resumed."
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update habit status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    setActionLoading(id);
    try {
      const result = await deleteHabit(id);
      if (result.success) {
        await loadHabits();
        toast({
          title: "Habit deleted",
          description: "The habit has been permanently removed."
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete habit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
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

  const getActiveFilterCount = () => {
    return filters.categories.length +
      filters.priorities.length +
      filters.timeOfDay.length +
      filters.frequencies.length;
  };

  const clearAllFilters = () => {
    setFilters({
      categories: [],
      priorities: [],
      timeOfDay: [],
      frequencies: []
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto space-y-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading habits...</span>
        </div>
      </div>
    );
  }

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
        <Button
          variant="outline"
          className="sm:w-auto w-full"
          onClick={() => setShowFilterModal(true)}
        >
          <ListFilter className="mr-2 h-4 w-4" />
          Filter
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
              {getActiveFilterCount()}
            </Badge>
          )}
        </Button>
        {getActiveFilterCount() > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground"
          >
            Clear filters
          </Button>
        )}
        <Button onClick={() => router.push('/habits/new')}>
          Add New Habit
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">
            Active ({filterHabits("active").length})
          </TabsTrigger>
          <TabsTrigger value="paused">
            Paused ({filterHabits("paused").length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({filterHabits("archived").length})
          </TabsTrigger>
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
                        key={habit._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleHabitNameClick(habit)}
                              className="font-medium text-lg hover:text-primary cursor-pointer text-left"
                            >
                              {habit.name}
                            </button>
                            {getPriorityIcon(habit.priority)}
                            <Badge variant="outline">{habit.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{habit.description}</p>
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
                            <Badge variant="outline" className="bg-secondary">
                              {habit.timeToComplete}
                            </Badge>
                          )}
                          {getStatusBadge(habit.status)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={actionLoading === habit._id}
                              >
                                {actionLoading === habit._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEditClick(habit)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Habit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handlePauseHabit(habit._id!)}>
                                {habit.status === "paused" ? (
                                  <>
                                    <Play className="mr-2 h-4 w-4" /> Resume Habit
                                  </>
                                ) : (
                                  <>
                                    <Pause className="mr-2 h-4 w-4" /> Pause Habit
                                  </>
                                )}
                              </DropdownMenuItem>
                              {habit.status !== "archived" && (
                                <DropdownMenuItem onClick={() => handleArchiveHabit(habit._id!)}>
                                  <Archive className="mr-2 h-4 w-4" />
                                  Archive Habit
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteHabit(habit._id!)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Habit
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery || getActiveFilterCount() > 0 ? (
                        <>
                          No {status} habits match your search{getActiveFilterCount() > 0 ? ' and filters' : ''}.
                          <div className="mt-2 space-x-2">
                            {searchQuery && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSearchQuery("")}
                              >
                                Clear search
                              </Button>
                            )}
                            {getActiveFilterCount() > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={clearAllFilters}
                              >
                                Clear filters
                              </Button>
                            )}
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

      {/* Modals */}
      <HabitDetailModal
        habit={selectedHabit}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedHabit(null);
        }}
      />

      <HabitEditModal
        habit={selectedHabit}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedHabit(null);
        }}
        onUpdate={() => {
          loadHabits();
          setShowEditModal(false);
          setSelectedHabit(null);
        }}
      />

      <HabitFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onFiltersChange={setFilters}
        habits={habits}
      />
    </div>
  );
}