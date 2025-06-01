'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
    User,
    Settings,
    Bell,
    Shield,
    Target,
    Trophy,
    Star,
    Palette,
    Save,
    Calendar,
    Clock,
    Globe,
    Eye,
    EyeOff,
    Award,
    TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getOrCreateProfile, updateProfile, updateNotificationSettings, updatePrivacySettings, updateGoals } from '@/lib/actions/profile';
import { IProfile, RANK_REQUIREMENTS } from '@/lib/types';

// Enhanced theme options
const THEME_OPTIONS = [
    { value: 'light', label: 'Light', description: 'Clean and bright', color: 'bg-white border-gray-200' },
    { value: 'dark', label: 'Dark', description: 'Easy on the eyes', color: 'bg-gray-900 border-gray-700' },
    { value: 'system', label: 'System', description: 'Follows your device', color: 'bg-gradient-to-r from-gray-100 to-gray-200' },
    { value: 'midnight', label: 'Midnight', description: 'Deep black theme', color: 'bg-black border-gray-800' },
    { value: 'forest', label: 'Forest', description: 'Nature inspired', color: 'bg-gradient-to-r from-green-900 to-emerald-800' },
    { value: 'ocean', label: 'Ocean', description: 'Calm blue tones', color: 'bg-gradient-to-r from-blue-900 to-indigo-800' },
    { value: 'sunset', label: 'Sunset', description: 'Warm orange hues', color: 'bg-gradient-to-r from-orange-800 to-red-700' },
    { value: 'lavender', label: 'Lavender', description: 'Soft purple theme', color: 'bg-gradient-to-r from-purple-800 to-violet-700' }
];

const TIME_FORMATS = [
    { value: '12h', label: '12-hour (AM/PM)' },
    { value: '24h', label: '24-hour' }
];

const DATE_FORMATS = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' }
];

