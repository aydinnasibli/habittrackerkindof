// types/theme.ts
export interface ThemeConfig {
    value: string;
    label: string;
    description: string;
    color: string;
    hasVisualElements: boolean;
    elements?: {
        component: string;
        position: 'background' | 'overlay' | 'corners';
        opacity: number;
        zIndex: number;
    }[];
}

export const ENHANCED_THEME_OPTIONS: ThemeConfig[] = [
    {
        value: 'light',
        label: 'Light',
        description: 'Clean and bright',
        color: 'bg-white border-gray-200',
        hasVisualElements: false
    },
    {
        value: 'dark',
        label: 'Dark',
        description: 'Easy on the eyes',
        color: 'bg-gray-900 border-gray-700',
        hasVisualElements: false
    },
    {
        value: 'system',
        label: 'System',
        description: 'Follows your device',
        color: 'bg-gradient-to-r from-gray-100 to-gray-200',
        hasVisualElements: false
    },
    {
        value: 'midnight',
        label: 'Midnight',
        description: 'Deep black theme',
        color: 'bg-black border-gray-800',
        hasVisualElements: true,
        elements: [
            {
                component: 'stars',
                position: 'background',
                opacity: 0.3,
                zIndex: -1
            }
        ]
    },
    {
        value: 'forest',
        label: 'Forest',
        description: 'Nature inspired',
        color: 'bg-gradient-to-r from-green-900 to-emerald-800',
        hasVisualElements: true,
        elements: [
            {
                component: 'trees',
                position: 'corners',
                opacity: 0.15,
                zIndex: -1
            },
            {
                component: 'leaves',
                position: 'overlay',
                opacity: 0.1,
                zIndex: 1
            }
        ]
    },
    {
        value: 'ocean',
        label: 'Ocean',
        description: 'Calm blue tones',
        color: 'bg-gradient-to-r from-blue-900 to-indigo-800',
        hasVisualElements: true,
        elements: [
            {
                component: 'waves',
                position: 'background',
                opacity: 0.2,
                zIndex: -1
            }
        ]
    },
    {
        value: 'sunset',
        label: 'Sunset',
        description: 'Warm orange hues',
        color: 'bg-gradient-to-r from-orange-800 to-red-700',
        hasVisualElements: true,
        elements: [
            {
                component: 'clouds',
                position: 'background',
                opacity: 0.15,
                zIndex: -1
            }
        ]
    },
    {
        value: 'lavender',
        label: 'Lavender',
        description: 'Soft purple theme',
        color: 'bg-gradient-to-r from-purple-800 to-violet-700',
        hasVisualElements: true,
        elements: [
            {
                component: 'petals',
                position: 'overlay',
                opacity: 0.12,
                zIndex: 1
            }
        ]
    }
];