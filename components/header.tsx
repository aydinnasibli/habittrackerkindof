"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Activity, User, Settings, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { getOrCreateProfile } from "@/lib/actions/profile";
import { set } from "mongoose";

export function Header() {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const { setTheme } = useTheme();
  // Routes where header should show sign-in/sign-up buttons
  const isPublicRoute = ['/', '/sign-in', '/sign-up'].includes(pathname);
  const [themeAlready, setThemeAlready] = useState(false);
  // Move useEffect to top level - always called, but conditionally executed
  useEffect(() => {
    const fetchProfile = async () => {
      if (isSignedIn && user?.id && !themeAlready) {
        setThemeAlready(true); // Prevent multiple calls
        try {
          const data = await getOrCreateProfile();
          if (data?.theme) {
            setTheme(data.theme);
          }
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          setTheme("ocean"); // Fallback on error
        }
      } else if (!isSignedIn) {
        // Set ocean theme for non-signed-in users
        setTheme("sunset");
      }
    };

    fetchProfile();
  }, [isSignedIn, user?.id, setTheme]);

  // Show public header on public routes when user is not signed in
  if (isPublicRoute && !isSignedIn) {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Necmettinyo</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Sign Up</Button>
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  // Don't show header if user is not signed in on protected routes
  if (!isSignedIn) return null;


  // Show authenticated header
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">Necmettinyo</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4">
          <Link href="/dashboard">
            <Button
              variant={pathname === "/dashboard" ? "default" : "ghost"}
              className="hidden cursor-pointer sm:flex"
            >
              Dashboard
            </Button>
          </Link>
          <Link href="/habits">
            <Button
              variant={pathname === "/habits" ? "default" : "ghost"}
              className="hidden cursor-pointer sm:flex"
            >
              My Habits
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button
              variant={pathname === "/leaderboard" ? "default" : "ghost"}
              className="hidden cursor-pointer sm:flex"
            >
              Leaderboard
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="cursor-pointer rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user?.firstName || user?.emailAddresses[0]?.emailAddress || "My Account"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer flex w-full">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut()}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}