'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updatePrivacySettings } from '@/lib/actions/profile';
import { IProfile } from '@/lib/types';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, TrendingUp, Zap } from 'lucide-react';

interface PrivacySettingsProps {
    profile: IProfile;
}

export function PrivacySettings({ profile }: PrivacySettingsProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [settings, setSettings] = useState({
        profileVisibility: profile.privacy.profileVisibility,
        showStreak: profile.privacy.showStreak,
        showProgress: profile.privacy.showProgress
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await updatePrivacySettings(settings);

            if (result.success) {
                toast.success('Privacy settings updated successfully!');
                router.refresh();
            } else {
                toast.error(result.error || 'Failed to update privacy settings');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = (key: 'showStreak' | 'showProgress') => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleVisibilityChange = (value: 'public' | 'private') => {
        setSettings(prev => ({ ...prev, profileVisibility: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
                <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                        <Eye className="h-5 w-5 text-muted-foreground" />
                        <div className="space-y-1">
                            <Label className="text-base font-medium">Profile Visibility</Label>
                            <p className="text-sm text-muted-foreground">
                                Control who can see your profile and statistics
                            </p>
                        </div>
                    </div>
                    <Select
                        value={settings.profileVisibility}
                        onValueChange={handleVisibilityChange}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="private">
                                <div className="flex items-center space-x-2">
                                    <EyeOff className="h-4 w-4" />
                                    <div>
                                        <div className="font-medium">Private</div>
                                        <div className="text-sm text-muted-foreground">Only you can see your profile</div>
                                    </div>
                                </div>
                            </SelectItem>
                            <SelectItem value="public">
                                <div className="flex items-center space-x-2">
                                    <Eye className="h-4 w-4" />
                                    <div>
                                        <div className="font-medium">Public</div>
                                        <div className="text-sm text-muted-foreground">Anyone can see your profile</div>
                                    </div>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-3">
                        <Zap className="h-5 w-5 text-muted-foreground" />
                        <div className="space-y-1">
                            <Label htmlFor="show-streak" className="text-base font-medium">
                                Show Streak Count
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Display your current habit streaks on your profile
                            </p>
                        </div>
                    </div>
                    <Switch
                        id="show-streak"
                        checked={settings.showStreak}
                        onCheckedChange={() => handleToggle('showStreak')}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-3">
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        <div className="space-y-1">
                            <Label htmlFor="show-progress" className="text-base font-medium">
                                Show Progress Statistics
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Display your habit completion rates and progress charts
                            </p>
                        </div>
                    </div>
                    <Switch
                        id="show-progress"
                        checked={settings.showProgress}
                        onCheckedChange={() => handleToggle('showProgress')}
                    />
                </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-sm mb-2">Privacy Note</h4>
                <p className="text-sm text-muted-foreground">
                    Your personal information like email and private notes are never shared publicly,
                    regardless of these settings. These options only control visibility of your habit
                    progress and statistics.
                </p>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Privacy Settings
            </Button>
        </form>
    );
}