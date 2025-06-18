'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, X } from 'lucide-react';
import DailyFeedbackModal from '@/components/modals/habit-feedback-modal';
import { canSubmitFeedback, getTodaysHabitsForFeedback, submitDailyFeedback } from '@/lib/actions/feedback';

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

export default function FloatingFeedbackButton() {
    const [canSubmit, setCanSubmit] = useState(false);
    const [timeUntilExpires, setTimeUntilExpires] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [habits, setHabits] = useState<HabitForFeedback[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [hasNewFeedback, setHasNewFeedback] = useState(false);

    // Get user's timezone
    const getUserTimezone = () => {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch {
            return 'UTC';
        }
    };

    // Check feedback availability and update state
    const checkFeedbackAvailability = async () => {
        try {
            const timezone = getUserTimezone();
            const result = await canSubmitFeedback(timezone);

            setCanSubmit(result.canSubmit);
            setTimeUntilExpires(result.timeUntilExpires || '');

            // Show button only if feedback can be submitted
            setIsVisible(result.canSubmit);

        } catch (error) {
            console.error('Error checking feedback availability:', error);
            setIsVisible(false);
        }
    };

    // Load today's habits for feedback
    const loadTodaysHabits = async () => {
        try {
            setIsLoading(true);
            const timezone = getUserTimezone();
            const todaysHabits = await getTodaysHabitsForFeedback(timezone);
            setHabits(todaysHabits);

            // Check if there are habits without feedback
            const habitsNeedingFeedback = todaysHabits.filter(h => !h.hasFeedback);
            setHasNewFeedback(habitsNeedingFeedback.length > 0);

        } catch (error) {
            console.error('Error loading today\'s habits:', error);
            setHabits([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle feedback submission
    const handleFeedbackSubmit = async (feedbacks: FeedbackSubmission[]) => {
        try {
            const timezone = getUserTimezone();
            const result = await submitDailyFeedback(feedbacks, timezone);

            if (result.success) {
                // Reload habits to update feedback status
                await loadTodaysHabits();
                // Check if we still need to show the notification dot
                const updatedHabits = await getTodaysHabitsForFeedback(timezone);
                const stillNeedsFeedback = updatedHabits.filter(h => !h.hasFeedback);
                setHasNewFeedback(stillNeedsFeedback.length > 0);
            } else {
                throw new Error(result.error || 'Failed to submit feedback');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            throw error;
        }
    };

    // Open modal and load habits
    const handleOpenModal = async () => {
        setIsModalOpen(true);
        await loadTodaysHabits();
    };

    // Set up periodic checks
    useEffect(() => {
        // Initial check
        checkFeedbackAvailability();

        // Check every minute
        const interval = setInterval(checkFeedbackAvailability, 60000);

        return () => clearInterval(interval);
    }, []);

    // Load habits when button becomes visible
    useEffect(() => {
        if (isVisible && canSubmit) {
            loadTodaysHabits();
        }
    }, [isVisible, canSubmit]);

    // Don't render if not visible
    if (!isVisible || !canSubmit) {
        return null;
    }

    return (
        <>
            {/* Floating Button */}
            <div className="fixed bottom-6 right-6 z-40">
                <div className="relative">
                    {/* Notification dot for new feedback needed */}
                    {hasNewFeedback && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse z-10" />
                    )}

                    {/* Main Button */}
                    <button
                        onClick={handleOpenModal}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Daily Reflection - Share your thoughts about today's habits"
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <MessageSquare className="w-6 h-6" />
                        )}
                    </button>

                    {/* Time indicator tooltip */}
                    {timeUntilExpires && (
                        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Expires in {timeUntilExpires}</span>
                            </div>
                            {/* Arrow */}
                            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800" />
                        </div>
                    )}
                </div>

                {/* Floating text indicator */}
                <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-white rounded-lg shadow-lg border text-sm text-gray-700 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    Daily Reflection
                    {hasNewFeedback && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
                            New
                        </span>
                    )}
                </div>
            </div>

            {/* Feedback Modal */}
            <DailyFeedbackModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                habits={habits}
                onSubmit={handleFeedbackSubmit}
                timeUntilExpires={timeUntilExpires}
            />
        </>
    );
}