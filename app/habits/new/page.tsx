// app/habits/new/page.tsx
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createHabit } from '@/lib/actions/habits';

export default function NewHabitPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await createHabit(formData);

      if (result.success) {
        toast({
          title: "Success",
          description: "New habit has been created!",
        });
        router.push('/habits');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create habit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Create New Habit</h1>
        <p className="text-muted-foreground">
          Define a new habit you want to build. Be specific and make it measurable.
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl">Habit Details</CardTitle>
          <CardDescription>
            Fill in the information below to create your new habit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Habit Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Morning Meditation"
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your habit and why it's important to you..."
                  className="min-h-[100px] resize-none"
                  required
                />
              </div>
            </div>

            {/* Configuration Grid */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold border-b pb-2">Configuration</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">
                    Category *
                  </Label>
                  <Select name="category" required defaultValue="">
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mindfulness">🧘 Mindfulness</SelectItem>
                      <SelectItem value="Health">💪 Health</SelectItem>
                      <SelectItem value="Learning">📚 Learning</SelectItem>
                      <SelectItem value="Productivity">⚡ Productivity</SelectItem>
                      <SelectItem value="Digital Wellbeing">📱 Digital Wellbeing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-medium">
                    Priority *
                  </Label>
                  <Select name="priority" required defaultValue="">
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select priority level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">🔴 High Priority</SelectItem>
                      <SelectItem value="Medium">🟡 Medium Priority</SelectItem>
                      <SelectItem value="Low">🟢 Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency" className="text-sm font-medium">
                    Frequency *
                  </Label>
                  <Select name="frequency" required defaultValue="">
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="How often?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily">📅 Daily</SelectItem>
                      <SelectItem value="Weekdays">🏢 Weekdays</SelectItem>
                      <SelectItem value="Weekends">🏖️ Weekends</SelectItem>
                      <SelectItem value="Mon, Wed, Fri">📆 Mon, Wed, Fri</SelectItem>
                      <SelectItem value="Tue, Thu">📋 Tue, Thu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeOfDay" className="text-sm font-medium">
                    Time of Day *
                  </Label>
                  <Select name="timeOfDay" required defaultValue="">
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="When do you prefer?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Morning">🌅 Morning</SelectItem>
                      <SelectItem value="Afternoon">☀️ Afternoon</SelectItem>
                      <SelectItem value="Evening">🌆 Evening</SelectItem>
                      <SelectItem value="Throughout day">🔄 Throughout day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeToComplete" className="text-sm font-medium">
                  Estimated Duration *
                </Label>
                <Input
                  id="timeToComplete"
                  name="timeToComplete"
                  placeholder="e.g., 15 minutes, 30 min, 1 hour"
                  className="h-11 max-w-md"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How long does this habit typically take to complete?
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                className="h-11 px-8"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-11 px-8 bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Habit"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}