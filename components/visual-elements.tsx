// components/theme/visual-elements.tsx
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { ENHANCED_THEME_OPTIONS } from '@/lib/types/theme';

interface VisualElementsProps {
    children: React.ReactNode;
}

export function VisualElements({ children }: VisualElementsProps) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <>{children}</>;
    }

    const currentTheme = ENHANCED_THEME_OPTIONS.find(t => t.value === theme);

    if (!currentTheme?.hasVisualElements) {
        return <>{children}</>;
    }

    return (
        <div className="relative min-h-screen">
            {/* Background Elements */}
            {currentTheme.elements?.map((element, index) => {
                if (element.position === 'background') {
                    return (
                        <div
                            key={`bg-${index}`}
                            className="fixed inset-0 pointer-events-none"
                            style={{
                                opacity: element.opacity,
                                zIndex: element.zIndex
                            }}
                        >
                            <ThemeElement type={element.component} />
                        </div>
                    );
                }
                return null;
            })}

            {/* Corner Elements */}
            {currentTheme.elements?.map((element, index) => {
                if (element.position === 'corners') {
                    return (
                        <div
                            key={`corner-${index}`}
                            className="fixed inset-0 pointer-events-none"
                            style={{
                                opacity: element.opacity,
                                zIndex: element.zIndex
                            }}
                        >
                            <ThemeElement type={element.component} position="corners" />
                        </div>
                    );
                }
                return null;
            })}

            {/* Main Content */}
            <div className="relative">
                {children}
            </div>

            {/* Overlay Elements */}
            {currentTheme.elements?.map((element, index) => {
                if (element.position === 'overlay') {
                    return (
                        <div
                            key={`overlay-${index}`}
                            className="fixed inset-0 pointer-events-none"
                            style={{
                                opacity: element.opacity,
                                zIndex: element.zIndex
                            }}
                        >
                            <ThemeElement type={element.component} />
                        </div>
                    );
                }
                return null;
            })}
        </div>
    );
}

interface ThemeElementProps {
    type: string;
    position?: 'corners' | 'full';
}

function ThemeElement({ type, position = 'full' }: ThemeElementProps) {
    switch (type) {
        case 'trees':
            return <TreesElement position={position} />;
        case 'stars':
            return <StarsElement />;
        case 'waves':
            return <WavesElement />;
        case 'leaves':
            return <LeavesElement />;
        case 'clouds':
            return <CloudsElement />;
        case 'petals':
            return <PetalsElement />;
        default:
            return null;
    }
}

// Individual Element Components
function TreesElement({ position }: { position: string }) {
    if (position === 'corners') {
        return (
            <>
                {/* Bottom left corner */}
                <div className="absolute bottom-0 left-0 w-32 h-40">
                    <svg viewBox="0 0 100 120" className="w-full h-full">
                        <path d="M10 120 L15 80 L20 120 Z" fill="currentColor" className="text-green-800/30" />
                        <path d="M5 90 L15 60 L25 90 Z" fill="currentColor" className="text-green-700/40" />
                        <path d="M0 70 L15 40 L30 70 Z" fill="currentColor" className="text-green-600/30" />
                    </svg>
                </div>

                {/* Bottom right corner */}
                <div className="absolute bottom-0 right-0 w-28 h-36">
                    <svg viewBox="0 0 100 120" className="w-full h-full">
                        <path d="M80 120 L85 85 L90 120 Z" fill="currentColor" className="text-green-800/30" />
                        <path d="M75 95 L85 65 L95 95 Z" fill="currentColor" className="text-green-700/40" />
                    </svg>
                </div>
            </>
        );
    }

    return null;
}

function StarsElement() {
    const stars = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.3
    }));

    return (
        <div className="w-full h-full">
            {stars.map(star => (
                <div
                    key={star.id}
                    className="absolute rounded-full bg-white animate-pulse"
                    style={{
                        top: `${star.top}%`,
                        left: `${star.left}%`,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        opacity: star.opacity,
                        animationDelay: `${Math.random() * 3}s`,
                        animationDuration: `${2 + Math.random() * 2}s`
                    }}
                />
            ))}
        </div>
    );
}

function WavesElement() {
    return (
        <div className="absolute bottom-0 left-0 w-full h-32">
            <svg viewBox="0 0 1200 120" className="w-full h-full" preserveAspectRatio="none">
                <path
                    d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z"
                    fill="currentColor"
                    className="text-blue-600/20 animate-pulse"
                />
                <path
                    d="M0,80 C400,40 800,100 1200,80 L1200,120 L0,120 Z"
                    fill="currentColor"
                    className="text-blue-500/15"
                />
            </svg>
        </div>
    );
}

function LeavesElement() {
    const leaves = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        rotation: Math.random() * 360,
        scale: Math.random() * 0.5 + 0.5
    }));

    return (
        <div className="w-full h-full">
            {leaves.map(leaf => (
                <div
                    key={leaf.id}
                    className="absolute animate-float"
                    style={{
                        top: `${leaf.top}%`,
                        left: `${leaf.left}%`,
                        transform: `rotate(${leaf.rotation}deg) scale(${leaf.scale})`,
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${5 + Math.random() * 3}s`
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-green-500/30">
                        <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" />
                    </svg>
                </div>
            ))}
        </div>
    );
}

function CloudsElement() {
    return (
        <div className="absolute top-0 left-0 w-full h-64">
            <div className="absolute top-8 left-1/4 w-32 h-16 bg-orange-300/20 rounded-full blur-lg animate-float" />
            <div className="absolute top-16 right-1/3 w-24 h-12 bg-orange-400/15 rounded-full blur-lg animate-float" style={{ animationDelay: '2s' }} />
            <div className="absolute top-4 right-1/4 w-20 h-10 bg-red-300/20 rounded-full blur-lg animate-float" style={{ animationDelay: '4s' }} />
        </div>
    );
}

function PetalsElement() {
    const petals = Array.from({ length: 6 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        rotation: Math.random() * 360
    }));

    return (
        <div className="w-full h-full">
            {petals.map(petal => (
                <div
                    key={petal.id}
                    className="absolute animate-float"
                    style={{
                        top: `${petal.top}%`,
                        left: `${petal.left}%`,
                        transform: `rotate(${petal.rotation}deg)`,
                        animationDelay: `${Math.random() * 4}s`,
                        animationDuration: `${6 + Math.random() * 2}s`
                    }}
                >
                    <div className="w-3 h-6 bg-purple-400/30 rounded-full blur-sm" />
                </div>
            ))}
        </div>
    );
}