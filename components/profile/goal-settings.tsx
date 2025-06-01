'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { updateGoals } from '@/lib/actions/profile';
import { IProfile } from '@/lib/types';
import { toast } from 'sonner';
import { Loader2, Target, Calendar, TrendingUp } from 'lucide-react';

interface GoalSettingsProps {
    profile: IProfile;
}

export function GoalSettings({ profile }: GoalSettingsProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [goals, setGoals] = useState({
        dailyHabitTarget: profile.goals.dailyHabitTarget,
        weeklyGoal: profile.goals.weeklyGoal
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await updateGoals(goals);

            if (result.success) {
                toast.success('Goals updated successfully!');
                router.refresh();
            } else {
                toast.error(result.error || 'Failed to update goals');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDailyTargetChange = (value: number[]) => {
        setGoals(prev => ({ ...prev, dailyHabitTarget: value[0] }));
    };

    const handleWeeklyGoalChange = (value: number[]) => {
        setGoals(prev => ({ ...prev, weeklyGoal: value[0] }));
    };

    const handleInputChange = (field: 'dailyHabitTarget' | 'weeklyGoal', value: string) => {
        const numValue = parseInt(value);
        if (!isNaN(numValue)) {
            if (field === 'dailyHabitTarget' && numValue >= 1 && numValue <= 20) {
                setGoals(prev => ({ ...prev, [field]: numValue }));
            } else if (field === 'weeklyGoal' && numValue >= 1 && numValue <= 140) {
                setGoals(prev => ({ ...prev, [field]: numValue }));
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-8">
                {/* Daily Habit Target */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                        <Target className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <Label className="text-base font-medium">Daily Habit Target</Label>
                            <p className="text-sm text-muted-foreground">
                                Number of habits you want to complete each day
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="px-3">
                            <Slider
                                value={[goals.dailyHabitTarget]}
                                onValueChange={handleDailyTargetChange}
                                max={20}
                                min={1}
                                step={1}
                                className="w-full"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">1 habit</span>
                            <div className="flex items-center space-x-2">
                                <Input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={goals.dailyHabitTarget}
                                    onChange={(e) => handleInputChange('dailyHabitTarget', e.target.value)}
                                    className="w-20 text-center"
                                />
                                <span className="text-sm font-medium">habits per day</span>
                            </div>
                            <span className="text-sm text-muted-foreground">20 habits</span>
                        </div>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                            <TrendingUp className="h-4 w-4 inline mr-1" />
                            Completing {goals.dailyHabitTarget} habit{goals.dailyHabitTarget !== 1 ? 's' : ''} daily
                            will help you build consistent momentum and achieve lasting change.
                        </p>
                    </div>
                </div>

                {/* Weekly Goal */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <Label className="text-base font-medium">Weekly Completion Goal</Label>
                            <p className="text-sm text-muted-foreground">
                                Total number of habit completions you want to achieve per week
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="px-3">
                            <Slider
                                value={[goals.weeklyGoal]}
                                onValueChange={handleWeeklyGoalChange}
                                max={140}
                                min={1}
                                step={1}
                                className="w-full"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">1 completion</span>
                            <div className="flex items-center space-x-2">
                                <Input
                                    type="number"
                                    min={1}
                                    max={140}
                                    value={goals.weeklyGoal}
                                    onChange={(e) => handleInputChange('weeklyGoal', e.target.value)}
                                    className="w-20 text-center"
                                />
                                <span className="text-sm font-medium">completions per week</span>
                            </div>
                            <span className="text-sm text-muted-foreground">140 completions</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Suggested based on daily target:
                            </div>
                            <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                                {goals.dailyHabitTarget * 7} completions/week
                            </div>
                        </div>

                        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="text-sm font-medium text-green-900 dark:text-green-100">
                                Daily average needed:
                            </div>
                            <div className="text-lg font-bold text-green-700 dark:text-green-300">
                                {Math.round(goals.weeklyGoal / 7 * 10) / 10} completions/day
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium text-sm mb-2 text-amber-900 dark:text-amber-100">
                    💡 Goal Setting Tips
                </h4>
                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                    <li>• Start with achievable goals and increase gradually</li>
                    <li>• Focus on consistency rather than perfection</li>
                    <li>• Adjust your goals based on your progress and lifestyle changes</li>
                </ul>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Goals
            </Button>
        </form>
    );
}