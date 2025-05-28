'use client'

import { UserButton, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function UserNav() {
    const { isSignedIn, user } = useUser()

    if (!isSignedIn) {
        return (
            <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                    <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild>
                    <Link href="/sign-up">Sign Up</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
                Welcome, {user.firstName || user.emailAddresses[0].emailAddress}!
            </span>
            <UserButton
                appearance={{
                    elements: {
                        avatarBox: "h-8 w-8"
                    }
                }}
                afterSignOutUrl="/"
            />
        </div>
    )
}