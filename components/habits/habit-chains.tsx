"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Plus, X, Settings, Play, MoreHorizontal, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
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
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { IHabit, IHabitChain, IChainSession } from "@/lib/types";
import {
  getUserHabits,
  getUserHabitChains,
  createHabitChain,
  deleteHabitChain
} from "@/lib/actions/habits";
import {
  startHabitChain,
  getActiveChainSession,
  abandonChainSession
} from "@/lib/actions/chainSessions";
import { ChainSession } from "./chain-session"; // Import your existing component

export function HabitChains() {
  const [chains, setChains] = useState<IHabitChain[]>([]);
  const [habits, setHabits] = useState<IHabit[]>([]);
  const [activeSession, setActiveSession] = useState<IChainSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showSession, setShowSession] = useState(false); // New state to control session view

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

  // Auto-show session if there's an active one on load
  useEffect(() => {
    if (activeSession && !showSession) {
      // Optionally auto-show the session, or let user manually navigate to it
      // setShowSession(true);
    }
  }, [activeSession]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [chainsData, habitsData, activeSessionData] = await Promise.all([
        getUserHabitChains(),
        getUserHabits(),
        getActiveChainSession()
      ]);
      setChains(chainsData);
      setHabits(habitsData.filter(h => h.status === 'active'));
      setActiveSession(activeSessionData);
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

  const handleStartChain = async (chainId: string) => {
    if (!chainId) {
      toast({
        title: "Error",
        description: "Invalid chain ID",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(chainId);
    try {
      const result = await startHabitChain(chainId);

      if (result.success) {
        // Refresh data to get the new active session
        await loadData();

        const chain = chains.find(c => c._id === chainId);
        toast({
          title: "🚀 Chain Started!",
          description: `${chain?.name} is now active. Let's build those habits!`,
        });

        // Automatically show the session view
        setShowSession(true);
      } else {
        if (result.activeSessionId) {
          toast({
            title: "Active Session Found",
            description: result.error,
            variant: "destructive"
          });
        } else {
          throw new Error(result.error);
        }
      }
    } catch (error) {
      console.error('Error starting chain:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start chain. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleAbandonActiveSession = async () => {
    if (!activeSession?._id) return;

    setActionLoading('abandon');
    try {
      const result = await abandonChainSession(activeSession._id);

      if (result.success) {
        await loadData();
        setShowSession(false); // Hide session view
        toast({
          title: "Session Ended",
          description: "That's okay! Every attempt makes you stronger. Try again when you're ready!",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error abandoning session:', error);
      toast({
        title: "Error",
        description: "Failed to abandon session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleGoToSession = () => {
    if (activeSession) {
      setShowSession(true);
    }
  };

  const handleSessionEnd = async () => {
    // Called when session completes or is abandoned from within ChainSession component
    setShowSession(false);
    await loadData(); // Refresh to update active session state
  };

  const deleteChain = async (chainId: string) => {
    if (!chainId) return;

    if (activeSession && activeSession.chainId === chainId) {
      toast({
        title: "Cannot Delete",
        description: "Cannot delete a chain that has an active session. Please complete or abandon the session first.",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(chainId);
    try {
      const result = await deleteHabitChain(chainId);
      if (result.success) {
        await loadData();
        toast({
          title: "Chain Deleted",
          description: "The habit chain has been removed.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting chain:', error);
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
        .map((habit, newIndex) => ({ ...habit, order: newIndex }))
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
        await loadData();
        setCreateDialogOpen(false);
        setFormData({
          name: "",
          description: "",
          timeOfDay: "",
          selectedHabits: []
        });
        toast({
          title: "🎉 Chain Created!",
          description: "Your habit chain is ready to start building amazing habits!",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating chain:', error);
      toast({
        title: "Error",
        description: "Failed to create chain. Please try again.",
        variant: "destructive"
      });
    }
  };

  const isChainStartDisabled = (chainId: string) => {
    return !!activeSession || actionLoading === chainId;
  };

  const getChainStartButtonText = (chainId: string) => {
    if (actionLoading === chainId) return "Starting...";
    if (activeSession && activeSession.chainId === chainId) return "Currently Active";
    if (activeSession) return "Another Chain Active";
    return "Start Chain";
  };

  // Show session view if requested and there's an active session
  if (showSession && activeSession) {
    return (
      <div className="space-y-6">
        {/* Back to chains button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setShowSession(false)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Chains
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Chain Session</h1>
            <p className="text-muted-foreground">Stay focused and build your habits!</p>
          </div>
        </div>

        {/* Render the ChainSession component */}
        <ChainSession
          initialSession={activeSession}
          onSessionEnd={handleSessionEnd}
        />
      </div>
    );
  }

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
      {/* Dark Active Session Alert */}
      {activeSession && (
        <Alert className="border-emerald-800 bg-emerald-950/50">
          <AlertCircle className="h-4 w-4 text-emerald-400" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="font-medium text-emerald-100">
                🔥 Active Chain: <strong className="text-white">{activeSession.chainName}</strong>
              </span>
              <div className="text-sm text-emerald-200 mt-1">
                Progress: {activeSession.habits.filter(h => h.status === 'completed').length} of {activeSession.totalHabits} habits completed
                {activeSession.onBreak && " • Currently on break ☕"}
                {activeSession.pausedAt && " • Currently paused ⏸️"}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoToSession}
                className="border-emerald-700 hover:bg-emerald-900"
              >
                🎯 Continue Session
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAbandonActiveSession}
                disabled={actionLoading === 'abandon'}
                className="border-red-800 hover:bg-red-900"
              >
                {actionLoading === 'abandon' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "End Session"
                )}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Habit Chains</h2>
          <p className="text-muted-foreground">
            Create sequences of habits that trigger each other for maximum momentum
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!!activeSession} className="hover:bg-primary/90">
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
                    placeholder="e.g., Morning Power Hour"
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
                      <SelectItem value="Morning">🌅 Morning</SelectItem>
                      <SelectItem value="Afternoon">☀️ Afternoon</SelectItem>
                      <SelectItem value="Evening">🌆 Evening</SelectItem>
                      <SelectItem value="Night">🌙 Night</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chain-description">Description</Label>
                <Textarea
                  id="chain-description"
                  placeholder="Describe what this chain helps you achieve..."
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
                        <span className="text-sm font-medium w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <span className="font-medium">{habit.habitName}</span>
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
                    <div className="text-sm text-muted-foreground bg-muted p-2 rounded text-center">
                      💡 Total estimated time: <strong>{calculateTotalTime()} minutes</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateChain}>
                🚀 Create Chain
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {chains.length === 0 ? (
        <Card className="border-muted">
          <CardContent className="text-center py-12">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Ready to Build Powerful Habits?</h3>
            <p className="text-muted-foreground mb-6">
              Create your first habit chain and start building momentum that compounds!
            </p>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              disabled={!!activeSession}
              size="lg"
            >
              <Plus className="mr-2 h-4 w-4" /> Create Your First Chain
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {chains.map((chain) => (
            <Card key={chain._id} className={`overflow-hidden transition-all hover:shadow-lg ${activeSession && activeSession.chainId === chain._id
              ? 'ring-2 ring-emerald-500 bg-emerald-950/20'
              : 'hover:border-primary/50'
              }`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {chain.name}
                      {activeSession && activeSession.chainId === chain._id && (
                        <Badge className="bg-emerald-600 hover:bg-emerald-700">
                          🔥 Active
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">{chain.description}</CardDescription>
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
                      <DropdownMenuLabel>Chain Options</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleStartChain(chain._id!)}
                        disabled={isChainStartDisabled(chain._id!)}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        {getChainStartButtonText(chain._id!)}
                      </DropdownMenuItem>
                      {activeSession && activeSession.chainId === chain._id && (
                        <DropdownMenuItem onClick={handleGoToSession}>
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Go to Session
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem disabled>
                        <Settings className="mr-2 h-4 w-4" /> Edit Chain
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => deleteChain(chain._id!)}
                        className="text-red-400 hover:text-red-300"
                        disabled={activeSession?.chainId === chain._id}
                      >
                        <X className="mr-2 h-4 w-4" /> Delete Chain
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center justify-between">
                  <Badge variant="outline" className="font-medium">
                    {chain.timeOfDay === 'Morning' && '🌅'}
                    {chain.timeOfDay === 'Afternoon' && '☀️'}
                    {chain.timeOfDay === 'Evening' && '🌆'}
                    {chain.timeOfDay === 'Night' && '🌙'}
                    {chain.timeOfDay}
                  </Badge>
                  <span className="text-sm font-medium text-muted-foreground">
                    📊 {chain.totalTime}
                  </span>
                </div>

                <div className="space-y-2 mb-6">
                  {chain.habits.map((habit, index) => (
                    <div key={`${habit.habitId}-${index}`} className="flex items-center">
                      {index > 0 && (
                        <div className="h-14 w-6 flex items-center justify-center mr-2">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      {index === 0 && <div className="w-8" />}
                      <div className="flex-1 p-3 bg-muted/50 rounded-md border border-border">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{habit.habitName}</span>
                          <Badge variant="secondary">
                            ⏱️ {habit.duration}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Button
                    className={`w-full ${activeSession && activeSession.chainId === chain._id
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : ""
                      }`}
                    onClick={() => activeSession && activeSession.chainId === chain._id ? handleGoToSession() : handleStartChain(chain._id!)}
                    disabled={isChainStartDisabled(chain._id!) && !(activeSession && activeSession.chainId === chain._id)}
                    size="lg"
                  >
                    {actionLoading === chain._id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : activeSession && activeSession.chainId === chain._id ? (
                      <>
                        <AlertCircle className="mr-2 h-4 w-4" />
                        🎯 Continue Session
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        🚀 Start Chain
                      </>
                    )}
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