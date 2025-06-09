"use client";

import { useState, useEffect } from "react";
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
import { getUserHabits } from "@/lib/actions/habits";
import { IHabit, IHabitCompletion } from "@/lib/types";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))"
];

type WeeklyData = {
  name: string;
  completed: number;
  total: number;
  percentage: number;
};

type CategoryData = {
  name: string;
  value: number;
};

type StreakData = {
  name: string;
  streak: number;
};

type MonthlyData = {
  name: string;
  completed: number;
  total: number;
  percentage: number;
};

// Custom tooltip component with proper theming
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3">
      <p className="text-card-foreground font-medium mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-card-foreground text-sm">
            {entry.name}: {formatter ? formatter(entry.value, entry.name)[0] : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function HabitStats() {
  const [habits, setHabits] = useState<IHabit[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [streakData, setStreakData] = useState<StreakData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHabitsAndCalculateStats();
  }, []);

  const loadHabitsAndCalculateStats = async () => {
    try {
      const fetchedHabits = await getUserHabits();
      setHabits(fetchedHabits);

      calculateWeeklyStats(fetchedHabits);
      calculateMonthlyStats(fetchedHabits);
      calculateCategoryStats(fetchedHabits);
      calculateStreakStats(fetchedHabits);
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyStats = (habits: IHabit[]) => {
    const today = new Date();
    const weekData: WeeklyData[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Get data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayName = dayNames[date.getDay()];
      let completed = 0;
      let total = 0;

      habits.forEach(habit => {
        if (habit.status === 'active') {
          total++;
          const dayCompletion = habit.completions?.find(comp => {
            const compDate = new Date(comp.date);
            compDate.setHours(0, 0, 0, 0);
            return compDate.getTime() === date.getTime();
          });

          if (dayCompletion?.completed) {
            completed++;
          }
        }
      });

      weekData.push({
        name: dayName,
        completed,
        total: total || 1, // Avoid division by zero
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      });
    }

    setWeeklyData(weekData);
  };

  const calculateMonthlyStats = (habits: IHabit[]) => {
    const today = new Date();
    const monthData: MonthlyData[] = [];

    // Get data for the last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      let completed = 0;
      let total = 0;

      habits.forEach(habit => {
        if (habit.status === 'active') {
          total++;
          const dayCompletion = habit.completions?.find(comp => {
            const compDate = new Date(comp.date);
            compDate.setHours(0, 0, 0, 0);
            return compDate.getTime() === date.getTime();
          });

          if (dayCompletion?.completed) {
            completed++;
          }
        }
      });

      monthData.push({
        name: `Day ${30 - i}`,
        completed,
        total: total || 1,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      });
    }

    setMonthlyData(monthData);
  };

  const calculateCategoryStats = (habits: IHabit[]) => {
    const categoryCount: { [key: string]: number } = {};

    habits.forEach(habit => {
      if (habit.status === 'active') {
        categoryCount[habit.category] = (categoryCount[habit.category] || 0) + 1;
      }
    });

    const total = Object.values(categoryCount).reduce((sum, count) => sum + count, 0);

    const categories = Object.entries(categoryCount).map(([name, count]) => ({
      name,
      value: total > 0 ? Math.round((count / total) * 100) : 0
    }));

    setCategoryData(categories);
  };

  const calculateStreakStats = (habits: IHabit[]) => {
    const activeHabits = habits
      .filter(habit => habit.status === 'active')
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 5); // Top 5 streaks

    const streaks = activeHabits.map(habit => ({
      name: habit.name.length > 12 ? habit.name.substring(0, 12) + '...' : habit.name,
      streak: habit.streak
    }));

    setStreakData(streaks);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-3/4 mt-2"></div>
              </CardHeader>
              <CardContent className="h-[300px]">
                <div className="animate-pulse bg-muted h-full rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Progress</CardTitle>
            <CardDescription>Your habit completion over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weeklyData}
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--chart-text))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--chart-text))"
                  fontSize={12}
                />
                <Tooltip
                  content={<CustomTooltip formatter={(value: any, name: any) => [
                    name === 'completed' ? `${value} habits` : `${value}%`,
                    name === 'completed' ? 'Completed' : 'Completion Rate'
                  ]} />}
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
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<CustomTooltip formatter={(value: any) => [`${value}%`, "Percentage"]} />}
                  />
                  <Legend
                    wrapperStyle={{ color: 'hsl(var(--chart-text))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No habit categories found
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Streaks</CardTitle>
            <CardDescription>Your active habit streaks</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {streakData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={streakData}
                  layout="vertical"
                  margin={{ top: 5, right: 5, left: 50, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                  <XAxis
                    type="number"
                    stroke="hsl(var(--chart-text))"
                    fontSize={12}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="hsl(var(--chart-text))"
                    fontSize={12}
                  />
                  <Tooltip
                    content={<CustomTooltip formatter={(value: any) => [`${value} days`, "Current Streak"]} />}
                  />
                  <Bar dataKey="streak" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No active habits found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance</CardTitle>
          <CardDescription>
            Your habit completion over the last 30 days
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
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: 'hsl(var(--chart-text))' }}
                    interval={4}
                    stroke="hsl(var(--chart-text))"
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="hsl(var(--chart-text))"
                    tick={{ fontSize: 12, fill: 'hsl(var(--chart-text))' }}
                  />
                  <Tooltip
                    content={<CustomTooltip formatter={(value: any) => [`${value}%`, "Completion Rate"]} />}
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
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: 'hsl(var(--chart-text))' }}
                    interval={4}
                    stroke="hsl(var(--chart-text))"
                  />
                  <YAxis
                    stroke="hsl(var(--chart-text))"
                    tick={{ fontSize: 12, fill: 'hsl(var(--chart-text))' }}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                  />
                  <Legend
                    wrapperStyle={{ color: 'hsl(var(--chart-text))' }}
                  />
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