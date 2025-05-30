"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { PlusCircle, MinusCircle, ZoomIn, ZoomOut, RotateCcw, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { getUserHabits } from "@/lib/actions/habits";
import { IHabit } from "@/lib/types";
import * as d3 from "d3";

type HabitNode = {
  id: string;
  name: string;
  value: number;
  group: number;
  streak: number;
  category: string;
  completions: number;
};

type HabitLink = {
  source: string;
  target: string;
  value: number;
};

type HabitData = {
  nodes: HabitNode[];
  links: HabitLink[];
};

// Category mapping for grouping
const categoryGroups: Record<string, number> = {
  'Mindfulness': 1,
  'Health': 2,
  'Learning': 3,
  'Productivity': 4,
  'Digital Wellbeing': 5
};

// Function to calculate habit connections based on time overlap and category similarity
const calculateHabitConnections = (habits: IHabit[]): HabitLink[] => {
  const links: HabitLink[] = [];

  for (let i = 0; i < habits.length; i++) {
    for (let j = i + 1; j < habits.length; j++) {
      const habit1 = habits[i];
      const habit2 = habits[j];

      let connectionStrength = 0;

      // Same time of day increases connection
      if (habit1.timeOfDay === habit2.timeOfDay) {
        connectionStrength += 4;
      }

      // Same category increases connection
      if (habit1.category === habit2.category) {
        connectionStrength += 3;
      }

      // Similar frequency increases connection
      if (habit1.frequency === habit2.frequency) {
        connectionStrength += 2;
      }

      // Both high priority increases connection
      if (habit1.priority === 'High' && habit2.priority === 'High') {
        connectionStrength += 2;
      }

      // Similar streaks increase connection
      const streakDiff = Math.abs(habit1.streak - habit2.streak);
      if (streakDiff <= 3) {
        connectionStrength += Math.max(1, 3 - streakDiff);
      }

      // Add some randomness for variety
      connectionStrength += Math.random() * 2;

      if (connectionStrength > 2) {
        links.push({
          source: habit1._id!,
          target: habit2._id!,
          value: Math.min(10, Math.round(connectionStrength))
        });
      }
    }
  }

  return links;
};

