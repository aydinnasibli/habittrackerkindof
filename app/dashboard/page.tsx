import { Suspense } from "react";
import { HabitOverview } from "@/components/dashboard/habit-overview";
import { HabitStats } from "@/components/dashboard/habit-stats";
import { RecommendedHabits } from "@/components/dashboard/recommended-habits";
import { HabitDNA } from "@/components/dashboard/habit-dna";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { getHabitAnalytics } from "@/lib/actions/habits";
import { TrendingUp, Target, Calendar, Award, Loader2 } from "lucide-react";
import { UserNav } from "@/components/auth/user-nav";
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { unstable_cache } from 'next/cache';

// Memoized timezone function - runs client-side only when needed
const getClientTimezone = () => {
  if (typeof window === 'undefined') return 'UTC';
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

// Optimized date formatter with memoization
const formatDateForDisplay = (() => {
  const cache = new Map<string, string>();

  return (dateString: string): string => {
    if (cache.has(dateString)) return cache.get(dateString)!;

    try {
      const date = new Date(dateString + 'T12:00:00.000Z');
      const formatted = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      cache.set(dateString, formatted);
      return formatted;
    } catch {
      return dateString;
    }
  };
})();

// Cached analytics function
const getCachedAnalytics = unstable_cache(
  async (userId: string, days: number, timezone: string) => {
    return await getHabitAnalytics(days, timezone);
  },
  ['habit-analytics'],
  {
    revalidate: 300, // 5 minutes cache
    tags: ['analytics', 'habits']
  }
);

// Separate component for analytics cards to enable streaming
async function AnalyticsCards({ userId }: { userId: string }) {
  const timezone = 'UTC'; // Server-side default, client will update if needed

  try {
    const analytics = await getCachedAnalytics(userId, 7, timezone);

    const safeAnalytics = {
      totalHabits: analytics?.totalHabits || 0,
      completionRate: analytics?.completionRate || 0,
      streakSum: analytics?.streakSum || 0,
      weeklyData: Array.isArray(analytics?.weeklyData) ? analytics.weeklyData : []
    };

    const bestDayRate = safeAnalytics.weeklyData.length > 0
      ? Math.max(...safeAnalytics.weeklyData.map(d => d?.rate || 0))
      : 0;

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Habits</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeAnalytics.totalHabits}</div>
              <p className="text-xs text-muted-foreground">Currently tracking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Success</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeAnalytics.completionRate}%</div>
              <p className="text-xs text-muted-foreground">Completion rate this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Streaks</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeAnalytics.streakSum}</div>
              <p className="text-xs text-muted-foreground">Combined streak days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Day</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bestDayRate}%</div>
              <p className="text-xs text-muted-foreground">Best completion rate</p>
            </CardContent>
          </Card>
        </div>

        <WeeklyProgressCard weeklyData={safeAnalytics.weeklyData} />
      </>
    );
  } catch (error) {
    console.error('Error loading analytics:', error);
    return <AnalyticsErrorFallback />;
  }
}

// Separate component for weekly progress
function WeeklyProgressCard({ weeklyData }: { weeklyData: any[] }) {
  return (
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
            {weeklyData.length > 0 ? (
              weeklyData.map((day, index) => (
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

      <QuickActionsCard />
    </div>
  );
}

// Static quick actions component
function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Shortcuts to boost your habit success
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[
            {
              title: "Set Reminders",
              description: "Never miss a habit with smart notifications"
            },
            {
              title: "Create Habit Stack",
              description: "Link habits together for better consistency"
            },
            {
              title: "Review Goals",
              description: "Adjust your habits based on progress"
            },
            {
              title: "Export Data",
              description: "Download your habit tracking history"
            }
          ].map((action, index) => (
            <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="font-medium">{action.title}</div>
              <div className="text-sm text-muted-foreground">
                {action.description}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Loading fallback for analytics
function AnalyticsLoadingFallback() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-20 h-4 bg-muted animate-pulse rounded" />
                  <div className="flex-1">
                    <div className="h-2 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <QuickActionsCard />
      </div>
    </>
  );
}

// Error fallback for analytics
function AnalyticsErrorFallback() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {['Active Habits', 'Weekly Success', 'Total Streaks', 'Best Day'][i]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Data unavailable</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Global error boundary
function ErrorFallback() {
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

// Main dashboard component - now much lighter
export default async function DashboardPage() {
  // Fast auth check
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

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

          <Suspense fallback={<AnalyticsLoadingFallback />}>
            <AnalyticsCards userId={userId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="analytics">
          <Suspense fallback={
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          }>
            <HabitStats />
          </Suspense>
        </TabsContent>

        <TabsContent value="recommended">
          <Suspense fallback={
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          }>
            <RecommendedHabits />
          </Suspense>
        </TabsContent>

        <TabsContent value="dna">
          <Suspense fallback={
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          }>
            <HabitDNA />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}