"use client";

import { useState } from "react";
import { Plus, Star, Info, Clock, BarChart3, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

// Mock data for recommended habits
const recommendedHabits = [
  {
    id: "1",
    name: "Daily Journaling",
    description: "Spend 10 minutes writing about your thoughts and feelings",
    matchScore: 95,
    benefits: ["Clarity", "Self-awareness", "Stress reduction"],
    timeOfDay: "Evening",
    impactAreas: ["Mental Health", "Productivity"],
    chainsWith: ["Meditation", "Reading"],
  },
  {
    id: "2",
    name: "Cold Shower",
    description: "End your shower with 30 seconds of cold water",
    matchScore: 87,
    benefits: ["Increased alertness", "Better circulation", "Strengthened willpower"],
    timeOfDay: "Morning",
    impactAreas: ["Physical Health", "Mental Toughness"],
    chainsWith: ["Exercise", "Meditation"],
  },
  {
    id: "3",
    name: "Digital Sunset",
    description: "No screens 1 hour before bed",
    matchScore: 92,
    benefits: ["Better sleep", "Reduced anxiety", "Mental recovery"],
    timeOfDay: "Evening",
    impactAreas: ["Sleep", "Mental Health"],
    chainsWith: ["Reading", "Journaling"],
  },
  {
    id: "4",
    name: "Gratitude Practice",
    description: "Write down 3 things you're grateful for",
    matchScore: 89,
    benefits: ["Increased happiness", "Reduced negativity", "Better perspective"],
    timeOfDay: "Morning/Evening",
    impactAreas: ["Mental Health", "Relationships"],
    chainsWith: ["Meditation", "Journaling"],
  },
];

// Time-based recommendations
const timeBasedHabits = [
  {
    id: "5",
    name: "Morning Stretching",
    description: "5-minute stretching routine to start your day",
    matchScore: 91,
    benefits: ["Flexibility", "Energy boost", "Reduced stiffness"],
    timeOfDay: "Morning",
    impactAreas: ["Physical Health", "Energy"],
    chainsWith: ["Meditation", "Exercise"],
  },
  {
    id: "6",
    name: "Afternoon Walk",
    description: "10-minute walk to break up your day",
    matchScore: 88,
    benefits: ["Energy boost", "Creativity", "Stress reduction"],
    timeOfDay: "Afternoon",
    impactAreas: ["Physical Health", "Mental Clarity"],
    chainsWith: ["Deep Work", "Hydration"],
  },
  {
    id: "7",
    name: "Evening Wind-Down",
    description: "10-minute relaxation routine before bed",
    matchScore: 94,
    benefits: ["Better sleep", "Stress reduction", "Mental recovery"],
    timeOfDay: "Evening",
    impactAreas: ["Sleep", "Mental Health"],
    chainsWith: ["Reading", "Journaling"],
  },
];

export function RecommendedHabits() {
  const [addedHabits, setAddedHabits] = useState<string[]>([]);
  const { toast } = useToast();

  const handleAddHabit = (habitId: string, habitName: string) => {
    setAddedHabits((prev) => [...prev, habitId]);
    toast({
      title: "Habit Added",
      description: `${habitName} has been added to your habits!`,
    });
  };

  return (
    <div className="space-y-8">
      <Tabs defaultValue="personal">
        <TabsList className="mb-6">
          <TabsTrigger value="personal">Personalized</TabsTrigger>
          <TabsTrigger value="time">Time-Based</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>
        
        <TabsContent value="personal">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendedHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                isAdded={addedHabits.includes(habit.id)}
                onAddHabit={handleAddHabit}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="time">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {timeBasedHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                isAdded={addedHabits.includes(habit.id)}
                onAddHabit={handleAddHabit}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="trending">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HabitCard
              habit={{
                id: "8",
                name: "Mindful Eating",
                description: "Focus entirely on your food during meals, no distractions",
                matchScore: 86,
                benefits: ["Better digestion", "Weight management", "Increased satisfaction"],
                timeOfDay: "Mealtimes",
                impactAreas: ["Physical Health", "Mindfulness"],
                chainsWith: ["Meditation", "Gratitude"],
              }}
              isAdded={addedHabits.includes("8")}
              onAddHabit={handleAddHabit}
              trending={true}
            />
            <HabitCard
              habit={{
                id: "9",
                name: "Social Media Detox",
                description: "Limit social media to 30 minutes per day",
                matchScore: 90,
                benefits: ["Mental clarity", "Productivity", "Better focus"],
                timeOfDay: "All day",
                impactAreas: ["Mental Health", "Productivity"],
                chainsWith: ["Reading", "Deep Work"],
              }}
              isAdded={addedHabits.includes("9")}
              onAddHabit={handleAddHabit}
              trending={true}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

type HabitCardProps = {
  habit: {
    id: string;
    name: string;
    description: string;
    matchScore: number;
    benefits: string[];
    timeOfDay: string;
    impactAreas: string[];
    chainsWith: string[];
  };
  isAdded: boolean;
  onAddHabit: (id: string, name: string) => void;
  trending?: boolean;
};

function HabitCard({ habit, isAdded, onAddHabit, trending = false }: HabitCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-3 relative">
        {trending && (
          <Badge variant="outline" className="absolute right-6 top-6 bg-accent">
            Trending
          </Badge>
        )}
        <CardTitle className="text-xl flex items-center">
          {habit.name}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-2 h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-2 max-w-xs">
                  <p className="font-medium">Benefits:</p>
                  <ul className="list-disc list-inside text-sm">
                    {habit.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>{habit.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-500 mr-1 fill-yellow-500" />
            <span className="text-sm font-medium">
              {habit.matchScore}% Match
            </span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {habit.timeOfDay}
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {habit.impactAreas.map((area, index) => (
            <Badge key={index} variant="secondary" className="bg-secondary/70">
              {area}
            </Badge>
          ))}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Impact Areas</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Chains well with: {habit.chainsWith.join(", ")}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={isAdded}
          onClick={() => onAddHabit(habit.id, habit.name)}
        >
          {isAdded ? "Added" : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add Habit
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}