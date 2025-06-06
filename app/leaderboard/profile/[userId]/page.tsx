// app/leaderboard/profile/[userId]/page.tsx
import { getUserProfile } from '@/lib/actions/leaderboard';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ProfileDetails from './ProfileDetails';
import { Metadata } from 'next';

interface ProfilePageProps {
    params: {
        userId: string;
    };
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
    const result = await getUserProfile(params.userId);

    if (!result.success || !result.user) {
        return {
            title: 'Profile Not Found'
        };
    }

    const displayName = result.user.userName ||
        `${result.user.firstName || ''} ${result.user.lastName || ''}`.trim() ||
        'Anonymous';

    return {
        title: `${displayName} - Profile`,
        description: `View ${displayName}'s habit building achievements and stats`
    };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const result = await getUserProfile(params.userId);

    if (!result.success || !result.user) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Link
                    href="/leaderboard"
                    className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Leaderboard</span>
                </Link>
            </div>

            <ProfileDetails user={result.user} />
        </div>
    );
}