"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    SkipForward,
    Play,
    Trophy,
    Target,
    Timer,
    Loader2,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { IChainSession } from "@/lib/types";
import { getPastChainSessions } from "@/lib/actions/chainSessions";
import { useToast } from "@/hooks/use-toast";

export function PastSessions() {
    const [sessions, setSessions] = useState<IChainSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
    const { toast } = useToast();

    useEffect(() => {
        loadPastSessions();
    }, []);

    const loadPastSessions = async () => {
        try {
            setLoading(true);
            const pastSessions = await getPastChainSessions();
            setSessions(pastSessions);
        } catch (error) {
            console.error('Error loading past sessions:', error);
            toast({
                title: "Error",
                description: "Failed to load past sessions. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleSessionExpansion = (sessionId: string) => {
        const newExpanded = new Set(expandedSessions);
        if (newExpanded.has(sessionId)) {
            newExpanded.delete(sessionId);
        } else {
            newExpanded.add(sessionId);
        }
        setExpandedSessions(newExpanded);
    };

    const formatDuration = (minutes?: number) => {
        if (!minutes) return "N/A";
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    };

    const getSessionStats = (session: IChainSession) => {
        const completed = session.habits.filter(h => h.status === 'completed').length;
        const skipped = session.habits.filter(h => h.status === 'skipped').length;
        const completionRate = Math.round((completed / session.totalHabits) * 100);

        return { completed, skipped, completionRate };
    };

    const getStatusBadge = (status: string, completionRate: number) => {
        switch (status) {
            case 'completed':
                if (completionRate === 100) {
                    return <Badge className="bg-emerald-600 hover:bg-emerald-700">🏆 Perfect</Badge>;
                } else {
                    return <Badge className="bg-blue-600 hover:bg-blue-700">✅ Completed</Badge>;
                }
            case 'abandoned':
                return <Badge variant="destructive">❌ Abandoned</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getHabitStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-emerald-500" />;
            case 'skipped':
                return <SkipForward className="h-4 w-4 text-yellow-500" />;
            case 'active':
                return <Play className="h-4 w-4 text-blue-500" />;
            default:
                return <Timer className="h-4 w-4 text-gray-400" />;
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading past sessions...</span>
                </div>
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <Card className="border-muted">
                <CardContent className="text-center py-12">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trophy className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Past Sessions Yet</h3>
                    <p className="text-muted-foreground mb-6">
                        Complete your first habit chain session to see your progress history here!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Past Sessions</h2>
                <p className="text-muted-foreground">
                    Review your habit chain journey and track your progress over time
                </p>
            </div>

            <div className="space-y-4">
                {sessions.map((session) => {
                    const stats = getSessionStats(session);
                    const isExpanded = expandedSessions.has(session._id!);

                    return (
                        <Card key={session._id} className="overflow-hidden">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CardTitle className="text-lg">{session.chainName}</CardTitle>
                                            {getStatusBadge(session.status, stats.completionRate)}
                                        </div>
                                        <CardDescription className="flex items-center gap-4 text-sm">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {formatDate(session.startedAt)}
                                            </span>
                                            {session.actualDuration && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    {formatDuration(session.actualDuration)}
                                                </span>
                                            )}
                                        </CardDescription>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-primary">
                                            {stats.completionRate}%
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            completion
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-0">
                                {/* Summary Stats */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="text-center p-3 bg-muted/50 rounded-md">
                                        <div className="flex items-center justify-center mb-1">
                                            <CheckCircle className="h-4 w-4 text-emerald-500 mr-1" />
                                            <span className="font-semibold text-emerald-600">{stats.completed}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">Completed</div>
                                    </div>
                                    <div className="text-center p-3 bg-muted/50 rounded-md">
                                        <div className="flex items-center justify-center mb-1">
                                            <SkipForward className="h-4 w-4 text-yellow-500 mr-1" />
                                            <span className="font-semibold text-yellow-600">{stats.skipped}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">Skipped</div>
                                    </div>
                                    <div className="text-center p-3 bg-muted/50 rounded-md">
                                        <div className="flex items-center justify-center mb-1">
                                            <Target className="h-4 w-4 text-blue-500 mr-1" />
                                            <span className="font-semibold text-blue-600">{session.totalHabits}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">Total</div>
                                    </div>
                                </div>

                                {/* Expandable Habit Details */}
                                <Collapsible>
                                    <CollapsibleTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="w-full flex items-center justify-between p-2 hover:bg-muted/50"
                                            onClick={() => toggleSessionExpansion(session._id!)}
                                        >
                                            <span className="text-sm font-medium">View Habit Details</span>
                                            {isExpanded ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="space-y-2 mt-3">
                                        {session.habits.map((habit, index) => (
                                            <div
                                                key={`${habit.habitId}-${index}`}
                                                className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border/50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-medium w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                                                        {index + 1}
                                                    </span>
                                                    {getHabitStatusIcon(habit.status)}
                                                    <div>
                                                        <div className="font-medium">{habit.habitName}</div>
                                                        {habit.notes && (
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                💭 {habit.notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant="outline" className="text-xs">
                                                        {habit.duration}
                                                    </Badge>
                                                    {habit.completedAt && (
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            {new Intl.DateTimeFormat('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            }).format(new Date(habit.completedAt))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </CollapsibleContent>
                                </Collapsible>

                                {/* Additional session info */}
                                {(session.pauseDuration > 0 || session.completedAt) && (
                                    <div className="mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                                        <div className="flex justify-between items-center">
                                            {session.pauseDuration > 0 && (
                                                <span>⏸️ Paused for {formatDuration(session.pauseDuration)}</span>
                                            )}
                                            {session.completedAt && (
                                                <span>
                                                    🏁 Finished at {new Intl.DateTimeFormat('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }).format(new Date(session.completedAt))}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}