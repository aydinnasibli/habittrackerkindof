'use client';

import React, { useState, useEffect } from 'react';
import { Clock, X, Target, Compass } from 'lucide-react';
import DailyFeedbackModal from '@/components/modals/habit-feedback-modal';
import { canSubmitFeedback, getTodaysHabitsForFeedback, submitDailyFeedback } from '@/lib/actions/feedback';
import EthosLogo from '@/app/assets/ethosts.png';
import Image from 'next/image';
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
    const [isHovered, setIsHovered] = useState(false);

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
            <div className="fixed bottom-8 right-8 z-50">
                <div className="relative group">
                    {/* Notification indicator */}
                    {hasNewFeedback && (
                        <div className="absolute -top-2 -right-2 z-20">
                            <div className="relative">
                                <div className="w-4 h-4 bg-amber-500 rounded-full border-2 border-gray-900 shadow-lg" />
                                <div className="absolute inset-0 w-4 h-4 bg-amber-500 rounded-full animate-ping opacity-75" />
                            </div>
                        </div>
                    )}

                    {/* Main Button */}
                    <button
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        onClick={handleOpenModal}
                        disabled={isLoading}
                        className="relative bg-gray-900 hover:bg-gray-800 text-gray-100 rounded-2xl p-4 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 hover:border-gray-600 backdrop-blur-sm"
                        title="Ethos Daily Reflection"
                    >
                        {/* Subtle gradient overlay */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-gray-800/50 to-gray-600/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />

                        {/* Button content */}
                        <div className="relative z-10">
                            {isLoading ? (
                                <div className="w-7 h-7 border-2 border-gray-400 border-t-gray-100 rounded-full animate-spin" />
                            ) : (
                                <Image src={EthosLogo} alt="Ethos Logo" className="w-7 h-7 cursor-pointer scale-200 text-gray-100 group-hover:text-white transition-colors duration-200" />
                            )}
                        </div>

                        {/* Subtle inner glow on hover */}
                        <div className="absolute inset-1 rounded-xl bg-gradient-to-tr from-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>

                    {/* Professional tooltip */}
                    <div className={`absolute bottom-full right-0 mb-4 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                        } pointer-events-none`}>
                        <div className="bg-gray-900 border border-gray-700 text-gray-100 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">Daily Reflection</span>
                                {hasNewFeedback && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                        Pending
                                    </span>
                                )}
                            </div>
                            {timeUntilExpires && (
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    <span>Available for {timeUntilExpires}</span>
                                </div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                                Reflect on your habits and values
                            </div>
                        </div>

                        {/* Tooltip arrow */}
                        <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
                    </div>

                    {/* Subtle background glow effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-gray-800/20 to-gray-600/10 blur-xl scale-110 opacity-50 group-hover:opacity-75 transition-opacity duration-300 -z-10" />
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