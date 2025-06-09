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
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

// Function to get user's timezone (you might want to get this from user preferences)
function getUserTimezone(): string {
  // Default to user's browser timezone or UTC
  // You can modify this to get from user profile/preferences
  try {
    console.log(Intl.DateTimeFormat().resolvedOptions().timeZone);
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

// Format date for display
function formatDateForDisplay(dateString: string): string {
  try {
    const date = new Date(dateString + 'T12:00:00.000Z');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}
//last stable model
export default async function DashboardPage() {
  // Check authentication
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  // Get user timezone (you might want to fetch this from user profile)
  const timezone = getUserTimezone();

  try {
    // Fetch analytics with timezone parameter
    const analytics = await getHabitAnalytics(7, timezone);

    // Ensure we have valid data
    const safeAnalytics = {
      totalHabits: analytics?.totalHabits || 0,
      completionRate: analytics?.completionRate || 0,
      streakSum: analytics?.streakSum || 0,
      weeklyData: Array.isArray(analytics?.weeklyData) ? analytics.weeklyData : []
    };

    // Calculate best day from weekly data
    const bestDayRate = safeAnalytics.weeklyData.length > 0
      ? Math.max(...safeAnalytics.weeklyData.map(d => d?.rate || 0))
      : 0;

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
                  <div className="text-2xl font-bold">{safeAnalytics.totalHabits}</div>
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
                  <div className="text-2xl font-bold">{safeAnalytics.completionRate}%</div>
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
                  <div className="text-2xl font-bold">{safeAnalytics.streakSum}</div>
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
                  <div className="text-2xl font-bold">{bestDayRate}%</div>
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
                    {safeAnalytics.weeklyData.length > 0 ? (
                      safeAnalytics.weeklyData.map((day, index) => (
                        <div key={day?.date || index} className="flex items-center gap-4">
                          <div className="w-20 text-sm font-medium">
                            {formatDateForDisplay(day?.date || '')}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Progress value={day?.rate || 0} className="flex-1" />
                              <span className="text-sm font-medium w-12 text-right">
                                {day?.rate || 0}%
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {day?.completed || 0}/{day?.total || 0} habits completed
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No habit data available yet.</p>
                        <p className="text-sm mt-2">Create some habits to see your progress!</p>
                      </div>
                    )}
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
  } catch (error) {
    console.error('Error loading dashboard:', error);

    // Fallback UI when there's an error
    return (
      <div className="container py-8">
        <div className="mb-8">
          <UserNav />
          <p className="text-muted-foreground text-lg">
            Track your progress and build lasting habits
          </p>
        </div>

        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="text-muted-foreground mb-6">
            We're having trouble loading your dashboard. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
}