export function HabitDNA() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [connectionStrength, setConnectionStrength] = useState([5]);
  const [zoom, setZoom] = useState(1);
  const [habitData, setHabitData] = useState<HabitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  // Fetch habits data using server action
  const fetchHabits = async () => {
    try {
      setLoading(true);
      setError(null);

      const habits = await getUserHabits();

      if (!habits || habits.length === 0) {
        // Create mock data if no habits exist
        const mockNodes: HabitNode[] = [
          { id: "1", name: "Morning Meditation", value: 85, group: 1, streak: 7, category: "Mindfulness", completions: 15 },
          { id: "2", name: "Exercise", value: 90, group: 2, streak: 12, category: "Health", completions: 20 },
          { id: "3", name: "Reading", value: 75, group: 3, streak: 5, category: "Learning", completions: 10 },
          { id: "4", name: "Journaling", value: 60, group: 1, streak: 3, category: "Mindfulness", completions: 8 },
          { id: "5", name: "Healthy Eating", value: 80, group: 2, streak: 8, category: "Health", completions: 16 }
        ];

        const mockLinks: HabitLink[] = [
          { source: "1", target: "2", value: 7 },
          { source: "1", target: "4", value: 8 },
          { source: "2", target: "5", value: 9 },
          { source: "3", target: "4", value: 6 }
        ];

        setHabitData({ nodes: mockNodes, links: mockLinks });
      } else {
        // Transform real habits data
        const nodes: HabitNode[] = habits.map((habit: IHabit) => ({
          id: habit._id!,
          name: habit.name,
          value: Math.max(30, Math.min(100, habit.streak * 5 + 50)), // Scale based on streak
          group: categoryGroups[habit.category] || 1,
          streak: habit.streak,
          category: habit.category,
          completions: habit.completions?.length || 0
        }));

        const links = calculateHabitConnections(habits);

        setHabitData({ nodes, links });
      }
    } catch (err) {
      console.error('Error fetching habits:', err);
      setError('Failed to load habit data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHabits();
    }
  }, [user]);

  useEffect(() => {
    if (!svgRef.current || !habitData) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = 500;

    // Filter links based on connection strength
    const filteredLinks = habitData.links.filter(
      (link) => link.value >= connectionStrength[0]
    );

    // Create a force simulation
    const simulation = d3
      .forceSimulation<HabitNode, HabitLink>(habitData.nodes as HabitNode[])
      .force(
        "link",
        d3
          .forceLink<HabitNode, HabitLink>(filteredLinks)
          .id((d) => d.id)
          .distance(120)
      )
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(60));

    const svg = d3.select(svgRef.current);

    // Apply zoom
    const zoomedG = svg
      .append("g")
      .attr("transform", `scale(${zoom})`);

    // Create links
    const link = zoomedG
      .append("g")
      .selectAll("line")
      .data(filteredLinks)
      .enter()
      .append("line")
      .attr("stroke-width", (d) => Math.sqrt(d.value))
      .attr("stroke", "hsl(var(--muted-foreground))")
      .attr("opacity", 0.6);

    // Create node groups
    const node = zoomedG
      .append("g")
      .selectAll(".node")
      .data(habitData.nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .style("cursor", "grab")
      .call(
        d3
          .drag<SVGGElement, HabitNode>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended) as any
      );

    // Add circles to nodes
    node
      .append("circle")
      .attr("r", (d) => Math.max(15, d.value / 5))
      .attr("fill", (d) => {
        const groupColors = [
          "hsl(262.1, 83.3%, 57.8%)", // Purple
          "hsl(346.8, 77.2%, 49.8%)", // Pink
          "hsl(221.2, 83.2%, 53.3%)", // Blue
          "hsl(142.1, 76.2%, 36.3%)", // Green
          "hsl(24.6, 95%, 53.1%)",    // Orange
        ];
        return groupColors[(d.group - 1) % groupColors.length];
      })
      .attr("stroke", "hsl(var(--background))")
      .attr("stroke-width", 2);

    // Add streak indicator
    node
      .append("circle")
      .attr("r", (d) => Math.max(15, d.value / 5) + 3)
      .attr("fill", "none")
      .attr("stroke", (d) => d.streak > 7 ? "#10b981" : d.streak > 3 ? "#f59e0b" : "#ef4444")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "3,3")
      .attr("opacity", 0.7);

    // Add labels to nodes
    node
      .append("text")
      .text((d) => d.name)
      .attr("x", 20)
      .attr("y", -5)
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .attr("fill", "hsl(var(--foreground))");

    // Add streak text
    node
      .append("text")
      .text((d) => `${d.streak}🔥`)
      .attr("x", 20)
      .attr("y", 10)
      .attr("font-size", "10px")
      .attr("fill", "hsl(var(--muted-foreground))");

    // Update positions on each tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as unknown as HabitNode).x!)
        .attr("y1", (d) => (d.source as unknown as HabitNode).y!)
        .attr("x2", (d) => (d.target as unknown as HabitNode).x!)
        .attr("y2", (d) => (d.target as unknown as HabitNode).y!);

      node.attr("transform", (d) => `translate(${d.x}, ${d.y})`);
    });

    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, HabitNode, any>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, HabitNode, any>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, HabitNode, any>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [connectionStrength, zoom, habitData]);

  // Generate insights based on real data
  const generateInsights = () => {
    if (!habitData) return [];

    const insights = [];
    const nodes = habitData.nodes;
    const links = habitData.links;

    // Find most connected habit
    const connectionCounts = nodes.map(node => ({
      ...node,
      connections: links.filter(link => link.source === node.id || link.target === node.id).length
    }));
    const mostConnected = connectionCounts.reduce((prev, current) =>
      current.connections > prev.connections ? current : prev
    );

    if (mostConnected.connections > 0) {
      insights.push({
        type: 'positive',
        text: `${mostConnected.name} is your most connected habit with ${mostConnected.connections} connections. This makes it a keystone habit that influences many others.`
      });
    }

    // Find high streak habits
    const highStreakHabits = nodes.filter(node => node.streak > 7);
    if (highStreakHabits.length > 0) {
      insights.push({
        type: 'positive',
        text: `You have ${highStreakHabits.length} habit(s) with streaks over 7 days. These strong habits can help reinforce newer ones.`
      });
    }

    // Find low connection habits
    const lowConnectionHabits = nodes.filter(node => {
      const connections = links.filter(link => link.source === node.id || link.target === node.id).length;
      return connections === 0;
    });

    if (lowConnectionHabits.length > 0) {
      insights.push({
        type: 'negative',
        text: `${lowConnectionHabits[0].name} has few connections. Consider pairing it with similar habits for mutual reinforcement.`
      });
    }

    return insights;
  };

  const insights = generateInsights();

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading your habit data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchHabits}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="visualization">
        <TabsList>
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="visualization">
          <Card>
            <CardHeader>
              <CardTitle>Habit DNA Visualization</CardTitle>
              <CardDescription>
                See how your habits are interconnected and influence each other
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Connection Strength</span>
                  <span className="text-sm font-medium">{connectionStrength[0]}/10</span>
                </div>
                <Slider
                  value={connectionStrength}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={setConnectionStrength}
                />
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.1))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setZoom((prev) => Math.min(2, prev + 0.1))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setZoom(1)}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="border rounded-md p-2 h-[500px] bg-card">
                <svg ref={svgRef} width="100%" height="100%"></svg>
              </div>

              <div className="mt-4 text-sm text-muted-foreground">
                <p>
                  <strong>How to use:</strong> Drag nodes to rearrange. Adjust connection strength to show more or fewer connections.
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Larger nodes represent habits with higher impact scores</li>
                  <li>Thicker lines indicate stronger connections between habits</li>
                  <li>Dashed circles show streak status (🟢 7+ days, 🟡 3-7 days, 🔴 &lt;3 days)</li>
                  <li>Colors represent different habit categories</li>
                  <li>Numbers show current streak with fire emoji 🔥</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <div className="space-y-6">
            {/* Header Section */}
            <Card className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-pink-500/10 border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">🧬</span>
                  </div>
                  Habit Connection Insights
                </CardTitle>
                <CardDescription className="text-base">
                  Discover patterns and get personalized recommendations based on your habit data
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Key Insights Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-600 text-xs">💡</span>
                  </div>
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insights.length > 0 ? (
                  <div className="space-y-4">
                    {insights.map((insight, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-l-4 ${insight.type === 'positive'
                          ? 'bg-green-50 border-l-green-500 dark:bg-green-900/20'
                          : 'bg-yellow-50 border-l-yellow-500 dark:bg-yellow-900/20'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 p-1 rounded-full ${insight.type === 'positive'
                            ? 'bg-green-100 dark:bg-green-800'
                            : 'bg-yellow-100 dark:bg-yellow-800'
                            }`}>
                            {insight.type === 'positive' ? (
                              <PlusCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <MinusCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium leading-relaxed">{insight.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-2xl">🌱</span>
                    </div>
                    <p className="text-muted-foreground">
                      Add more habits to see personalized insights about your habit connections.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistics Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-600 text-xs">📊</span>
                  </div>
                  Habit Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    <Card className="relative bg-card/50 backdrop-blur border-border/50 hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-purple-500/10 flex items-center justify-center">
                          <span className="text-purple-600 text-xl">🎯</span>
                        </div>
                        <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {habitData?.nodes.length || 0}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">
                          Total Habits
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    <Card className="relative bg-card/50 backdrop-blur border-border/50 hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <span className="text-blue-600 text-xl">🔗</span>
                        </div>
                        <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                          {habitData?.links.length || 0}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">
                          Connections
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    <Card className="relative bg-card/50 backdrop-blur border-border/50 hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-green-500/10 flex items-center justify-center">
                          <span className="text-green-600 text-xl">🔥</span>
                        </div>
                        <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {habitData?.nodes.reduce((sum, node) => sum + node.streak, 0) || 0}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">
                          Total Streak Days
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            {habitData && habitData.nodes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <span className="text-orange-600 text-xs">📈</span>
                    </div>
                    Category Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(
                      habitData.nodes.reduce((acc, node) => {
                        acc[node.category] = (acc[node.category] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([category, count], index) => {
                      const colors = [
                        'from-purple-500 to-pink-500',
                        'from-blue-500 to-cyan-500',
                        'from-green-500 to-emerald-500',
                        'from-yellow-500 to-orange-500',
                        'from-red-500 to-pink-500'
                      ];
                      const bgColors = [
                        'bg-purple-500/10',
                        'bg-blue-500/10',
                        'bg-green-500/10',
                        'bg-yellow-500/10',
                        'bg-red-500/10'
                      ];
                      const textColors = [
                        'text-purple-600',
                        'text-blue-600',
                        'text-green-600',
                        'text-yellow-600',
                        'text-red-600'
                      ];

                      const colorIndex = index % colors.length;
                      const percentage = ((count / habitData.nodes.length) * 100).toFixed(1);

                      return (
                        <div
                          key={category}
                          className={`group p-4 rounded-lg ${bgColors[colorIndex]} border border-border/50 hover:border-border transition-all duration-300 hover:shadow-md`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`h-3 w-3 rounded-full bg-gradient-to-r ${colors[colorIndex]}`}></div>
                              <span className="font-medium">{category}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold ${textColors[colorIndex]}`}>
                                {count} habit{count !== 1 ? 's' : ''}
                              </span>
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                {percentage}%
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${colors[colorIndex]} transition-all duration-500 ease-out`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}


          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}