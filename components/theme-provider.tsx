"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";
import { useEffect } from "react";

// Enhanced theme CSS variables with chart colors
const THEME_STYLES = `
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
    
    /* Chart colors for light theme */
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --chart-grid: 214.3 31.8% 91.4%;
    --chart-text: 222.2 84% 4.9%;
  }

  .dark {
    --background: 0 0% 3%;
    --foreground: 0 0% 98%;
    --card: 0 0% 5%;
    --card-foreground: 0 0% 95%;
    --popover: 0 0% 4%;
    --popover-foreground: 0 0% 97%;
    --primary: 0 0% 90%;
    --primary-foreground: 0 0% 8%;
    --secondary: 0 0% 12%;
    --secondary-foreground: 0 0% 92%;
    --muted: 0 0% 10%;
    --muted-foreground: 0 0% 60%;
    --accent: 0 0% 15%;
    --accent-foreground: 0 0% 90%;
    --destructive: 0 70% 25%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 18%;
    --input: 0 0% 14%;
    --ring: 0 0% 85%;
    
    /* Chart colors for dark theme */
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
    --chart-grid: 0 0% 18%;
    --chart-text: 0 0% 95%;
  }

  .midnight {
    --background: 0 0% 0%;
    --foreground: 0 0% 95%;
    --card: 0 0% 3%;
    --card-foreground: 0 0% 95%;
    --popover: 0 0% 3%;
    --popover-foreground: 0 0% 95%;
    --primary: 210 100% 70%;
    --primary-foreground: 0 0% 0%;
    --secondary: 0 0% 8%;
    --secondary-foreground: 0 0% 95%;
    --muted: 0 0% 8%;
    --muted-foreground: 0 0% 60%;
    --accent: 0 0% 8%;
    --accent-foreground: 0 0% 95%;
    --destructive: 0 75% 60%;
    --destructive-foreground: 0 0% 95%;
    --border: 0 0% 15%;
    --input: 0 0% 15%;
    --ring: 210 100% 70%;
    
    /* Chart colors for midnight theme */
    --chart-1: 210 100% 70%;
    --chart-2: 180 100% 60%;
    --chart-3: 270 80% 65%;
    --chart-4: 45 100% 60%;
    --chart-5: 330 90% 65%;
    --chart-grid: 0 0% 15%;
    --chart-text: 0 0% 95%;
  }

  .forest {
    --background: 120 25% 8%;
    --foreground: 120 10% 90%;
    --card: 120 20% 10%;
    --card-foreground: 120 10% 90%;
    --popover: 120 20% 10%;
    --popover-foreground: 120 10% 90%;
    --primary: 142 76% 36%;
    --primary-foreground: 120 10% 90%;
    --secondary: 120 15% 15%;
    --secondary-foreground: 120 10% 90%;
    --muted: 120 15% 15%;
    --muted-foreground: 120 5% 65%;
    --accent: 120 15% 15%;
    --accent-foreground: 120 10% 90%;
    --destructive: 0 62% 45%;
    --destructive-foreground: 120 10% 90%;
    --border: 120 10% 20%;
    --input: 120 10% 20%;
    --ring: 142 76% 36%;
    
    /* Chart colors for forest theme */
    --chart-1: 142 76% 36%;
    --chart-2: 120 60% 45%;
    --chart-3: 90 70% 50%;
    --chart-4: 60 80% 55%;
    --chart-5: 180 65% 40%;
    --chart-grid: 120 10% 20%;
    --chart-text: 120 10% 90%;
  }

  .ocean {
    --background: 210 50% 6%;
    --foreground: 210 15% 92%;
    --card: 210 45% 8%;
    --card-foreground: 210 15% 92%;
    --popover: 210 45% 8%;
    --popover-foreground: 210 15% 92%;
    --primary: 200 90% 60%;
    --primary-foreground: 210 50% 6%;
    --secondary: 210 35% 12%;
    --secondary-foreground: 210 15% 92%;
    --muted: 210 35% 12%;
    --muted-foreground: 210 10% 70%;
    --accent: 210 35% 12%;
    --accent-foreground: 210 15% 92%;
    --destructive: 0 70% 55%;
    --destructive-foreground: 210 15% 92%;
    --border: 210 30% 18%;
    --input: 210 30% 18%;
    --ring: 200 90% 60%;
    
    /* Chart colors for ocean theme */
    --chart-1: 200 90% 60%;
    --chart-2: 180 80% 55%;
    --chart-3: 220 70% 65%;
    --chart-4: 160 75% 50%;
    --chart-5: 240 60% 70%;
    --chart-grid: 210 30% 18%;
    --chart-text: 210 15% 92%;
  }

  .sunset {
    --background: 15 45% 6%;
    --foreground: 15 10% 92%;
    --card: 15 40% 8%;
    --card-foreground: 15 10% 92%;
    --popover: 15 40% 8%;
    --popover-foreground: 15 10% 92%;
    --primary: 25 95% 65%;
    --primary-foreground: 15 45% 6%;
    --secondary: 15 30% 12%;
    --secondary-foreground: 15 10% 92%;
    --muted: 15 30% 12%;
    --muted-foreground: 15 8% 70%;
    --accent: 15 30% 12%;
    --accent-foreground: 15 10% 92%;
    --destructive: 0 80% 60%;
    --destructive-foreground: 15 10% 92%;
    --border: 15 25% 18%;
    --input: 15 25% 18%;
    --ring: 25 95% 65%;
    
    /* Chart colors for sunset theme */
    --chart-1: 25 95% 65%;
    --chart-2: 45 90% 60%;
    --chart-3: 15 85% 55%;
    --chart-4: 35 80% 70%;
    --chart-5: 5 95% 60%;
    --chart-grid: 15 25% 18%;
    --chart-text: 15 10% 92%;
  }

  .lavender {
    --background: 270 30% 8%;
    --foreground: 270 10% 92%;
    --card: 270 25% 10%;
    --card-foreground: 270 10% 92%;
    --popover: 270 25% 10%;
    --popover-foreground: 270 10% 92%;
    --primary: 262 83% 70%;
    --primary-foreground: 270 30% 8%;
    --secondary: 270 20% 15%;
    --secondary-foreground: 270 10% 92%;
    --muted: 270 20% 15%;
    --muted-foreground: 270 8% 70%;
    --accent: 270 20% 15%;
    --accent-foreground: 270 10% 92%;
    --destructive: 0 70% 60%;
    --destructive-foreground: 270 10% 92%;
    --border: 270 15% 20%;
    --input: 270 15% 20%;
    --ring: 262 83% 70%;
    
    /* Chart colors for lavender theme */
    --chart-1: 262 83% 70%;
    --chart-2: 280 75% 65%;
    --chart-3: 250 80% 60%;
    --chart-4: 300 70% 75%;
    --chart-5: 240 85% 65%;
    --chart-grid: 270 15% 20%;
    --chart-text: 270 10% 92%;
  }
`;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  useEffect(() => {
    // Add theme styles to document head
    const styleId = 'enhanced-theme-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = THEME_STYLES;
      document.head.appendChild(styleElement);
    }

    // Cleanup function to prevent memory leaks
    return () => {
      const element = document.getElementById(styleId);
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    };
  }, []);

  return (
    <NextThemesProvider
      {...props}
      themes={['light', 'dark', 'system', 'midnight', 'forest', 'ocean', 'sunset', 'lavender']}
      enableSystem
      disableTransitionOnChange
      attribute="class"
    >
      {children}
    </NextThemesProvider>
  );
}