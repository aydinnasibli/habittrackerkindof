// components/habits/chain-session.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
    Play,
    Pause,
    Square,
    Check,
    SkipForward,
    Coffee,
    Clock,
    Target,
    AlertCircle,
    Loader2
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Alert,
    AlertDescription,
} from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { IChainSession } from "@/lib/types";
import {
    completeCurrentHabit,
    skipCurrentHabit,
    pauseChainSession,
    resumeChainSession,
    abandonChainSession,
    startBreak,
    endBreak,
    getActiveChainSession
} from "@/lib/actions/chainSessions";

interface ChainSessionProps {
    initialSession: IChainSession;
    onSessionEnd: () => void;
}

export function ChainSession({ initialSession, onSessionEnd }: ChainSessionProps) {
    const [session, setSession] = useState<IChainSession>(initialSession);
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState("");
    const [skipReason, setSkipReason] = useState("");
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);
    const [showSkipDialog, setShowSkipDialog] = useState(false);
    const [showAbandonDialog, setShowAbandonDialog] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [breakTimeLeft, setBreakTimeLeft] = useState(0);

    const { toast } = useToast();

    // Calculate elapsed time
    useEffect(() => {
        const interval = setInterval(() => {
            if (session.status === 'active' && !session.pausedAt && !session.onBreak) {
                const now = new Date();
                const started = new Date(session.startedAt);
                const elapsed = Math.floor((now.getTime() - started.getTime()) / 1000);
                setElapsedTime(elapsed - (session.pauseDuration * 60));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [session.startedAt, session.pauseDuration, session.status, session.pausedAt, session.onBreak]);

    // Handle break countdown
    useEffect(() => {
        if (session.onBreak && session.breakStartedAt) {
            const interval = setInterval(() => {
                const now = new Date();
                const breakStart = new Date(session.breakStartedAt!);
                const elapsed = Math.floor((now.getTime() - breakStart.getTime()) / 1000);
                const remaining = Math.max(0, (5 * 60) - elapsed); // 5 minute break
                setBreakTimeLeft(remaining);

                if (remaining === 0) {
                    handleEndBreak();
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [session.onBreak, session.breakStartedAt]);

    // Refresh session data periodically
    const refreshSession = useCallback(async () => {
        try {
            const updatedSession = await getActiveChainSession();
            if (updatedSession && updatedSession._id === session._id) {
                setSession(updatedSession);
            } else if (!updatedSession) {
                // Session ended
                onSessionEnd();
            }
        } catch (error) {
            console.error('Error refreshing session:', error);
        }
    }, [session._id, onSessionEnd]);

    useEffect(() => {
        const interval = setInterval(refreshSession, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [refreshSession]);

    const currentHabit = session.habits[session.currentHabitIndex];
    const progress = ((session.currentHabitIndex + (currentHabit?.status === 'completed' ? 1 : 0)) / session.totalHabits) * 100;

    const handleCompleteHabit = async () => {
        if (!session._id) return;

        setLoading(true);
        try {
            const result = await completeCurrentHabit(session._id, notes);

            if (result.success) {
                toast({
                    title: "Habit Completed!",
                    description: result.message,
                });

                if (result.isChainCompleted) {
                    toast({
                        title: "🎉 Chain Completed!",
                        description: "Congratulations on completing your habit chain!",
                    });
                    onSessionEnd();
                } else {
                    await refreshSession();
                }

                setNotes("");
                setShowCompleteDialog(false);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error completing habit:', error);
            toast({
                title: "Error",
                description: "Failed to complete habit. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSkipHabit = async () => {
        if (!session._id) return;

        setLoading(true);
        try {
            const result = await skipCurrentHabit(session._id, skipReason);

            if (result.success) {
                toast({
                    title: "Habit Skipped",
                    description: result.message,
                });

                if (result.isChainCompleted) {
                    onSessionEnd();
                } else {
                    await refreshSession();
                }

                setSkipReason("");
                setShowSkipDialog(false);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error skipping habit:', error);
            toast({
                title: "Error",
                description: "Failed to skip habit. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePauseResume = async () => {
        if (!session._id) return;

        setLoading(true);
        try {
            const result = session.pausedAt
                ? await resumeChainSession(session._id)
                : await pauseChainSession(session._id);

            if (result.success) {
                toast({
                    title: session.pausedAt ? "Session Resumed" : "Session Paused",
                    description: result.message,
                });
                await refreshSession();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error pausing/resuming session:', error);
            toast({
                title: "Error",
                description: "Failed to pause/resume session. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStartBreak = async () => {
        if (!session._id) return;

        setLoading(true);
        try {
            const result = await startBreak(session._id, 5); // 5 minute break

            if (result.success) {
                toast({
                    title: "Break Started",
                    description: "Take a 5-minute break. You deserve it!",
                });
                await refreshSession();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error starting break:', error);
            toast({
                title: "Error",
                description: "Failed to start break. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEndBreak = async () => {
        if (!session._id) return;

        setLoading(true);
        try {
            const result = await endBreak(session._id);

            if (result.success) {
                toast({
                    title: "Break Ended",
                    description: "Ready to continue with your habits!",
                });
                await refreshSession();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error ending break:', error);
            toast({
                title: "Error",
                description: "Failed to end break. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAbandonSession = async () => {
        if (!session._id) return;

        setLoading(true);
        try {
            const result = await abandonChainSession(session._id);

            if (result.success) {
                toast({
                    title: "Session Abandoned",
                    description: result.message,
                });
                onSessionEnd();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error abandoning session:', error);
            toast({
                title: "Error",
                description: "Failed to abandon session. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
            setShowAbandonDialog(false);
        }
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    if (session.onBreak) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <Coffee className="h-8 w-8 text-blue-600" />
                        </div>
                        <CardTitle className="text-2xl">Break Time!</CardTitle>
                        <CardDescription>
                            Take a moment to rest and recharge
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-6">
                        <div className="text-4xl font-bold text-blue-600">
                            {formatTime(breakTimeLeft)}
                        </div>
                        <p className="text-muted-foreground">
                            Time remaining in your break
                        </p>
                        <Button
                            onClick={handleEndBreak}
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Play className="mr-2 h-4 w-4" />
                            )}
                            End Break Early
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Session Header */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                {session.chainName}
                                {session.pausedAt && (
                                    <Badge variant="secondary">Paused</Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                Habit {session.currentHabitIndex + 1} of {session.totalHabits}
                            </CardDescription>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatTime(elapsedTime)}
                            </div>
                        </div>
                    </div>
                    <Progress value={progress} className="mt-4" />
                </CardHeader>
            </Card>

            {/* Current Habit */}
            {currentHabit && (
                <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-green-600" />
                            Current: {currentHabit.habitName}
                        </CardTitle>
                        <CardDescription>
                            Estimated time: {currentHabit.duration}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {session.pausedAt ? (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Session is paused. Resume to continue with this habit.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Focus on completing this habit before moving to the next one.
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                    <Button
                                        onClick={() => setShowCompleteDialog(true)}
                                        disabled={loading}
                                        className="flex-1 min-w-[120px]"
                                    >
                                        <Check className="mr-2 h-4 w-4" />
                                        Complete
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowSkipDialog(true)}
                                        disabled={loading}
                                        className="flex-1 min-w-[120px]"
                                    >
                                        <SkipForward className="mr-2 h-4 w-4" />
                                        Skip
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleStartBreak}
                                        disabled={loading}
                                        className="flex-1 min-w-[120px]"
                                    >
                                        <Coffee className="mr-2 h-4 w-4" />
                                        Break
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Session Controls */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-2 justify-center">
                        <Button
                            variant="outline"
                            onClick={handlePauseResume}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : session.pausedAt ? (
                                <Play className="mr-2 h-4 w-4" />
                            ) : (
                                <Pause className="mr-2 h-4 w-4" />
                            )}
                            {session.pausedAt ? 'Resume' : 'Pause'}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => setShowAbandonDialog(true)}
                            disabled={loading}
                        >
                            <Square className="mr-2 h-4 w-4" />
                            Abandon
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Habits List */}
            <Card>
                <CardHeader>
                    <CardTitle>Chain Progress</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {session.habits.map((habit, index) => (
                            <div
                                key={`${habit.habitId}-${index}`}
                                className={`flex items-center gap-3 p-3 rounded-md ${index === session.currentHabitIndex
                                    ? 'bg-green-100 border border-green-200'
                                    : habit.status === 'completed'
                                        ? 'bg-gray-100'
                                        : habit.status === 'skipped'
                                            ? 'bg-yellow-100'
                                            : 'bg-muted'
                                    }`}
                            >
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium bg-white border">
                                    {habit.status === 'completed' ? (
                                        <Check className="h-4 w-4 text-green-600" />
                                    ) : habit.status === 'skipped' ? (
                                        <SkipForward className="h-4 w-4 text-yellow-600" />
                                    ) : index === session.currentHabitIndex ? (
                                        <Target className="h-4 w-4 text-green-600" />
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium">{habit.habitName}</div>
                                    <div className="text-sm text-muted-foreground">{habit.duration}</div>
                                </div>
                                <Badge
                                    variant={
                                        habit.status === 'completed' ? 'default' :
                                            habit.status === 'skipped' ? 'secondary' :
                                                habit.status === 'active' ? 'destructive' :
                                                    'outline'
                                    }
                                >
                                    {habit.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Complete Habit Dialog */}
            <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Complete Habit</DialogTitle>
                        <DialogDescription>
                            Mark "{currentHabit?.habitName}" as completed
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (optional)</Label>
                            <Textarea
                                id="notes"
                                placeholder="How did it go? Any thoughts or reflections?"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCompleteHabit} disabled={loading}>
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Check className="mr-2 h-4 w-4" />
                            )}
                            Complete Habit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Skip Habit Dialog */}
            <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Skip Habit</DialogTitle>
                        <DialogDescription>
                            Skip "{currentHabit?.habitName}" and move to the next habit
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="skip-reason">Reason for skipping (optional)</Label>
                            <Textarea
                                id="skip-reason"
                                placeholder="Why are you skipping this habit?"
                                value={skipReason}
                                onChange={(e) => setSkipReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSkipDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="secondary" onClick={handleSkipHabit} disabled={loading}>
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <SkipForward className="mr-2 h-4 w-4" />
                            )}
                            Skip Habit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Abandon Session Dialog */}
            <Dialog open={showAbandonDialog} onOpenChange={setShowAbandonDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Abandon Session</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to abandon this chain session? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAbandonDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleAbandonSession} disabled={loading}>
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Square className="mr-2 h-4 w-4" />
                            )}
                            Abandon Session
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}