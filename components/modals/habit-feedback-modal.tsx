import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, XCircle, MessageSquare, Star } from 'lucide-react';

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
        mood: string;
    } | null;
}

interface FeedbackSubmission {
    habitId: string;
    feedback: string;
    mood: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
}

interface DailyFeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    habits: HabitForFeedback[];
    onSubmit: (feedbacks: FeedbackSubmission[]) => Promise<void>;
    timeUntilExpires?: string;
}

const moodOptions = [
    { value: 'very_negative', label: '😤 Very Negative', color: 'text-red-600' },
    { value: 'negative', label: '😕 Negative', color: 'text-red-400' },
    { value: 'neutral', label: '😐 Neutral', color: 'text-gray-500' },
    { value: 'positive', label: '😊 Positive', color: 'text-green-400' },
    { value: 'very_positive', label: '🤩 Very Positive', color: 'text-green-600' },
];

const priorityColors = {
    High: 'border-red-200 bg-red-50',
    Medium: 'border-yellow-200 bg-yellow-50',
    Low: 'border-green-200 bg-green-50',
};

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
                    mood: (habit.existingFeedback?.mood as any) || 'neutral'
                };
            });
            setFeedbacks(initialFeedbacks);
        }
    }, [habits]);

    const updateFeedback = (habitId: string, field: 'feedback' | 'mood', value: string) => {
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <MessageSquare className="w-6 h-6" />
                                Daily Reflection
                            </h2>
                            <p className="text-blue-100 mt-1">
                                Share your thoughts about today's habits
                            </p>
                        </div>
                        <div className="text-right">
                            {timeUntilExpires && (
                                <div className="flex items-center gap-2 text-blue-100 mb-2">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm">Expires in {timeUntilExpires}</span>
                                </div>
                            )}
                            <button
                                onClick={onClose}
                                className="text-white hover:text-blue-200 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {submitSuccess ? (
                        <div className="text-center py-12">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-green-700 mb-2">
                                Feedback Submitted Successfully!
                            </h3>
                            <p className="text-gray-600">
                                Thank you for sharing your thoughts. This helps you track your progress.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {habits.length === 0 ? (
                                <div className="text-center py-12">
                                    <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                        No Habits Scheduled Today
                                    </h3>
                                    <p className="text-gray-500">
                                        You don't have any habits scheduled for today.
                                    </p>
                                </div>
                            ) : (
                                habits.map((habit) => (
                                    <div
                                        key={habit._id}
                                        className={`border-2 rounded-lg p-4 ${priorityColors[habit.priority as keyof typeof priorityColors]}`}
                                    >
                                        {/* Habit Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {habit.completedToday ? (
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-red-400" />
                                                    )}
                                                    <h3 className="font-semibold text-gray-800">{habit.name}</h3>
                                                    <span className={`px-2 py-1 text-xs rounded-full ${habit.priority === 'High' ? 'bg-red-100 text-red-700' :
                                                            habit.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-green-100 text-green-700'
                                                        }`}>
                                                        {habit.priority}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">{habit.description}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {habit.completedToday ? 'Completed today' : 'Not completed today'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Mood Selection */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                How did you feel about this habit today?
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {moodOptions.map((mood) => (
                                                    <button
                                                        key={mood.value}
                                                        onClick={() => updateFeedback(habit._id, 'mood', mood.value)}
                                                        className={`px-3 py-2 text-sm rounded-lg border transition-all ${feedbacks[habit._id]?.mood === mood.value
                                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                : 'border-gray-300 hover:border-gray-400 text-gray-700'
                                                            }`}
                                                    >
                                                        {mood.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Feedback Text */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Your thoughts and reflections
                                            </label>
                                            <textarea
                                                value={feedbacks[habit._id]?.feedback || ''}
                                                onChange={(e) => updateFeedback(habit._id, 'feedback', e.target.value)}
                                                placeholder={
                                                    habit.completedToday
                                                        ? "How did completing this habit make you feel? What went well?"
                                                        : "What prevented you from completing this habit? How do you feel about it?"
                                                }
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                rows={3}
                                                maxLength={500}
                                            />
                                            <div className="text-xs text-gray-500 mt-1">
                                                {feedbacks[habit._id]?.feedback?.length || 0}/500 characters
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!submitSuccess && habits.length > 0 && (
                    <div className="border-t bg-gray-50 p-4 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Share your honest thoughts to track your habit journey
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Feedback'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}