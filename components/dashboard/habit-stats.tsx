"use client";

import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for the charts
const weeklyData = [
  { name: "Mon", completed: 5, total: 7 },
  { name: "Tue", completed: 7, total: 7 },
  { name: "Wed", completed: 4, total: 7 },
  { name: "Thu", completed: 6, total: 7 },
  { name: "Fri", completed: 5, total: 7 },
  { name: "Sat", completed: 3, total: 5 },
  { name: "Sun", completed: 4, total: 5 },
];

const monthlyData = Array.from({ length: 30 }, (_, i) => {
  const completed = Math.floor(Math.random() * 6) + 2;
  const total = Math.floor(Math.random() * 2) + 6;
  return {
    name: `Day ${i + 1}`,
    completed,
    total,
    percentage: Math.round((completed / total) * 100),
  };
});

const categoriesData = [
  { name: "Health", value: 35 },
  { name: "Productivity", value: 25 },
  { name: "Learning", value: 20 },
  { name: "Social", value: 15 },
  { name: "Mindfulness", value: 5 },
];

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export function HabitStats() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Completion Rate</CardTitle>
            <CardDescription>Your habit completion over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weeklyData}
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${value} habits`, "Completed"]}
                  labelFormatter={(label) => `${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Habit Categories</CardTitle>
            <CardDescription>Breakdown of your habit types</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoriesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoriesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value}%`, "Percentage"]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Streaks</CardTitle>
            <CardDescription>Your current habit streaks</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Meditation", streak: 21 },
                  { name: "Reading", streak: 8 },
                  { name: "Exercise", streak: 12 },
                  { name: "Water", streak: 15 },
                  { name: "Journal", streak: 5 },
                ]}
                layout="vertical"
                margin={{ top: 5, right: 5, left: 50, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip 
                  formatter={(value) => [`${value} days`, "Current Streak"]}
                />
                <Bar dataKey="streak" fill="hsl(var(--chart-2))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance</CardTitle>
          <CardDescription>
            Your habit completion percentage over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="percentage">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="percentage">Percentage</TabsTrigger>
                <TabsTrigger value="raw">Raw Numbers</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="percentage" className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyData}
                  margin={{ top: 5, right: 5, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    interval={4}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, "Completion Rate"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="percentage"
                    stroke="hsl(var(--chart-3))"
                    fill="hsl(var(--chart-3))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="raw" className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 5, right: 5, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    interval={4}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="hsl(var(--chart-1))" name="Completed" />
                  <Bar dataKey="total" fill="hsl(var(--chart-4))" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}