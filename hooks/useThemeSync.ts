// hooks/useThemeSync.ts
'use client';

import { useUser } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface UseThemeSyncReturn {
    isLoading: boolean;
    error: string | null;
}

export function useThemeSync(): UseThemeSyncReturn {
    const { isSignedIn, user } = useUser();
    const { setTheme, resolvedTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const syncTheme = async () => {
            // Only sync if user is signed in and we have a user ID
            if (!isSignedIn || !user?.id) {
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                // Fetch user profile to get theme preference
                const response = await fetch('/api/profile/theme', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch theme: ${response.statusText}`);
                }

                const data = await response.json();

                // Only update theme if component is still mounted and we got a valid theme
                if (isMounted && data.success && data.theme) {
                    const userTheme = data.theme;

                    // Only set theme if it's different from current resolved theme
                    // This prevents unnecessary theme changes and flickering
                    if (userTheme !== resolvedTheme) {
                        setTheme(userTheme);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    const errorMessage = err instanceof Error ? err.message : 'Failed to sync theme';
                    setError(errorMessage);
                    console.error('Theme sync error:', errorMessage);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        // Small delay to ensure Clerk has finished loading
        const timeoutId = setTimeout(syncTheme, 100);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [isSignedIn, user?.id, setTheme, resolvedTheme]);

    return { isLoading, error };
}