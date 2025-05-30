"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Plus, X, Settings, Play, MoreHorizontal, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { IHabit, IHabitChain } from "@/lib/types";
import {
  getUserHabits,
  getUserHabitChains,
  createHabitChain,
  deleteHabitChain
} from "@/lib/actions/habits";

export function HabitChains() {
  const [chains, setChains] = useState<IHabitChain[]>([]);
  const [habits, setHabits] = useState<IHabit[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Form state for creating new chain
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    timeOfDay: "",
    selectedHabits: [] as { habitId: string; habitName: string; duration: string; order: number }[]
  });

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [chainsData, habitsData] = await Promise.all([
        getUserHabitChains(),
        getUserHabits()
      ]);
      setChains(chainsData);
      setHabits(habitsData.filter(h => h.status === 'active')); // Only show active habits for chain creation
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startChain = (chainId: string) => {
    const chain = chains.find(c => c._id === chainId);
    toast({
      title: "Chain Initiated",
      description: `Starting the ${chain?.name} chain now.`,
    });
    // Here you would implement the logic to actually start the chain
    // This could involve creating a session, setting timers, etc.
  };

  const deleteChain = async (chainId: string) => {
    setActionLoading(chainId);
    try {
      const result = await deleteHabitChain(chainId);
      if (result.success) {
        await loadData(); // Refresh the list
        toast({
          title: "Chain Deleted",
          description: "The habit chain has been removed.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete chain. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const addHabitToChain = (habitId: string) => {
    const habit = habits.find(h => h._id === habitId);
    if (!habit) return;

    const newHabit = {
      habitId: habit._id!,
      habitName: habit.name,
      duration: habit.timeToComplete,
      order: formData.selectedHabits.length
    };

    setFormData(prev => ({
      ...prev,
      selectedHabits: [...prev.selectedHabits, newHabit]
    }));
  };

  const removeHabitFromChain = (index: number) => {
    setFormData(prev => ({
      ...prev,
      selectedHabits: prev.selectedHabits.filter((_, i) => i !== index)
    }));
  };

  const calculateTotalTime = () => {
    return formData.selectedHabits.reduce((total, habit) => {
      const minutes = parseInt(habit.duration.match(/\d+/)?.[0] || "0");
      return total + minutes;
    }, 0);
  };

  const handleCreateChain = async () => {
    if (!formData.name.trim() || !formData.description.trim() || !formData.timeOfDay || formData.selectedHabits.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all fields and add at least one habit.",
        variant: "destructive"
      });
      return;
    }

    try {
      const totalMinutes = calculateTotalTime();
      const totalTime = `${totalMinutes} min`;

      const result = await createHabitChain({
        name: formData.name,
        description: formData.description,
        habits: formData.selectedHabits,
        timeOfDay: formData.timeOfDay,
        totalTime
      });

      if (result.success) {
        await loadData(); // Refresh the list
        setCreateDialogOpen(false);
        setFormData({
          name: "",
          description: "",
          timeOfDay: "",
          selectedHabits: []
        });
        toast({
          title: "Chain Created",
          description: "Your habit chain has been created successfully.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create chain. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading habit chains...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Habit Chains</h2>
          <p className="text-muted-foreground">
            Create sequences of habits that trigger each other
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Chain
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Habit Chain</DialogTitle>
              <DialogDescription>
                Build a sequence of habits that will trigger each other automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chain-name">Chain Name</Label>
                  <Input
                    id="chain-name"
                    placeholder="e.g., Morning Routine"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time-of-day">Time of Day</Label>
                  <Select value={formData.timeOfDay} onValueChange={(value) => setFormData(prev => ({ ...prev, timeOfDay: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Morning">Morning</SelectItem>
                      <SelectItem value="Afternoon">Afternoon</SelectItem>
                      <SelectItem value="Evening">Evening</SelectItem>
                      <SelectItem value="Night">Night</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chain-description">Description</Label>
                <Textarea
                  id="chain-description"
                  placeholder="Describe what this chain helps you achieve"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Add Habits to Chain</Label>
                  <Select onValueChange={addHabitToChain}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select habit" />
                    </SelectTrigger>
                    <SelectContent>
                      {habits
                        .filter(habit => !formData.selectedHabits.some(sh => sh.habitId === habit._id))
                        .map((habit) => (
                          <SelectItem key={habit._id} value={habit._id!}>
                            {habit.name} ({habit.timeToComplete})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.selectedHabits.length > 0 && (
                  <div className="space-y-2">
                    {formData.selectedHabits.map((habit, index) => (
                      <div key={habit.habitId} className="flex items-center gap-2 p-3 bg-muted rounded-md">
                        <span className="text-sm font-medium">{index + 1}.</span>
                        <div className="flex-1">
                          <span>{habit.habitName}</span>
                          <Badge variant="secondary" className="ml-2">{habit.duration}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeHabitFromChain(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="text-sm text-muted-foreground">
                      Total estimated time: {calculateTotalTime()} minutes
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateChain}>Create Chain</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {chains.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              You haven't created any habit chains yet.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Your First Chain
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {chains.map((chain) => (
            <Card key={chain._id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{chain.name}</CardTitle>
                    <CardDescription>{chain.description}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={actionLoading === chain._id}
                      >
                        {actionLoading === chain._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Options</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => startChain(chain._id!)}>
                        <Play className="mr-2 h-4 w-4" /> Start Chain
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" /> Edit Chain
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => deleteChain(chain._id!)}
                        className="text-red-600"
                      >
                        <X className="mr-2 h-4 w-4" /> Delete Chain
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center justify-between">
                  <Badge variant="outline">{chain.timeOfDay}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Total: {chain.totalTime}
                  </span>
                </div>

                <div className="space-y-2">
                  {chain.habits.map((habit, index) => (
                    <div key={`${habit.habitId}-${index}`} className="flex items-center">
                      {index > 0 && (
                        <div className="h-14 w-6 flex items-center justify-center mr-2">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      {index === 0 && <div className="w-8" />}
                      <div className="flex-1 p-3 bg-muted rounded-md">
                        <div className="flex justify-between items-center">
                          <span>{habit.habitName}</span>
                          <Badge variant="secondary">{habit.duration}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => startChain(chain._id!)}
                  >
                    <Play className="mr-2 h-4 w-4" /> Start Chain
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}