"use client";

import { useState, useEffect } from "react";
import { Plus, Star, Info, Clock, BarChart3, Zap, Loader2 } from "lucide-react";
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
import { getUserHabits, createHabit } from "@/lib/actions/habits";
import { IHabit } from "@/lib/types";

type RecommendedHabit = {
  id: string;
  name: string;
  description: string;
  category: string;
  frequency: string;
  timeOfDay: string;
  timeToComplete: string;
  priority: string;
  matchScore: number;
  benefits: string[];
  impactAreas: string[];
  chainsWith: string[];
};

// Comprehensive habit recommendations based on different categories and user patterns
const getRecommendedHabits = (userHabits: IHabit[]): RecommendedHabit[] => {
  const userCategories = new Set(userHabits.map(habit => habit.category));
  const userTimeSlots = new Set(userHabits.map(habit => habit.timeOfDay));

  const allRecommendations: RecommendedHabit[] = [
    // Mindfulness habits
    {
      id: "rec-1",
      name: "Daily Journaling",
      description: "Spend 10 minutes writing about your thoughts and feelings",
      category: "Mindfulness",
      frequency: "Daily",
      timeOfDay: "Evening",
      timeToComplete: "10 minutes",
      priority: "Medium",
      matchScore: 95,
      benefits: ["Clarity", "Self-awareness", "Stress reduction"],
      impactAreas: ["Mental Health", "Productivity"],
      chainsWith: ["Meditation", "Reading"],
    },
    {
      id: "rec-2",
      name: "Gratitude Practice",
      description: "Write down 3 things you're grateful for each day",
      category: "Mindfulness",
      frequency: "Daily",
      timeOfDay: "Morning",
      timeToComplete: "5 minutes",
      priority: "High",
      matchScore: 89,
      benefits: ["Increased happiness", "Reduced negativity", "Better perspective"],
      impactAreas: ["Mental Health", "Relationships"],
      chainsWith: ["Meditation", "Journaling"],
    },
    {
      id: "rec-3",
      name: "Mindful Breathing",
      description: "5-minute breathing exercise to center yourself",
      category: "Mindfulness",
      frequency: "Daily",
      timeOfDay: "Throughout day",
      timeToComplete: "5 minutes",
      priority: "Medium",
      matchScore: 88,
      benefits: ["Stress reduction", "Focus improvement", "Emotional regulation"],
      impactAreas: ["Mental Health", "Productivity"],
      chainsWith: ["Meditation", "Deep Work"],
    },

    // Health habits
    {
      id: "rec-4",
      name: "Cold Shower",
      description: "End your shower with 30 seconds of cold water",
      category: "Health",
      frequency: "Daily",
      timeOfDay: "Morning",
      timeToComplete: "2 minutes",
      priority: "Medium",
      matchScore: 87,
      benefits: ["Increased alertness", "Better circulation", "Strengthened willpower"],
      impactAreas: ["Physical Health", "Mental Toughness"],
      chainsWith: ["Exercise", "Meditation"],
    },
    {
      id: "rec-5",
      name: "Morning Stretching",
      description: "5-minute stretching routine to start your day",
      category: "Health",
      frequency: "Daily",
      timeOfDay: "Morning",
      timeToComplete: "5 minutes",
      priority: "Medium",
      matchScore: 91,
      benefits: ["Flexibility", "Energy boost", "Reduced stiffness"],
      impactAreas: ["Physical Health", "Energy"],
      chainsWith: ["Exercise", "Meditation"],
    },
    {
      id: "rec-6",
      name: "Afternoon Walk",
      description: "10-minute walk to break up your day",
      category: "Health",
      frequency: "Daily",
      timeOfDay: "Afternoon",
      timeToComplete: "10 minutes",
      priority: "Medium",
      matchScore: 88,
      benefits: ["Energy boost", "Creativity", "Stress reduction"],
      impactAreas: ["Physical Health", "Mental Clarity"],
      chainsWith: ["Deep Work", "Hydration"],
    },
    {
      id: "rec-7",
      name: "Hydration Tracking",
      description: "Drink 8 glasses of water throughout the day",
      category: "Health",
      frequency: "Daily",
      timeOfDay: "Throughout day",
      timeToComplete: "Ongoing",
      priority: "High",
      matchScore: 85,
      benefits: ["Better energy", "Improved skin", "Better digestion"],
      impactAreas: ["Physical Health", "Energy"],
      chainsWith: ["Exercise", "Healthy Eating"],
    },

    // Learning habits
    {
      id: "rec-8",
      name: "Daily Reading",
      description: "Read for 20 minutes each day",
      category: "Learning",
      frequency: "Daily",
      timeOfDay: "Evening",
      timeToComplete: "20 minutes",
      priority: "High",
      matchScore: 92,
      benefits: ["Knowledge expansion", "Vocabulary improvement", "Mental stimulation"],
      impactAreas: ["Personal Growth", "Mental Health"],
      chainsWith: ["Journaling", "Digital Detox"],
    },
    {
      id: "rec-9",
      name: "Language Practice",
      description: "Practice a new language for 15 minutes",
      category: "Learning",
      frequency: "Daily",
      timeOfDay: "Morning",
      timeToComplete: "15 minutes",
      priority: "Medium",
      matchScore: 83,
      benefits: ["Cognitive improvement", "Cultural awareness", "Career advancement"],
      impactAreas: ["Personal Growth", "Career"],
      chainsWith: ["Reading", "Deep Work"],
    },

    // Productivity habits
    {
      id: "rec-10",
      name: "Deep Work Block",
      description: "2-hour focused work session without distractions",
      category: "Productivity",
      frequency: "Weekdays",
      timeOfDay: "Morning",
      timeToComplete: "2 hours",
      priority: "High",
      matchScore: 90,
      benefits: ["Increased productivity", "Better quality work", "Goal achievement"],
      impactAreas: ["Career", "Personal Growth"],
      chainsWith: ["Digital Detox", "Planning"],
    },
    {
      id: "rec-11",
      name: "Daily Planning",
      description: "Plan your next day every evening",
      category: "Productivity",
      frequency: "Daily",
      timeOfDay: "Evening",
      timeToComplete: "10 minutes",
      priority: "High",
      matchScore: 88,
      benefits: ["Better organization", "Reduced stress", "Goal clarity"],
      impactAreas: ["Productivity", "Mental Health"],
      chainsWith: ["Journaling", "Review"],
    },

    // Digital Wellbeing habits
    {
      id: "rec-12",
      name: "Digital Sunset",
      description: "No screens 1 hour before bed",
      category: "Digital Wellbeing",
      frequency: "Daily",
      timeOfDay: "Evening",
      timeToComplete: "1 hour",
      priority: "High",
      matchScore: 92,
      benefits: ["Better sleep", "Reduced anxiety", "Mental recovery"],
      impactAreas: ["Sleep", "Mental Health"],
      chainsWith: ["Reading", "Journaling"],
    },
    {
      id: "rec-13",
      name: "Social Media Limit",
      description: "Limit social media to 30 minutes per day",
      category: "Digital Wellbeing",
      frequency: "Daily",
      timeOfDay: "Throughout day",
      timeToComplete: "30 minutes max",
      priority: "Medium",
      matchScore: 90,
      benefits: ["Mental clarity", "Productivity", "Better focus"],
      impactAreas: ["Mental Health", "Productivity"],
      chainsWith: ["Reading", "Deep Work"],
    },
  ];

  // Calculate match scores based on user's existing habits
  return allRecommendations.map(habit => {
    let adjustedScore = habit.matchScore;

    // Boost score if user doesn't have habits in this category
    if (!userCategories.has(habit.category)) {
      adjustedScore += 5;
    }

    // Boost score if user has habits at different times (suggests they can handle this time slot)
    if (userTimeSlots.has(habit.timeOfDay)) {
      adjustedScore += 3;
    }

    // Cap at 100
    adjustedScore = Math.min(100, adjustedScore);

    return {
      ...habit,
      matchScore: adjustedScore
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
};

// Time-based recommendations
const getTimeBasedHabits = (): RecommendedHabit[] => [
  {
    id: "time-1",
    name: "Morning Routine",
    description: "5-minute morning routine to start your day right",
    category: "Mindfulness",
    frequency: "Daily",
    timeOfDay: "Morning",
    timeToComplete: "5 minutes",
    priority: "High",
    matchScore: 94,
    benefits: ["Consistency", "Energy boost", "Mental clarity"],
    impactAreas: ["Mental Health", "Productivity"],
    chainsWith: ["Exercise", "Meditation"],
  },
  {
    id: "time-2",
    name: "Midday Reset",
    description: "2-minute breathing break in the middle of your day",
    category: "Mindfulness",
    frequency: "Weekdays",
    timeOfDay: "Afternoon",
    timeToComplete: "2 minutes",
    priority: "Medium",
    matchScore: 87,
    benefits: ["Stress reduction", "Renewed focus", "Energy restoration"],
    impactAreas: ["Mental Health", "Productivity"],
    chainsWith: ["Deep Work", "Hydration"],
  },
  {
    id: "time-3",
    name: "Evening Wind-Down",
    description: "10-minute relaxation routine before bed",
    category: "Mindfulness",
    frequency: "Daily",
    timeOfDay: "Evening",
    timeToComplete: "10 minutes",
    priority: "High",
    matchScore: 91,
    benefits: ["Better sleep", "Stress reduction", "Mental recovery"],
    impactAreas: ["Sleep", "Mental Health"],
    chainsWith: ["Reading", "Journaling"],
  },
];

// Trending habits
const getTrendingHabits = (): RecommendedHabit[] => [
  {
    id: "trend-1",
    name: "Mindful Eating",
    description: "Focus entirely on your food during meals, no distractions",
    category: "Mindfulness",
    frequency: "Daily",
    timeOfDay: "Throughout day",
    timeToComplete: "During meals",
    priority: "Medium",
    matchScore: 86,
    benefits: ["Better digestion", "Weight management", "Increased satisfaction"],
    impactAreas: ["Physical Health", "Mindfulness"],
    chainsWith: ["Meditation", "Gratitude"],
  },
  {
    id: "trend-2",
    name: "Micro-Meditation",
    description: "1-minute meditation sessions throughout the day",
    category: "Mindfulness",
    frequency: "Daily",
    timeOfDay: "Throughout day",
    timeToComplete: "1 minute",
    priority: "Low",
    matchScore: 89,
    benefits: ["Stress reduction", "Improved focus", "Emotional regulation"],
    impactAreas: ["Mental Health", "Productivity"],
    chainsWith: ["Deep Work", "Breathing"],
  },
];

export function RecommendedHabits() {
  const [userHabits, setUserHabits] = useState<IHabit[]>([]);
  const [addedHabits, setAddedHabits] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendedHabits, setRecommendedHabits] = useState<RecommendedHabit[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserHabits = async () => {
      try {
        const habits = await getUserHabits();
        setUserHabits(habits);
        setRecommendedHabits(getRecommendedHabits(habits));
      } catch (error) {
        console.error('Error fetching user habits:', error);
        toast({
          title: "Error",
          description: "Failed to load your habits. Using default recommendations.",
          variant: "destructive",
        });
        setRecommendedHabits(getRecommendedHabits([]));
      } finally {
        setLoading(false);
      }
    };

    fetchUserHabits();
  }, [toast]);

  const handleAddHabit = async (habit: RecommendedHabit) => {
    try {
      setAddedHabits(prev => [...prev, habit.id]);

      const formData = new FormData();
      formData.append('name', habit.name);
      formData.append('description', habit.description);
      formData.append('category', habit.category);
      formData.append('frequency', habit.frequency);
      formData.append('timeOfDay', habit.timeOfDay);
      formData.append('timeToComplete', habit.timeToComplete);
      formData.append('priority', habit.priority);

      const result = await createHabit(formData);

      if (result.success) {
        toast({
          title: "Habit Added Successfully!",
          description: `${habit.name} has been added to your habits.`,
        });
      } else {
        // Remove from added habits if creation failed
        setAddedHabits(prev => prev.filter(id => id !== habit.id));
        toast({
          title: "Error",
          description: result.error || "Failed to add habit. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Remove from added habits if creation failed
      setAddedHabits(prev => prev.filter(id => id !== habit.id));
      toast({
        title: "Error",
        description: "Failed to add habit. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading recommendations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Recommended Habits</h2>
        <p className="text-muted-foreground">
          Personalized recommendations based on your current habits and goals
        </p>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personalized</TabsTrigger>
          <TabsTrigger value="time">Time-Based</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedHabits.slice(0, 9).map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                isAdded={addedHabits.includes(habit.id)}
                onAddHabit={handleAddHabit}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="time" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getTimeBasedHabits().map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                isAdded={addedHabits.includes(habit.id)}
                onAddHabit={handleAddHabit}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trending" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getTrendingHabits().map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                isAdded={addedHabits.includes(habit.id)}
                onAddHabit={handleAddHabit}
                trending={true}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

type HabitCardProps = {
  habit: RecommendedHabit;
  isAdded: boolean;
  onAddHabit: (habit: RecommendedHabit) => void;
  trending?: boolean;
};

function HabitCard({ habit, isAdded, onAddHabit, trending = false }: HabitCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] duration-200">
      <CardHeader className="pb-3 relative">
        {trending && (
          <Badge variant="outline" className="absolute right-4 top-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0">
            🔥 Trending
          </Badge>
        )}
        <CardTitle className="text-lg flex items-start justify-between pr-8">
          <span className="line-clamp-2">{habit.name}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <div className="space-y-2">
                  <p className="font-medium">Benefits:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {habit.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription className="line-clamp-3">
          {habit.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium">
              {habit.matchScore}% Match
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {habit.timeToComplete}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            {habit.category}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {habit.timeOfDay}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {habit.priority} Priority
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-muted-foreground">
              Impact: {habit.impactAreas.join(", ")}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-muted-foreground">
              Chains with: {habit.chainsWith.join(", ")}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          className="w-full"
          disabled={isAdded}
          onClick={() => onAddHabit(habit)}
        >
          {isAdded ? (
            "Added ✓"
          ) : (
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