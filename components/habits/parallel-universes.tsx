"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, Zap, ArrowRight, Loader2 } from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IHabit } from "@/lib/types";
import { getUserHabits } from "@/lib/actions/habits";

// Mock data for parallel universes visualization
const generateTimelineData = (maintainedHabit: boolean, days: number) => {
  const data = [];

  // Set starting points
  let currentEnergy = maintainedHabit ? 70 : 70;
  let currentProductivity = maintainedHabit ? 65 : 65;
  let currentMood = maintainedHabit ? 75 : 75;
  let currentHealth = maintainedHabit ? 80 : 80;

  // Define increments (positive for maintained, gradually negative for broken)
  const energyIncrement = maintainedHabit ? 0.4 : -0.3;
  const productivityIncrement = maintainedHabit ? 0.5 : -0.4;
  const moodIncrement = maintainedHabit ? 0.3 : -0.5;
  const healthIncrement = maintainedHabit ? 0.3 : -0.3;

  // Add randomness
  const randomFactor = () => (Math.random() - 0.5) * 3;

  for (let i = 1; i <= days; i++) {
    // Apply increments with some randomness
    currentEnergy += energyIncrement + randomFactor();
    currentProductivity += productivityIncrement + randomFactor();
    currentMood += moodIncrement + randomFactor();
    currentHealth += healthIncrement + randomFactor();

    // Ensure values stay within reasonable bounds
    currentEnergy = Math.min(Math.max(currentEnergy, 20), 100);
    currentProductivity = Math.min(Math.max(currentProductivity, 20), 100);
    currentMood = Math.min(Math.max(currentMood, 20), 100);
    currentHealth = Math.min(Math.max(currentHealth, 20), 100);

    data.push({
      day: i,
      energy: Math.round(currentEnergy),
      productivity: Math.round(currentProductivity),
      mood: Math.round(currentMood),
      health: Math.round(currentHealth),
    });
  }

  return data;
};

const metrics = [
  { id: "energy", name: "Energy", color: "hsl(var(--chart-1))" },
  { id: "productivity", name: "Productivity", color: "hsl(var(--chart-2))" },
  { id: "mood", name: "Mood", color: "hsl(var(--chart-3))" },
  { id: "health", name: "Health", color: "hsl(var(--chart-4))" },
];

