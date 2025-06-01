"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

// Enhanced theme CSS variables
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
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
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
  }
`;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  React.useEffect(() => {
    // Add theme styles to document head
    const styleId = 'enhanced-theme-styles';
    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = THEME_STYLES;
      document.head.appendChild(styleElement);
    }
  }, []);

  return (
    <NextThemesProvider
      {...props}
      themes={['light', 'dark', 'system', 'midnight', 'forest', 'ocean', 'sunset', 'lavender']}
      enableSystem
      disableTransitionOnChange
      attribute="class"
      defaultTheme="system"
    >
      {children}
    </NextThemesProvider>
  );
}