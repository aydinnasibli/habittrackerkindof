import { HabitOverview } from "@/components/dashboard/habit-overview";
import { HabitStats } from "@/components/dashboard/habit-stats";
import { RecommendedHabits } from "@/components/dashboard/recommended-habits";
import { HabitDNA } from "@/components/dashboard/habit-dna";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome Back</h1>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Today's Impact</CardTitle>
                <CardDescription>
                  The compound effect of your habits today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Productivity</span>
                    <span className="font-medium text-green-500">+12%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Energy</span>
                    <span className="font-medium text-green-500">+8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Focus</span>
                    <span className="font-medium text-green-500">+15%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Mood</span>
                    <span className="font-medium text-green-500">+10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Habit Weather Forecast</CardTitle>
                <CardDescription>
                  Predicted difficulty for the next 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-20 text-sm">{day}</div>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            index === 2 || index === 5 ? "bg-yellow-500" : 
                            index === 3 ? "bg-red-500" : "bg-green-500"
                          }`} 
                          style={{ 
                            width: `${
                              index === 2 ? "70%" : 
                              index === 3 ? "85%" : 
                              index === 5 ? "65%" : 
                              "40%"
                            }` 
                          }}
                        />
                      </div>
                      <div className="w-16 text-sm text-right">
                        {index === 2 || index === 5 ? "Moderate" : 
                         index === 3 ? "Difficult" : "Easy"}
                      </div>
                    </div>
                  ))}
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