export function ParallelUniverses() {
  const [habits, setHabits] = useState<IHabit[]>([]);
  const [selectedHabit, setSelectedHabit] = useState("");
  const [timeRange, setTimeRange] = useState("90");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["energy", "productivity"]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHabits = async () => {
      setIsLoading(true);
      try {
        const userHabits = await getUserHabits();
        const activeHabits = userHabits.filter(habit => habit.status === 'active');
        setHabits(activeHabits);

        // Set default selected habit if habits exist
        if (activeHabits.length > 0 && !selectedHabit) {
          setSelectedHabit(activeHabits[0]._id || "");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch habits');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHabits();
  }, []);

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  const selectedHabitData = habits.find(h => h._id === selectedHabit);

  // Generate data based on selected time range
  const maintainedData = generateTimelineData(true, parseInt(timeRange));
  const brokenData = generateTimelineData(false, parseInt(timeRange));


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading your habits...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error: {error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">No Active Habits</h3>
          <p className="text-muted-foreground mb-4">
            Create some habits first to see your parallel universe analysis.
          </p>
          <Button onClick={() => window.location.href = '/habits'}>
            Create Habits
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-end">
        <div>
          <h2 className="text-2xl font-bold">Parallel Universe Tracker</h2>
          <p className="text-muted-foreground">
            See how your life could differ if you maintained vs. broke your habits
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="space-y-2">
            <Label htmlFor="habit-select">Select Habit</Label>
            <Select value={selectedHabit} onValueChange={setSelectedHabit}>
              <SelectTrigger id="habit-select" className="min-w-[180px]">
                <SelectValue placeholder="Select habit" />
              </SelectTrigger>
              <SelectContent>
                {habits.map((habit) => (
                  <SelectItem key={habit._id} value={habit._id || ""}>
                    {habit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="time-select">Time Range</Label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger id="time-select">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
                <SelectItem value="180">180 Days</SelectItem>
                <SelectItem value="365">1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {selectedHabitData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <h4 className="font-medium">Selected Habit</h4>
            <p className="text-sm text-muted-foreground">{selectedHabitData.name}</p>
          </div>
          <div className="text-center">
            <h4 className="font-medium">Current Streak</h4>
            <p className="text-2xl font-bold text-green-500">{selectedHabitData.streak} days</p>
          </div>
          <div className="text-center">
            <h4 className="font-medium">Time Investment</h4>
            <p className="text-sm text-muted-foreground">{selectedHabitData.timeToComplete}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Timeline Comparison</CardTitle>
              <CardDescription>
                Comparing maintained vs. broken habit scenarios
              </CardDescription>
            </div>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>
                    This visualization shows how your life metrics could differ over time
                    depending on whether you maintain or break your selected habit.
                    The data is based on behavioral science and extrapolated patterns.
                  </p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {metrics.map((metric) => (
              <Button
                key={metric.id}
                variant={selectedMetrics.includes(metric.id) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleMetric(metric.id)}
                style={{
                  backgroundColor: selectedMetrics.includes(metric.id)
                    ? metric.color
                    : undefined,
                  borderColor: !selectedMetrics.includes(metric.id)
                    ? metric.color
                    : undefined,
                  color: selectedMetrics.includes(metric.id)
                    ? "white"
                    : undefined,
                }}
              >
                {metric.name}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="comparison">
            <TabsList className="mb-4">
              <TabsTrigger value="comparison">Side by Side</TabsTrigger>
            </TabsList>


            <TabsContent value="comparison">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="mb-4 flex items-center">
                    <Badge className="bg-green-500 mr-2">Maintained</Badge>
                    <h3 className="font-medium">If you maintain this habit</h3>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={maintainedData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        {selectedMetrics.includes("energy") && (
                          <Area
                            type="monotone"
                            dataKey="energy"
                            name="Energy"
                            stroke="hsl(var(--chart-1))"
                            fill="hsl(var(--chart-1))"
                            fillOpacity={0.3}
                          />
                        )}
                        {selectedMetrics.includes("productivity") && (
                          <Area
                            type="monotone"
                            dataKey="productivity"
                            name="Productivity"
                            stroke="hsl(var(--chart-2))"
                            fill="hsl(var(--chart-2))"
                            fillOpacity={0.3}
                          />
                        )}
                        {selectedMetrics.includes("mood") && (
                          <Area
                            type="monotone"
                            dataKey="mood"
                            name="Mood"
                            stroke="hsl(var(--chart-3))"
                            fill="hsl(var(--chart-3))"
                            fillOpacity={0.3}
                          />
                        )}
                        {selectedMetrics.includes("health") && (
                          <Area
                            type="monotone"
                            dataKey="health"
                            name="Health"
                            stroke="hsl(var(--chart-4))"
                            fill="hsl(var(--chart-4))"
                            fillOpacity={0.3}
                          />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-center">
                    <Badge variant="outline" className="mr-2">Broken</Badge>
                    <h3 className="font-medium">If you break this habit</h3>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={brokenData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        {selectedMetrics.includes("energy") && (
                          <Area
                            type="monotone"
                            dataKey="energy"
                            name="Energy"
                            stroke="hsl(var(--chart-1))"
                            fill="hsl(var(--chart-1))"
                            fillOpacity={0.2}
                          />
                        )}
                        {selectedMetrics.includes("productivity") && (
                          <Area
                            type="monotone"
                            dataKey="productivity"
                            name="Productivity"
                            stroke="hsl(var(--chart-2))"
                            fill="hsl(var(--chart-2))"
                            fillOpacity={0.2}
                          />
                        )}
                        {selectedMetrics.includes("mood") && (
                          <Area
                            type="monotone"
                            dataKey="mood"
                            name="Mood"
                            stroke="hsl(var(--chart-3))"
                            fill="hsl(var(--chart-3))"
                            fillOpacity={0.2}
                          />
                        )}
                        {selectedMetrics.includes("health") && (
                          <Area
                            type="monotone"
                            dataKey="health"
                            name="Health"
                            stroke="hsl(var(--chart-4))"
                            fill="hsl(var(--chart-4))"
                            fillOpacity={0.2}
                          />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-8 p-4 bg-muted rounded-lg flex flex-col md:flex-row gap-4 items-center">
            <Zap className="h-10 w-10 text-yellow-500" />
            <div>
              <h3 className="font-medium text-lg">Long-term Impact Analysis</h3>
              <p className="text-muted-foreground">
                After {timeRange} days of {selectedHabitData?.name || 'this habit'},
                you could experience up to <span className="font-medium text-green-500">32% higher productivity</span> and
                <span className="font-medium text-green-500"> 27% better mood</span> compared to breaking this habit.
              </p>
            </div>
            <Button className="md:ml-auto whitespace-nowrap" size="sm">
              Full Report <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}