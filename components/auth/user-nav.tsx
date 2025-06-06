'use client'

import { useUser } from '@clerk/nextjs'

export function UserNav() {
    const { isSignedIn, user } = useUser()

    if (!isSignedIn) {
        return (
            <></>
        )
    }

    return (
        <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold mb-2">
                Welcome, {user.firstName || user.emailAddresses[0].emailAddress}!
            </h1>

        </div>
    )
}