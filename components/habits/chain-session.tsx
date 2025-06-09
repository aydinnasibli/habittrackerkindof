// components/habits/chain-session.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
    Loader2,
    Trophy,
    Zap,
    Timer,
    Star
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
    const [motivation, setMotivation] = useState("");
    const [showCelebration, setShowCelebration] = useState(false);

    const { toast } = useToast();

    // Motivational messages
    const motivationalQuotes = [
        "You're crushing it! Keep the momentum going! 🚀",
        "Every habit completed is a step toward the best version of yourself! ⭐",
        "Consistency beats perfection. You're doing amazing! 💪",
        "Small steps, big results. You've got this! 🎯",
        "Your future self will thank you for this dedication! 🌟",
        "Building habits is building your character. Stay strong! 🏆"
    ];

    // Calculate progress and current habit with memoization
    const { completedHabits, currentHabit, progress } = useMemo(() => {
        const completed = session.habits.filter(h => h.status === 'completed').length;
        const current = session.habits[session.currentHabitIndex];
        const progressPercentage = session.totalHabits > 0 ? (completed / session.totalHabits) * 100 : 0;

        return {
            completedHabits: completed,
            currentHabit: current,
            progress: Math.round(progressPercentage)
        };
    }, [session.habits, session.currentHabitIndex, session.totalHabits]);

    // Update motivation quote every 30 seconds during active sessions
    useEffect(() => {
        if (session.status === 'active' && !session.pausedAt && !session.onBreak) {
            const interval = setInterval(() => {
                const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
                setMotivation(randomQuote);
            }, 30000);

            // Set initial quote
            const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
            setMotivation(randomQuote);

            return () => clearInterval(interval);
        }
    }, [session.status, session.pausedAt, session.onBreak]);

    // Calculate elapsed time with better precision
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (session.status === 'active' && !session.pausedAt && !session.onBreak) {
            interval = setInterval(() => {
                const now = new Date();
                const started = new Date(session.startedAt);
                const elapsed = Math.floor((now.getTime() - started.getTime()) / 1000);
                setElapsedTime(Math.max(0, elapsed - (session.pauseDuration * 60)));
            }, 1000);
        } else {
            setElapsedTime(0);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [session.startedAt, session.pauseDuration, session.status, session.pausedAt, session.onBreak]);

    // Enhanced break countdown with auto-end
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (session.onBreak && session.breakStartedAt) {
            interval = setInterval(() => {
                const now = new Date();
                const breakStart = new Date(session.breakStartedAt!);
                const elapsed = Math.floor((now.getTime() - breakStart.getTime()) / 1000);
                const remaining = Math.max(0, (5 * 60) - elapsed);
                setBreakTimeLeft(remaining);

                if (remaining === 0 && session.onBreak) {
                    handleEndBreak();
                }
            }, 1000);
        } else {
            setBreakTimeLeft(0);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [session.onBreak, session.breakStartedAt]);

    const refreshSession = useCallback(async () => {
        try {
            const updatedSession = await getActiveChainSession();
            if (updatedSession && updatedSession._id === session._id) {
                setSession(updatedSession);
            } else if (!updatedSession) {
                onSessionEnd();
            }
        } catch (error) {
            console.error('Error refreshing session:', error);
            // Only show toast occasionally to avoid spam
        }
    }, [session._id, onSessionEnd]);

    useEffect(() => {
        const interval = setInterval(refreshSession, 15000); // More frequent refresh
        return () => clearInterval(interval);
    }, [refreshSession]);

    const handleCompleteHabit = async () => {
        if (!session._id) return;

        setLoading(true);
        try {
            const result = await completeCurrentHabit(session._id, notes);

            if (result.success) {
                // Show celebration animation
                setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 2000);

                toast({
                    title: "🎉 Habit Completed!",
                    description: result.message,
                });

                if (result.isChainCompleted) {
                    toast({
                        title: "🏆 CHAIN MASTERED!",
                        description: "You're officially a habit champion! What an achievement!",
                        duration: 5000,
                    });
                    onSessionEnd();
                } else {
                    await refreshSession();
                    // Motivational message for continuing - use the latest completed count
                    const remainingHabits = session.totalHabits - completedHabits - 1;
                    if (remainingHabits > 0) {
                        toast({
                            title: "💪 Momentum Building!",
                            description: `${remainingHabits} habits to go. You're unstoppable!`,
                            duration: 3000,
                        });
                    }
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
                    description: "No worries! The important thing is you're still in the chain.",
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
                    title: session.pausedAt ? "🎯 Back in Action!" : "⏸️ Taking a Pause",
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
            const result = await startBreak(session._id, 5);

            if (result.success) {
                toast({
                    title: "☕ Break Time!",
                    description: "Take 5 minutes to recharge. You've earned it!",
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
                    title: "🚀 Refreshed & Ready!",
                    description: "Time to continue building those habits!",
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
                    title: "Session Ended",
                    description: "That's okay! Every attempt makes you stronger. Try again when you're ready!",
                });
                setShowAbandonDialog(false); // Only close on success
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
            // Don't close dialog on error - let user try again
        } finally {
            setLoading(false);
            // Remove setShowAbandonDialog(false) from here
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

    // Break screen with dark theme
    if (session.onBreak) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <Card className="border-border bg-card">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4 animate-pulse">
                            <Coffee className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-3xl text-foreground">
                            Break Time! ☕
                        </CardTitle>
                        <CardDescription className="text-lg">
                            Recharge your energy and prepare for the next habit
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-6">
                        <div className="text-5xl font-bold text-foreground animate-pulse">
                            {formatTime(breakTimeLeft)}
                        </div>
                        <p className="text-muted-foreground">
                            Time remaining • Stretch, breathe, hydrate!
                        </p>
                        <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground">
                            💡 <strong>Pro tip:</strong> Use this time to reflect on your progress or do some light stretching
                        </div>
                        <Button
                            onClick={handleEndBreak}
                            disabled={loading}
                            className="w-full"
                            size="lg"
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Zap className="mr-2 h-4 w-4" />
                            )}
                            I&aposm Ready - End Break Early
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Celebration overlay */}
            {showCelebration && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-card border rounded-lg p-8 text-center animate-bounce">
                        <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-foreground">Habit Completed! 🎉</h2>
                    </div>
                </div>
            )}

            {/* Session Header */}
            <Card className="border-border bg-card">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <Star className="h-6 w-6 text-yellow-500" />
                                {session.chainName}
                                {session.pausedAt && (
                                    <Badge variant="secondary" className="ml-2">⏸️ Paused</Badge>
                                )}
                            </CardTitle>
                            <CardDescription className="text-base mt-2">
                                Habit {session.currentHabitIndex + 1} of {session.totalHabits} • {completedHabits} completed
                            </CardDescription>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                                <Timer className="h-5 w-5" />
                                {formatTime(elapsedTime)}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                                {progress}% Complete
                            </div>
                        </div>
                    </div>
                    <Progress value={progress} className="mt-4 h-3" />
                    {motivation && !session.pausedAt && (
                        <div className="mt-4 p-3 bg-muted rounded-lg text-center text-sm font-medium text-foreground animate-fade-in">
                            {motivation}
                        </div>
                    )}
                </CardHeader>
            </Card>

            {/* Current Habit Card */}
            {currentHabit && (
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Target className="h-6 w-6 text-foreground" />
                            <span className="text-foreground">
                                {currentHabit.habitName}
                            </span>
                        </CardTitle>
                        <CardDescription className="text-base">
                            ⏱️ Estimated time: {currentHabit.duration} • Stay focused!
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {session.pausedAt ? (
                            <Alert className="border-border bg-muted">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Session is paused. Click Resume when you&aposre ready to continue!
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-muted rounded-lg p-4">
                                    <p className="text-sm text-muted-foreground font-medium">
                                        🎯 <strong>Focus Mode:</strong> Give this habit your full attention. You&aposve got this!
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <Button
                                        onClick={() => setShowCompleteDialog(true)}
                                        disabled={loading}
                                        size="lg"
                                    >
                                        <Check className="mr-2 h-4 w-4" />
                                        ✅ Complete
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowSkipDialog(true)}
                                        disabled={loading}
                                        size="lg"
                                    >
                                        <SkipForward className="mr-2 h-4 w-4" />
                                        ⏭️ Skip
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleStartBreak}
                                        disabled={loading}
                                        size="lg"
                                    >
                                        <Coffee className="mr-2 h-4 w-4" />
                                        ☕ Break
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
                    <div className="flex gap-3 justify-center">
                        <Button
                            variant="outline"
                            onClick={handlePauseResume}
                            disabled={loading}
                            size="lg"
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : session.pausedAt ? (
                                <Play className="mr-2 h-4 w-4" />
                            ) : (
                                <Pause className="mr-2 h-4 w-4" />
                            )}
                            {session.pausedAt ? '▶️ Resume' : '⏸️ Pause'}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => setShowAbandonDialog(true)}
                            disabled={loading}
                            size="lg"
                        >
                            <Square className="mr-2 h-4 w-4" />
                            🛑 End Session
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Habits Progress List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                        Chain Progress
                    </CardTitle>
                    <CardDescription>
                        Track your journey through each habit in this chain
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {session.habits.map((habit, index) => (
                            <div
                                key={`${habit.habitId}-${index}`}
                                className={`flex items-center gap-4 p-4 rounded-lg transition-all border ${index === session.currentHabitIndex
                                    ? 'bg-muted border-2 border-border shadow-md'
                                    : habit.status === 'completed'
                                        ? 'bg-muted/60 border-border'
                                        : habit.status === 'skipped'
                                            ? 'bg-muted/40 border-border'
                                            : 'bg-background border-border'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${habit.status === 'completed'
                                    ? 'bg-primary text-primary-foreground'
                                    : habit.status === 'skipped'
                                        ? 'bg-muted text-muted-foreground'
                                        : index === session.currentHabitIndex
                                            ? 'bg-primary text-primary-foreground animate-pulse'
                                            : 'bg-background border-2 border-border'
                                    }`}>
                                    {habit.status === 'completed' ? (
                                        <Check className="h-5 w-5" />
                                    ) : habit.status === 'skipped' ? (
                                        <SkipForward className="h-5 w-5" />
                                    ) : index === session.currentHabitIndex ? (
                                        <Target className="h-5 w-5" />
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-foreground">{habit.habitName}</div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Clock className="h-3 w-3" />
                                        {habit.duration}
                                    </div>
                                </div>
                                <Badge
                                    variant={
                                        habit.status === 'completed' ? 'default' :
                                            habit.status === 'skipped' ? 'secondary' :
                                                habit.status === 'active' ? 'destructive' :
                                                    'outline'
                                    }
                                    className="font-medium"
                                >
                                    {habit.status === 'completed' ? '✅ Done' :
                                        habit.status === 'skipped' ? '⏭️ Skipped' :
                                            habit.status === 'active' ? '🎯 Active' :
                                                '⏳ Waiting'}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Complete Habit Dialog */}
            <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Trophy className="h-6 w-6 text-yellow-500" />
                            Complete Habit
                        </DialogTitle>
                        <DialogDescription>
                            Awesome! You&aposre about to complete <strong>&quot{currentHabit?.habitName}&quot</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="notes">How did it go? (optional)</Label>
                            <Textarea
                                id="notes"
                                placeholder="Share your thoughts, challenges, or wins..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCompleteHabit}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Check className="mr-2 h-4 w-4" />
                            )}
                            🎉 Complete Habit!
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Skip Habit Dialog */}
            <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Skip Habit</DialogTitle>
                        <DialogDescription>
                            Skip <strong>&quot{currentHabit?.habitName}&quot</strong> and continue to the next habit. That&aposs okay!
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="skip-reason">Why are you skipping? (optional)</Label>
                            <Textarea
                                id="skip-reason"
                                placeholder="No judgment here - sometimes life happens..."
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
                            ⏭️ Skip & Continue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Abandon Session Dialog */}
            <Dialog open={showAbandonDialog} onOpenChange={setShowAbandonDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>End Session</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to end this chain session? You&aposve completed {completedHabits} out of {session.totalHabits} habits.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="bg-muted border rounded-lg p-4 text-sm text-muted-foreground">
                            💡 <strong>Remember:</strong> Progress isn&apost about perfection. Every step counts, and you can always start again!
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAbandonDialog(false)}>
                            Keep Going
                        </Button>
                        <Button variant="destructive" onClick={handleAbandonSession} disabled={loading}>
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Square className="mr-2 h-4 w-4" />
                            )}
                            End Session
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}