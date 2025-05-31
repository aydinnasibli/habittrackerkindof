// app/profile/page.tsx
import { getOrCreateProfile } from '@/lib/actions/profile';
import { ProfileForm } from '@/components/profile/profile-form';
import { ProfileStats } from '@/components/profile/profile-stats';
import { NotificationSettings } from '@/components/profile/notification-settings';
import { PrivacySettings } from '@/components/profile/privacy-settings';
import { GoalSettings } from '@/components/profile/goal-settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Bell, Shield, Target, BarChart3 } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
    const profile = await getOrCreateProfile();

    if (!profile) {
        redirect('/sign-in');
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Profile Settings</h1>
                    <p className="text-muted-foreground">
                        Manage your account settings and preferences
                    </p>
                </div>

                <Tabs defaultValue="profile" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="profile" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Profile
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            Notifications
                        </TabsTrigger>
                        <TabsTrigger value="privacy" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Privacy
                        </TabsTrigger>
                        <TabsTrigger value="goals" className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Goals
                        </TabsTrigger>
                        <TabsTrigger value="stats" className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Stats
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile">
                        <Card>
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>
                                    Update your personal details and preferences
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ProfileForm profile={profile} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="notifications">
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Preferences</CardTitle>
                                <CardDescription>
                                    Choose how you want to be notified about your habits
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <NotificationSettings profile={profile} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="privacy">
                        <Card>
                            <CardHeader>
                                <CardTitle>Privacy Settings</CardTitle>
                                <CardDescription>
                                    Control your profile visibility and data sharing
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <PrivacySettings profile={profile} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="goals">
                        <Card>
                            <CardHeader>
                                <CardTitle>Personal Goals</CardTitle>
                                <CardDescription>
                                    Set your daily and weekly habit completion targets
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <GoalSettings profile={profile} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="stats">
                        <Card>
                            <CardHeader>
                                <CardTitle>Your Statistics</CardTitle>
                                <CardDescription>
                                    View your habit tracking achievements and progress
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ProfileStats profile={profile} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}