"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Activity, Zap, Sparkles } from "lucide-react";

export function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <section className="relative w-full overflow-hidden py-16 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center lg:text-left space-y-6"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Transform Your Habits,{" "}
              <span className="text-primary">Transform Your Life</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Discover the science-backed system that helps you build lasting
              habits through interconnected routines and AI-powered insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/register">
                  Get Started <Zap className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative w-full max-w-lg mx-auto lg:max-w-none"
          >
            <div className="relative bg-card rounded-xl shadow-2xl overflow-hidden border border-border">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-purple-600"></div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <Activity className="h-6 w-6 text-primary mr-2" />
                    <h3 className="font-semibold text-xl">Habit DNA</h3>
                  </div>
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="space-y-4">
                  {[
                    {
                      name: "Morning Meditation",
                      streak: 21,
                      impact: 9.4,
                      connections: 3,
                    },
                    {
                      name: "Daily Exercise",
                      streak: 14,
                      impact: 8.7,
                      connections: 5,
                    },
                    {
                      name: "Reading",
                      streak: 30,
                      impact: 9.1,
                      connections: 4,
                    },
                  ].map((habit, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-muted/50 border border-border relative overflow-hidden"
                    >
                      <div
                        className="absolute bottom-0 left-0 h-1 bg-primary"
                        style={{ width: `${habit.impact * 10}%` }}
                      ></div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{habit.name}</h4>
                        <span className="text-xs px-2 py-1 bg-secondary rounded-full">
                          {habit.streak} day streak
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Impact: {habit.impact}/10</span>
                        <span>{habit.connections} connections</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Overall Habit Score
                    </span>
                    <span className="font-bold text-lg text-primary">8.9/10</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-primary/10 blur-xl"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-purple-500/10 blur-xl"></div>
          </motion.div>
        </div>
      </div>

      {/* Background elements */}
      <div className="absolute top-1/2 left-0 w-full h-1/2 bg-gradient-to-b from-transparent to-background/20 pointer-events-none"></div>
    </section>
  );
}