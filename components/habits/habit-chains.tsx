"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Plus, X, Settings, Play, MoreHorizontal } from "lucide-react";
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

// Mock data for habit chains
const mockChains = [
  {
    id: "1",
    name: "Morning Routine",
    description: "Start the day right",
    habits: [
      { id: "1", name: "Meditation", duration: "10 min" },
      { id: "2", name: "Exercise", duration: "30 min" },
      { id: "3", name: "Breakfast", duration: "15 min" },
    ],
    timeOfDay: "Morning",
    totalTime: "55 min",
  },
  {
    id: "2",
    name: "Evening Wind-Down",
    description: "Relax and prepare for sleep",
    habits: [
      { id: "4", name: "Reading", duration: "30 min" },
      { id: "5", name: "Journaling", duration: "15 min" },
      { id: "6", name: "Stretch", duration: "10 min" },
    ],
    timeOfDay: "Evening",
    totalTime: "55 min",
  },
  {
    id: "3",
    name: "Workday Productivity",
    description: "Stay focused and effective",
    habits: [
      { id: "7", name: "Plan Day", duration: "10 min" },
      { id: "8", name: "Deep Work", duration: "90 min" },
      { id: "9", name: "Review", duration: "15 min" },
    ],
    timeOfDay: "Work Hours",
    totalTime: "115 min",
  },
];

export function HabitChains() {
  const [chains, setChains] = useState(mockChains);
  const { toast } = useToast();

  const startChain = (chainId: string) => {
    toast({
      title: "Chain Initiated",
      description: `Starting the ${chains.find(c => c.id === chainId)?.name} chain now.`,
    });
  };

  const deleteChain = (chainId: string) => {
    setChains(chains.filter(chain => chain.id !== chainId));
    toast({
      title: "Chain Deleted",
      description: "The habit chain has been removed.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Habit Chains</h2>
          <p className="text-muted-foreground">
            Create sequences of habits that trigger each other
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Chain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Habit Chain</DialogTitle>
              <DialogDescription>
                Build a sequence of habits that will trigger each other automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                This feature will be available soon!
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Create Chain</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {chains.map((chain) => (
          <Card key={chain.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{chain.name}</CardTitle>
                  <CardDescription>{chain.description}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => startChain(chain.id)}>
                      <Play className="mr-2 h-4 w-4" /> Start Chain
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" /> Edit Chain
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => deleteChain(chain.id)}>
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
                  <div key={habit.id} className="flex items-center">
                    {index > 0 && (
                      <div className="h-14 w-6 flex items-center justify-center mr-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    {index === 0 && <div className="w-8" />}
                    <div className="flex-1 p-3 bg-muted rounded-md">
                      <div className="flex justify-between items-center">
                        <span>{habit.name}</span>
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
                  onClick={() => startChain(chain.id)}
                >
                  <Play className="mr-2 h-4 w-4" /> Start Chain
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}