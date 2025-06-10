export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            {/* Main loading container */}
            <div className="flex flex-col items-center space-y-8 p-8">
                {/* Primary spinner */}
                <div className="relative">
                    {/* Outer rotating ring */}
                    <div className="w-16 h-16 border-4 border-border rounded-full">
                        <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />
                    </div>

                    {/* Inner dot */}
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-primary rounded-full animate-pulse" />

                    {/* Secondary ring */}
                    <div className="absolute -inset-2 border border-primary/20 rounded-full animate-ping" />
                </div>

                {/* Loading text */}
                <div className="text-center space-y-3">
                    <div className="flex items-center justify-center space-x-2">
                        <h1 className="text-2xl font-semibold text-foreground">Loading</h1>
                        <div className="flex space-x-1">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="w-1 h-1 bg-primary rounded-full animate-bounce"
                                    style={{
                                        animationDelay: `${i * 0.15}s`,
                                        animationDuration: '0.8s'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm max-w-sm">
                        Preparing your dashboard experience...
                    </p>
                </div>

                {/* Progress indicator */}
                <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full animate-pulse" />
                </div>
            </div>

            {/* Subtle background pattern */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Geometric shapes */}
                <div className="absolute top-20 left-20 w-32 h-32 border border-border/30 rounded-full animate-pulse opacity-30" />
                <div className="absolute bottom-20 right-20 w-24 h-24 border border-primary/20 rounded-full animate-pulse opacity-20"
                    style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 right-32 w-16 h-16 border border-accent/30 rounded-full animate-pulse opacity-25"
                    style={{ animationDelay: '2s' }} />

                {/* Gradient orbs */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl animate-pulse opacity-60" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-tl from-accent/5 to-transparent rounded-full blur-2xl animate-pulse opacity-40"
                    style={{ animationDelay: '3s' }} />
            </div>
        </div>
    );
}