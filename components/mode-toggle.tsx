"use client";

import * as React from "react";
import {
  Moon,
  Sun,
  Monitor,
  Palette,
  TreePine,
  Waves,
  Sunset,
  Flower2
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const THEME_OPTIONS = [
  {
    value: 'light',
    label: 'Light',
    icon: Sun,
    description: 'Clean and bright',
    color: 'text-yellow-500'
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: Moon,
    description: 'Easy on the eyes',
    color: 'text-slate-400'
  },
  {
    value: 'system',
    label: 'System',
    icon: Monitor,
    description: 'Follows your device',
    color: 'text-blue-500'
  },
  {
    value: 'midnight',
    label: 'Midnight',
    icon: Moon,
    description: 'Deep black theme',
    color: 'text-gray-800'
  },
  {
    value: 'forest',
    label: 'Forest',
    icon: TreePine,
    description: 'Nature inspired',
    color: 'text-green-600'
  },
  {
    value: 'ocean',
    label: 'Ocean',
    icon: Waves,
    description: 'Calm blue tones',
    color: 'text-blue-600'
  },
  {
    value: 'sunset',
    label: 'Sunset',
    icon: Sunset,
    description: 'Warm orange hues',
    color: 'text-orange-600'
  },
  {
    value: 'lavender',
    label: 'Lavender',
    icon: Flower2,
    description: 'Soft purple theme',
    color: 'text-purple-600'
  }
];

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon">
        <Palette className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const currentTheme = THEME_OPTIONS.find(t => t.value === theme) || THEME_OPTIONS[0];
  const CurrentIcon = currentTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <CurrentIcon className={`h-[1.2rem] w-[1.2rem] transition-all ${currentTheme.color}`} />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center space-x-2">
          <Palette className="h-4 w-4" />
          <span>Choose Theme</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Standard themes */}
        <div className="space-y-1">
          {THEME_OPTIONS.slice(0, 3).map((themeOption) => {
            const Icon = themeOption.icon;
            const isSelected = theme === themeOption.value;

            return (
              <DropdownMenuItem
                key={themeOption.value}
                onClick={() => setTheme(themeOption.value)}
                className={`cursor-pointer ${isSelected ? 'bg-accent' : ''}`}
              >
                <div className="flex items-center space-x-3 w-full">
                  <Icon className={`h-4 w-4 ${themeOption.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{themeOption.label}</span>
                      {isSelected && (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{themeOption.description}</p>
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
          Premium Themes
        </DropdownMenuLabel>

        {/* Premium themes */}
        <div className="space-y-1">
          {THEME_OPTIONS.slice(3).map((themeOption) => {
            const Icon = themeOption.icon;
            const isSelected = theme === themeOption.value;

            return (
              <DropdownMenuItem
                key={themeOption.value}
                onClick={() => setTheme(themeOption.value)}
                className={`cursor-pointer ${isSelected ? 'bg-accent' : ''}`}
              >
                <div className="flex items-center space-x-3 w-full">
                  <Icon className={`h-4 w-4 ${themeOption.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{themeOption.label}</span>
                      {isSelected && (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{themeOption.description}</p>
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}