export default function ProfilePage() {
    const { user } = useUser();
    const { toast } = useToast();
    const [profile, setProfile] = useState<IProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states
    const [personalInfo, setPersonalInfo] = useState({
        firstName: '',
        lastName: '',
        userName: '',
        bio: ''
    });

    const [preferences, setPreferences] = useState({
        timeFormat: '12h' as '12h' | '24h',
        theme: 'system' as string
    });

    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        habitReminders: true,
        weeklyReports: true
    });

    const [privacy, setPrivacy] = useState({
        profileVisibility: 'private' as 'public' | 'private',
        showStreak: true,
        showProgress: true
    });

    const [goals, setGoals] = useState({
        dailyHabitTarget: 3,
        weeklyGoal: 21
    });

    // Load profile data
    useEffect(() => {
        async function loadProfile() {
            try {
                const profileData = await getOrCreateProfile();
                if (profileData) {
                    setProfile(profileData);
                    setPersonalInfo({
                        firstName: profileData.firstName || '',
                        lastName: profileData.lastName || '',
                        userName: profileData.userName || '',
                        bio: profileData.bio || ''
                    });
                    setPreferences({
                        timeFormat: profileData.timeFormat,
                        theme: profileData.theme
                    });
                    setNotifications(profileData.notifications);
                    setPrivacy(profileData.privacy);
                    setGoals(profileData.goals);
                }
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to load profile data",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [toast]);
    // Apply theme when preferences change
    useEffect(() => {
        if (preferences.theme && typeof window !== 'undefined') {
            document.documentElement.setAttribute('data-theme', preferences.theme);
            document.documentElement.className = preferences.theme;
        }
    }, [preferences.theme]);
    // Save functions
    const savePersonalInfo = async () => {
        setSaving(true);
        try {
            const result = await updateProfile(personalInfo);
            if (result.success) {
                toast({
                    title: "Success",
                    description: "Personal information updated successfully",
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update personal information",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const savePreferences = async () => {
        setSaving(true);
        try {
            const result = await updateProfile(preferences);
            if (result.success) {
                // Apply theme immediately after saving
                if (typeof window !== 'undefined') {
                    document.documentElement.setAttribute('data-theme', preferences.theme);
                    document.documentElement.className = preferences.theme;
                }

                toast({
                    title: "Success",
                    description: "Preferences updated successfully",
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update preferences",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const saveNotifications = async () => {
        setSaving(true);
        try {
            const result = await updateNotificationSettings(notifications);
            if (result.success) {
                toast({
                    title: "Success",
                    description: "Notification settings updated successfully",
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update notification settings",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const savePrivacy = async () => {
        setSaving(true);
        try {
            const result = await updatePrivacySettings(privacy);
            if (result.success) {
                toast({
                    title: "Success",
                    description: "Privacy settings updated successfully",
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update privacy settings",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const saveGoals = async () => {
        setSaving(true);
        try {
            const result = await updateGoals(goals);
            if (result.success) {
                toast({
                    title: "Success",
                    description: "Goals updated successfully",
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update goals",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    // Get rank progress
    const getRankProgress = () => {
        if (!profile?.xp) return { current: 'Novice', progress: 0, nextXP: 500 };

        const totalXP = profile.xp.total;
        const currentRank = Object.values(RANK_REQUIREMENTS).find(
            rank => totalXP >= rank.minXP && totalXP <= rank.maxXP
        );

        if (!currentRank) return { current: 'Legend', progress: 100, nextXP: 0 };

        const progress = ((totalXP - currentRank.minXP) / (currentRank.maxXP - currentRank.minXP)) * 100;
        const nextXP = currentRank.maxXP === Infinity ? 0 : currentRank.maxXP - totalXP + 1;

        return { current: currentRank.title, progress: Math.min(progress, 100), nextXP };
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <div className="flex items-center justify-center h-96">
                    <div className="animate-pulse text-lg">Loading profile...</div>
                </div>
            </div>
        );
    }

    const rankInfo = getRankProgress();
    const initials = `${personalInfo.firstName?.[0] || ''}${personalInfo.lastName?.[0] || ''}`.toUpperCase() || user?.firstName?.[0] || 'U';

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-6">
            {/* Profile Header */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center space-x-6">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user?.imageUrl} />
                            <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold">
                                {personalInfo.firstName || personalInfo.lastName
                                    ? `${personalInfo.firstName} ${personalInfo.lastName}`.trim()
                                    : personalInfo.userName || 'Your Profile'}
                            </h1>
                            <p className="text-muted-foreground">{profile?.email}</p>
                            <div className="flex items-center space-x-4 mt-2">
                                <Badge variant="secondary" className="flex items-center space-x-1">
                                    <Trophy className="h-3 w-3" />
                                    <span>{rankInfo.current}</span>
                                </Badge>
                                <div className="flex items-center space-x-2">
                                    <Star className="h-4 w-4 text-yellow-500" />
                                    <span className="text-sm font-medium">{profile?.xp?.total || 0} XP</span>
                                </div>
                            </div>
                            {rankInfo.nextXP > 0 && (
                                <div className="mt-3 space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span>Progress to next rank</span>
                                        <span>{rankInfo.nextXP} XP to go</span>
                                    </div>
                                    <Progress value={rankInfo.progress} className="h-2" />
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                            <Target className="h-5 w-5 text-blue-500" />
                            <div>
                                <p className="text-2xl font-bold">{profile?.stats?.totalHabitsCreated || 0}</p>
                                <p className="text-sm text-muted-foreground">Habits Created</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                            <Award className="h-5 w-5 text-green-500" />
                            <div>
                                <p className="text-2xl font-bold">{profile?.stats?.totalCompletions || 0}</p>
                                <p className="text-sm text-muted-foreground">Completions</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                            <TrendingUp className="h-5 w-5 text-orange-500" />
                            <div>
                                <p className="text-2xl font-bold">{profile?.stats?.longestStreak || 0}</p>
                                <p className="text-sm text-muted-foreground">Longest Streak</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                            <Trophy className="h-5 w-5 text-purple-500" />
                            <div>
                                <p className="text-2xl font-bold">{profile?.stats?.totalChainsCompleted || 0}</p>
                                <p className="text-sm text-muted-foreground">Chains Completed</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Settings Tabs */}
            <Tabs defaultValue="personal" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="personal" className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">Personal</span>
                    </TabsTrigger>
                    <TabsTrigger value="preferences" className="flex items-center space-x-2">
                        <Settings className="h-4 w-4" />
                        <span className="hidden sm:inline">Preferences</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center space-x-2">
                        <Bell className="h-4 w-4" />
                        <span className="hidden sm:inline">Notifications</span>
                    </TabsTrigger>
                    <TabsTrigger value="privacy" className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span className="hidden sm:inline">Privacy</span>
                    </TabsTrigger>
                    <TabsTrigger value="goals" className="flex items-center space-x-2">
                        <Target className="h-4 w-4" />
                        <span className="hidden sm:inline">Goals</span>
                    </TabsTrigger>
                </TabsList>

                {/* Personal Information */}
                <TabsContent value="personal">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your personal details and bio</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        value={personalInfo.firstName}
                                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, firstName: e.target.value }))}
                                        placeholder="Enter your first name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        value={personalInfo.lastName}
                                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, lastName: e.target.value }))}
                                        placeholder="Enter your last name"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="userName">Username</Label>
                                <Input
                                    id="userName"
                                    value={personalInfo.userName}
                                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, userName: e.target.value }))}
                                    placeholder="Enter your username"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea
                                    id="bio"
                                    value={personalInfo.bio}
                                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, bio: e.target.value }))}
                                    placeholder="Tell us about yourself..."
                                    className="min-h-[100px]"
                                    maxLength={500}
                                />
                                <p className="text-sm text-muted-foreground text-right">
                                    {personalInfo.bio.length}/500 characters
                                </p>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                                <div className="space-y-2">
                                    <Label>Timezone</Label>
                                    <div className="flex items-center space-x-2">
                                        <Globe className="h-4 w-4" />
                                        <span className="text-sm">{profile?.timezone || 'UTC'}</span>
                                        <Badge variant="outline">Read-only</Badge>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Date Format</Label>
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4" />
                                        <span className="text-sm">{profile?.dateFormat || 'MM/DD/YYYY'}</span>
                                        <Badge variant="outline">Read-only</Badge>
                                    </div>
                                </div>
                            </div>
                            <Button onClick={savePersonalInfo} disabled={saving} className="w-full md:w-auto">
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Preferences */}
                <TabsContent value="preferences">
                    <Card>
                        <CardHeader>
                            <CardTitle>Preferences</CardTitle>
                            <CardDescription>Customize your app experience</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="timeFormat">Time Format</Label>
                                <Select
                                    value={preferences.timeFormat}
                                    onValueChange={(value: '12h' | '24h') =>
                                        setPreferences(prev => ({ ...prev, timeFormat: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIME_FORMATS.map(format => (
                                            <SelectItem key={format.value} value={format.value}>
                                                <div className="flex items-center space-x-2">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{format.label}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <Label>Theme</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {THEME_OPTIONS.map(theme => (
                                        <div
                                            key={theme.value}
                                            className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md ${preferences.theme === theme.value
                                                ? 'border-primary shadow-md'
                                                : 'border-gray-200 dark:border-gray-700'
                                                }`}
                                            onClick={() => setPreferences(prev => ({ ...prev, theme: theme.value }))}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-6 h-6 rounded-full ${theme.color} border-2 border-gray-300`} />
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2">
                                                        <Palette className="h-4 w-4" />
                                                        <span className="font-medium">{theme.label}</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{theme.description}</p>
                                                </div>
                                            </div>
                                            {preferences.theme === theme.value && (
                                                <div className="absolute top-2 right-2">
                                                    <div className="w-2 h-2 bg-primary rounded-full" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button onClick={savePreferences} disabled={saving} className="w-full md:w-auto">
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Preferences'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications */}
                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Settings</CardTitle>
                            <CardDescription>Choose what notifications you want to receive</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {[
                                { key: 'email', label: 'Email Notifications', description: 'Receive updates via email' },
                                { key: 'push', label: 'Push Notifications', description: 'Browser and mobile push notifications' },
                                { key: 'habitReminders', label: 'Habit Reminders', description: 'Get reminded about your habits' },
                                { key: 'weeklyReports', label: 'Weekly Reports', description: 'Receive weekly progress summaries' }
                            ].map(setting => (
                                <div key={setting.key} className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">{setting.label}</Label>
                                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                                    </div>
                                    <Switch
                                        checked={notifications[setting.key as keyof typeof notifications]}
                                        onCheckedChange={(checked) =>
                                            setNotifications(prev => ({ ...prev, [setting.key]: checked }))
                                        }
                                    />
                                </div>
                            ))}
                            <Button onClick={saveNotifications} disabled={saving} className="w-full md:w-auto">
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Notifications'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Privacy */}
                <TabsContent value="privacy">
                    <Card>
                        <CardHeader>
                            <CardTitle>Privacy Settings</CardTitle>
                            <CardDescription>Control who can see your information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Profile Visibility</Label>
                                <Select
                                    value={privacy.profileVisibility}
                                    onValueChange={(value: 'public' | 'private') =>
                                        setPrivacy(prev => ({ ...prev, profileVisibility: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="public">
                                            <div className="flex items-center space-x-2">
                                                <Eye className="h-4 w-4" />
                                                <span>Public - Anyone can see your profile</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="private">
                                            <div className="flex items-center space-x-2">
                                                <EyeOff className="h-4 w-4" />
                                                <span>Private - Only you can see your profile</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {[
                                { key: 'showStreak', label: 'Show Streak', description: 'Display your current streak' },
                                { key: 'showProgress', label: 'Show Progress', description: 'Display your habit progress' }
                            ].map(setting => (
                                <div key={setting.key} className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">{setting.label}</Label>
                                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                                    </div>
                                    <Switch
                                        checked={privacy[setting.key as keyof typeof privacy]}
                                        onCheckedChange={(checked) =>
                                            setPrivacy(prev => ({ ...prev, [setting.key]: checked }))
                                        }
                                    />
                                </div>
                            ))}

                            <Button onClick={savePrivacy} disabled={saving} className="w-full md:w-auto">
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Privacy Settings'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Goals */}
                <TabsContent value="goals">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Goals</CardTitle>
                            <CardDescription>Set your daily and weekly targets</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="dailyTarget">Daily Habit Target</Label>
                                    <Input
                                        id="dailyTarget"
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={goals.dailyHabitTarget}
                                        onChange={(e) => setGoals(prev => ({
                                            ...prev,
                                            dailyHabitTarget: parseInt(e.target.value) || 1
                                        }))}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Number of habits to complete each day
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="weeklyGoal">Weekly Goal</Label>
                                    <Input
                                        id="weeklyGoal"
                                        type="number"
                                        min="1"
                                        max="140"
                                        value={goals.weeklyGoal}
                                        onChange={(e) => setGoals(prev => ({
                                            ...prev,
                                            weeklyGoal: parseInt(e.target.value) || 7
                                        }))}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Total habit completions per week
                                    </p>
                                </div>
                            </div>

                            <div className="bg-muted/50 rounded-lg p-4">
                                <h4 className="font-medium mb-2">Goal Preview</h4>
                                <div className="text-sm space-y-1">
                                    <p>• Complete <strong>{goals.dailyHabitTarget}</strong> habits daily</p>
                                    <p>• Reach <strong>{goals.weeklyGoal}</strong> total completions weekly</p>
                                    <p>• Average <strong>{(goals.weeklyGoal / 7).toFixed(1)}</strong> habits per day</p>
                                </div>
                            </div>

                            <Button onClick={saveGoals} disabled={saving} className="w-full md:w-auto">
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Goals'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}