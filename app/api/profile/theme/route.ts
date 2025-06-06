// app/api/profile/theme/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongoose';
import { Profile } from '@/lib/models/Profile';

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectToDatabase();

        const profile = await Profile.findOne({ clerkUserId: userId }).lean();

        if (!profile) {
            return NextResponse.json(
                { success: false, error: 'Profile not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            theme: profile.theme || 'dark'
        });
    } catch (error) {
        console.error('Error fetching theme:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { theme } = await request.json();

        // Validate theme value
        const validThemes = ['light', 'dark', 'system', 'midnight', 'forest', 'ocean', 'sunset', 'lavender'];
        if (!validThemes.includes(theme)) {
            return NextResponse.json(
                { success: false, error: 'Invalid theme value' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const result = await Profile.updateOne(
            { clerkUserId: userId },
            {
                theme,
                updatedAt: new Date()
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Profile not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            theme
        });
    } catch (error) {
        console.error('Error updating theme:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}