import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, XCircle, MessageSquare, Star, TrendingUp, Calendar } from 'lucide-react';

interface HabitForFeedback {
    _id: string;
    name: string;
    description: string;
    category: string;
    priority: string;
    completedToday: boolean;
    hasFeedback: boolean;
    existingFeedback?: {
        feedback: string;
    } | null;
}

interface FeedbackSubmission {
    habitId: string;
    feedback: string;
}

interface DailyFeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    habits: HabitForFeedback[];
    onSubmit: (feedbacks: FeedbackSubmission[]) => Promise<void>;
    timeUntilExpires?: string;
}

export default function DailyFeedbackModal({
    isOpen,
    onClose,
    habits,
    onSubmit,
    timeUntilExpires
}: DailyFeedbackModalProps) {
    const [feedbacks, setFeedbacks] = useState<Record<string, FeedbackSubmission>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Initialize feedbacks with existing data
    useEffect(() => {
        if (habits.length > 0) {
            const initialFeedbacks: Record<string, FeedbackSubmission> = {};
            habits.forEach(habit => {
                initialFeedbacks[habit._id] = {
                    habitId: habit._id,
                    feedback: habit.existingFeedback?.feedback || '',
                };
            });
            setFeedbacks(initialFeedbacks);
        }
    }, [habits]);

    const updateFeedback = (habitId: string, field: 'feedback', value: string) => {
        setFeedbacks(prev => ({
            ...prev,
            [habitId]: {
                ...prev[habitId],
                [field]: value
            }
        }));
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);

            // Only submit habits with feedback text
            const feedbacksToSubmit = Object.values(feedbacks).filter(f => f.feedback.trim());

            if (feedbacksToSubmit.length === 0) {
                alert('Please provide feedback for at least one habit.');
                return;
            }

            await onSubmit(feedbacksToSubmit);
            setSubmitSuccess(true);

            // Auto close after success
            setTimeout(() => {
                setSubmitSuccess(false);
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            alert('Failed to submit feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case 'High':
                return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
            case 'Medium':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
            default:
                return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
        }
    };

    const completedHabits = habits.filter(h => h.completedToday);
    const incompleteHabits = habits.filter(h => !h.completedToday);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-background border border-border rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-primary/90 to-primary text-primary-foreground p-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 opacity-90" />
                    <div className="relative flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-primary-foreground/10 rounded-lg backdrop-blur-sm">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Daily Reflection</h2>
                                    <p className="text-primary-foreground/80 text-sm">
                                        Share your thoughts about today's habits
                                    </p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 mt-4">
                                <div className="flex items-center gap-2 text-sm bg-primary-foreground/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>{completedHabits.length} completed</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm bg-primary-foreground/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>{habits.length} total habits</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                            {timeUntilExpires && (
                                <div className="flex items-center gap-2 text-primary-foreground/80 bg-primary-foreground/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm">Expires in {timeUntilExpires}</span>
                                </div>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-primary-foreground/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 cursor-pointer" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
                    {submitSuccess ? (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full mb-6">
                                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-3">
                                Feedback Submitted Successfully!
                            </h3>
                            <p className="text-muted-foreground text-lg">
                                Thank you for sharing your thoughts. This helps you track your progress.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {habits.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="inline-flex items-center justify-center w-20 h-20 bg-muted rounded-full mb-6">
                                        <Calendar className="w-10 h-10 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-foreground mb-3">
                                        No Habits Scheduled Today
                                    </h3>
                                    <p className="text-muted-foreground text-lg">
                                        You don't have any habits scheduled for today.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Completed Habits Section */}
                                    {completedHabits.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-4">
                                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                <h3 className="text-lg font-semibold text-foreground">
                                                    Completed Habits ({completedHabits.length})
                                                </h3>
                                                <div className="flex-1 h-px bg-border" />
                                            </div>

                                            {completedHabits.map((habit) => (
                                                <div
                                                    key={habit._id}
                                                    className="group border border-border rounded-lg p-5 hover:border-green-200 dark:hover:border-green-800 transition-all duration-200 bg-card hover:shadow-md"
                                                >
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="p-1.5 bg-green-100 dark:bg-green-900/20 rounded-full">
                                                                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                                </div>
                                                                <h4 className="font-semibold text-card-foreground text-lg">{habit.name}</h4>
                                                                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getPriorityStyles(habit.priority)}`}>
                                                                    {habit.priority}
                                                                </span>
                                                            </div>
                                                            {habit.description && (
                                                                <p className="text-muted-foreground mb-2">{habit.description}</p>
                                                            )}
                                                            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                                <span>Completed today</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-card-foreground">
                                                            How did completing this habit make you feel?
                                                        </label>
                                                        <textarea
                                                            value={feedbacks[habit._id]?.feedback || ''}
                                                            onChange={(e) => updateFeedback(habit._id, 'feedback', e.target.value)}
                                                            placeholder="Share your thoughts about completing this habit today..."
                                                            className="w-full p-4 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent resize-none bg-background text-foreground placeholder:text-muted-foreground transition-all"
                                                            rows={3}
                                                            maxLength={500}
                                                        />
                                                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                                                            <span>Optional feedback</span>
                                                            <span>{feedbacks[habit._id]?.feedback?.length || 0}/500</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Incomplete Habits Section */}
                                    {incompleteHabits.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-4">
                                                <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
                                                <h3 className="text-lg font-semibold text-foreground">
                                                    Incomplete Habits ({incompleteHabits.length})
                                                </h3>
                                                <div className="flex-1 h-px bg-border" />
                                            </div>

                                            {incompleteHabits.map((habit) => (
                                                <div
                                                    key={habit._id}
                                                    className="group border border-border rounded-lg p-5 hover:border-red-200 dark:hover:border-red-800 transition-all duration-200 bg-card hover:shadow-md"
                                                >
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="p-1.5 bg-red-100 dark:bg-red-900/20 rounded-full">
                                                                    <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                                                                </div>
                                                                <h4 className="font-semibold text-card-foreground text-lg">{habit.name}</h4>
                                                                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getPriorityStyles(habit.priority)}`}>
                                                                    {habit.priority}
                                                                </span>
                                                            </div>
                                                            {habit.description && (
                                                                <p className="text-muted-foreground mb-2">{habit.description}</p>
                                                            )}
                                                            <div className="flex items-center gap-2 text-sm text-red-500 dark:text-red-400">
                                                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                                                                <span>Not completed today</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-card-foreground">
                                                            What prevented you from completing this habit?
                                                        </label>
                                                        <textarea
                                                            value={feedbacks[habit._id]?.feedback || ''}
                                                            onChange={(e) => updateFeedback(habit._id, 'feedback', e.target.value)}
                                                            placeholder="Reflect on what got in the way and how you feel about it..."
                                                            className="w-full p-4 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent resize-none bg-background text-foreground placeholder:text-muted-foreground transition-all"
                                                            rows={3}
                                                            maxLength={500}
                                                        />
                                                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                                                            <span>Optional feedback</span>
                                                            <span>{feedbacks[habit._id]?.feedback?.length || 0}/500</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!submitSuccess && habits.length > 0 && (
                    <div className="border-t  border-border bg-muted/30 backdrop-blur-sm p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Star className="w-4 h-4" />
                                <span>Share your honest thoughts to track your habit journey</span>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-5 cursor-pointer py-2.5 text-muted-foreground hover:text-foreground transition-colors font-medium"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-6 cursor-pointer py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            Submit Feedback
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}