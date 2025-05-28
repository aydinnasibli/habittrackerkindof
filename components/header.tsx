"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Activity, User, Settings, LogOut } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  // Routes where header should show sign-in/sign-up buttons
  const isPublicRoute = ['/', '/sign-in', '/sign-up'].includes(pathname);

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
            <ModeToggle />
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
        <div className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">Necmettinyo</span>
        </div>
        <nav className="ml-auto flex items-center gap-4">
          <Link href="/dashboard">
            <Button
              variant={pathname === "/dashboard" ? "default" : "ghost"}
              className="hidden sm:flex"
            >
              Dashboard
            </Button>
          </Link>
          <Link href="/habits">
            <Button
              variant={pathname === "/habits" ? "default" : "ghost"}
              className="hidden sm:flex"
            >
              My Habits
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
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
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer flex w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
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
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}