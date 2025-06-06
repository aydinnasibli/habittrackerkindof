import { HabitOverview } from "@/components/dashboard/habit-overview";
import { HabitStats } from "@/components/dashboard/habit-stats";
import { RecommendedHabits } from "@/components/dashboard/recommended-habits";
import { HabitDNA } from "@/components/dashboard/habit-dna";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { getHabitAnalytics } from "@/lib/actions/habits";
import { TrendingUp, Target, Calendar, Award } from "lucide-react";
import { UserNav } from "@/components/auth/user-nav";
export default async function DashboardPage() {
  const analytics = await getHabitAnalytics(7);

  return (
    <div className="container py-8">
      <div className="mb-8">
        <UserNav />
        <p className="text-muted-foreground text-lg">
          Track your progress and build lasting habits
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="dna">Habit DNA</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <HabitOverview />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Habits</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalHabits}</div>
                <p className="text-xs text-muted-foreground">
                  Currently tracking
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weekly Success</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.completionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Completion rate this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Streaks</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.streakSum}</div>
                <p className="text-xs text-muted-foreground">
                  Combined streak days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Best Day</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.weeklyData.length > 0
                    ? Math.max(...analytics.weeklyData.map(d => d.rate))
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Best completion rate
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Progress</CardTitle>
                <CardDescription>
                  Your habit completion over the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.weeklyData.map((day, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-20 text-sm font-medium">
                        {new Date(day.date).toLocaleDateString('tr-TR', { weekday: 'short' })}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Progress value={day.rate} className="flex-1" />
                          <span className="text-sm font-medium w-12 text-right">
                            {day.rate}%
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {day.completed}/{day.total} habits completed
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Shortcuts to boost your habit success
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="font-medium">Set Reminders</div>
                    <div className="text-sm text-muted-foreground">
                      Never miss a habit with smart notifications
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="font-medium">Create Habit Stack</div>
                    <div className="text-sm text-muted-foreground">
                      Link habits together for better consistency
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="font-medium">Review Goals</div>
                    <div className="text-sm text-muted-foreground">
                      Adjust your habits based on progress
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="font-medium">Export Data</div>
                    <div className="text-sm text-muted-foreground">
                      Download your habit tracking history
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <HabitStats />
        </TabsContent>

        <TabsContent value="recommended">
          <RecommendedHabits />
        </TabsContent>

        <TabsContent value="dna">
          <HabitDNA />
        </TabsContent>
      </Tabs>
    </div>
  );
}