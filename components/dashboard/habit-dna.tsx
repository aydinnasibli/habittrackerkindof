"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { PlusCircle, MinusCircle, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import * as d3 from "d3";

type HabitNode = {
  id: string;
  name: string;
  value: number;
  group: number;
};

type HabitLink = {
  source: string;
  target: string;
  value: number;
};

// Mock data for habit connections
const habitData = {
  nodes: [
    { id: "1", name: "Morning Meditation", value: 85, group: 1 },
    { id: "2", name: "Exercise", value: 90, group: 1 },
    { id: "3", name: "Reading", value: 75, group: 2 },
    { id: "4", name: "Journaling", value: 60, group: 2 },
    { id: "5", name: "Healthy Eating", value: 80, group: 3 },
    { id: "6", name: "Gratitude", value: 70, group: 2 },
    { id: "7", name: "Deep Work", value: 85, group: 4 },
    { id: "8", name: "Sleep Routine", value: 90, group: 3 },
    { id: "9", name: "Water Intake", value: 65, group: 3 },
    { id: "10", name: "Digital Detox", value: 55, group: 4 },
  ],
  links: [
    { source: "1", target: "2", value: 7 },
    { source: "1", target: "6", value: 8 },
    { source: "1", target: "4", value: 6 },
    { source: "2", target: "5", value: 7 },
    { source: "2", target: "9", value: 9 },
    { source: "3", target: "4", value: 8 },
    { source: "3", target: "7", value: 7 },
    { source: "4", target: "6", value: 9 },
    { source: "5", target: "8", value: 8 },
    { source: "5", target: "9", value: 7 },
    { source: "7", target: "10", value: 6 },
    { source: "8", target: "1", value: 6 },
    { source: "8", target: "10", value: 7 },
    { source: "9", target: "5", value: 8 },
  ],
};

export function HabitDNA() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [connectionStrength, setConnectionStrength] = useState([5]);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!svgRef.current) return;

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
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

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
      .attr("r", (d) => d.value / 7)
      .attr("fill", (d) => {
        const groupColors = [
          "hsl(var(--chart-1))",
          "hsl(var(--chart-2))",
          "hsl(var(--chart-3))",
          "hsl(var(--chart-4))",
          "hsl(var(--chart-5))",
        ];
        return groupColors[(d.group - 1) % groupColors.length];
      })
      .attr("stroke", "hsl(var(--background))")
      .attr("stroke-width", 2);

    // Add labels to nodes
    node
      .append("text")
      .text((d) => d.name)
      .attr("x", 15)
      .attr("y", 5)
      .attr("font-size", "12px")
      .attr("fill", "hsl(var(--foreground))");

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
  }, [connectionStrength, zoom]);

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

              <div className="border rounded-md p-2 h-[500px]">
                <svg ref={svgRef} width="100%" height="100%"></svg>
              </div>

              <div className="mt-4 text-sm text-muted-foreground">
                <p>
                  <strong>How to use:</strong> Drag nodes to rearrange. Adjust connection strength to show more or fewer connections.
                </p>
                <ul className="list-disc list-inside mt-2">
                  <li>Larger nodes represent habits with greater impact</li>
                  <li>Thicker lines indicate stronger connections between habits</li>
                  <li>Colors represent different habit categories</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Habit Connection Insights</CardTitle>
              <CardDescription>
                Patterns and recommendations based on your habit DNA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-2">Key Insights</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <PlusCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span>
                        <strong>Morning Meditation</strong> strongly influences your
                        <strong> Exercise</strong> and <strong>Gratitude</strong> habits.
                        Prioritize this habit to boost the others.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <PlusCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span>
                        <strong>Sleep Routine</strong> has a significant effect on
                        your morning habits. Improving sleep quality could boost
                        your entire habit system.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <MinusCircle className="h-5 w-5 text-red-500 mr-2 shrink-0 mt-0.5" />
                      <span>
                        <strong>Digital Detox</strong> is weakly connected. Consider
                        linking it with <strong>Deep Work</strong> sessions for mutual
                        reinforcement.
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Suggested Habit Chains</h3>
                  <div className="space-y-3">
                    <Card className="bg-card border-border">
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Morning Power Chain</h4>
                        <div className="flex items-center">
                          <div className="px-3 py-2 bg-secondary rounded-md">
                            Morning Meditation
                          </div>
                          <div className="h-0.5 w-5 bg-primary mx-1"></div>
                          <div className="px-3 py-2 bg-secondary rounded-md">
                            Exercise
                          </div>
                          <div className="h-0.5 w-5 bg-primary mx-1"></div>
                          <div className="px-3 py-2 bg-secondary rounded-md">
                            Healthy Eating
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Evening Reflection Chain</h4>
                        <div className="flex items-center">
                          <div className="px-3 py-2 bg-secondary rounded-md">
                            Reading
                          </div>
                          <div className="h-0.5 w-5 bg-primary mx-1"></div>
                          <div className="px-3 py-2 bg-secondary rounded-md">
                            Journaling
                          </div>
                          <div className="h-0.5 w-5 bg-primary mx-1"></div>
                          <div className="px-3 py-2 bg-secondary rounded-md">
                            Gratitude
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}