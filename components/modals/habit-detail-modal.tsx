// components/modals/habit-detail-modal.tsx
"use client";

import { useState } from "react";
import { Calendar, Clock, Target, TrendingUp, Zap } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { IHabit } from "@/lib/types";

interface HabitDetailModalProps {
    habit: IHabit | null;
    isOpen: boolean;
    onClose: () => void;
}

export function HabitDetailModal({ habit, isOpen, onClose }: HabitDetailModalProps) {
    if (!habit) return null;

    // Calculate completion stats
    const completions = habit.completions || [];
    const last30Days = completions.filter(completion => {
        const completionDate = new Date(completion.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return completionDate >= thirtyDaysAgo;
    });

    const completedInLast30Days = last30Days.filter(c => c.completed).length;
    const completionRate = last30Days.length > 0 ? (completedInLast30Days / last30Days.length) * 100 : 0;

    // Get recent completions for timeline
    const recentCompletions = completions
        .slice(-7)
        .reverse()
        .map(completion => ({
            ...completion,
            date: new Date(completion.date)
        }));

    const priorityColors = {
        High: "bg-red-100 text-red-800 border-red-200",
        Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
        Low: "bg-green-100 text-green-800 border-green-200"
    };

    const categoryIcons = {
        Mindfulness: "🧘",
        Health: "💪",
        Learning: "📚",
        Productivity: "⚡",
        "Digital Wellbeing": "📱"
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <span className="text-2xl">
                            {categoryIcons[habit.category as keyof typeof categoryIcons] || "📋"}
                        </span>
                        <div>
                            <h2 className="text-xl font-bold">{habit.name}</h2>
                            <p className="text-sm text-muted-foreground font-normal">
                                {habit.description}
                            </p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-4 text-center">
                                <div className="flex items-center justify-center mb-2">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                </div>
                                <div className="text-2xl font-bold">{habit.streak}</div>
                                <div className="text-xs text-muted-foreground">Day Streak</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4 text-center">
                                <div className="flex items-center justify-center mb-2">
                                    <Target className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="text-2xl font-bold">{Math.round(completionRate)}%</div>
                                <div className="text-xs text-muted-foreground">Success Rate</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4 text-center">
                                <div className="flex items-center justify-center mb-2">
                                    <Calendar className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="text-2xl font-bold">{completions.length}</div>
                                <div className="text-xs text-muted-foreground">Total Days</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4 text-center">
                                <div className="flex items-center justify-center mb-2">
                                    <Clock className="h-5 w-5 text-purple-600" />
                                </div>
                                <div className="text-2xl font-bold">{habit.timeToComplete}</div>
                                <div className="text-xs text-muted-foreground">Duration</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Habit Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Habit Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                                    <div className="mt-1">
                                        <Badge variant="secondary">{habit.category}</Badge>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Priority</label>
                                    <div className="mt-1">
                                        <Badge className={priorityColors[habit.priority as keyof typeof priorityColors]}>
                                            {habit.priority}
                                        </Badge>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Time of Day</label>
                                    <div className="mt-1 text-sm">{habit.timeOfDay}</div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Frequency</label>
                                    <div className="mt-1 text-sm">{habit.frequency}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Progress Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">30-Day Progress</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Completion Rate</span>
                                    <span>{Math.round(completionRate)}%</span>
                                </div>
                                <Progress value={completionRate} className="h-2" />
                                <div className="text-xs text-muted-foreground">
                                    {completedInLast30Days} completed out of {last30Days.length} days
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recentCompletions.length > 0 ? (
                                <div className="space-y-3">
                                    {recentCompletions.map((completion, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${completion.completed ? 'bg-green-500' : 'bg-red-500'
                                                    }`} />
                                                <div>
                                                    <div className="text-sm font-medium">
                                                        {completion.date.toLocaleDateString('tr-TR', {
                                                            weekday: 'short',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </div>
                                                    {completion.notes && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {completion.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge variant={completion.completed ? "default" : "secondary"}>
                                                {completion.completed ? "Completed" : "Skipped"}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-muted-foreground">
                                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No recent activity</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}