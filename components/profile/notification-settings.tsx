'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { updateNotificationSettings } from '@/lib/actions/profile';
import { IProfile } from '@/lib/types';
import { toast } from 'sonner';
import { Loader2, Mail, Smartphone, Bell, FileText } from 'lucide-react';

interface NotificationSettingsProps {
    profile: IProfile;
}

export function NotificationSettings({ profile }: NotificationSettingsProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [settings, setSettings] = useState({
        email: profile.notifications.email,
        push: profile.notifications.push,
        habitReminders: profile.notifications.habitReminders,
        weeklyReports: profile.notifications.weeklyReports
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await updateNotificationSettings(settings);

            if (result.success) {
                toast.success('Notification settings updated successfully!');
                router.refresh();
            } else {
                toast.error(result.error || 'Failed to update notification settings');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div className="space-y-1">
                            <Label htmlFor="email-notifications" className="text-base font-medium">
                                Email Notifications
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Receive notifications via email
                            </p>
                        </div>
                    </div>
                    <Switch
                        id="email-notifications"
                        checked={settings.email}
                        onCheckedChange={() => handleToggle('email')}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-3">
                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                        <div className="space-y-1">
                            <Label htmlFor="push-notifications" className="text-base font-medium">
                                Push Notifications
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Receive push notifications on your device
                            </p>
                        </div>
                    </div>
                    <Switch
                        id="push-notifications"
                        checked={settings.push}
                        onCheckedChange={() => handleToggle('push')}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-3">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                        <div className="space-y-1">
                            <Label htmlFor="habit-reminders" className="text-base font-medium">
                                Habit Reminders
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Get reminded about your daily habits
                            </p>
                        </div>
                    </div>
                    <Switch
                        id="habit-reminders"
                        checked={settings.habitReminders}
                        onCheckedChange={() => handleToggle('habitReminders')}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div className="space-y-1">
                            <Label htmlFor="weekly-reports" className="text-base font-medium">
                                Weekly Reports
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Receive weekly progress summaries
                            </p>
                        </div>
                    </div>
                    <Switch
                        id="weekly-reports"
                        checked={settings.weeklyReports}
                        onCheckedChange={() => handleToggle('weeklyReports')}
                    />
                </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Notification Settings
            </Button>
        </form>
    );
}