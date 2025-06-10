import {
  Activity,
  Zap,
  Sparkles,
  Compass,
  Users,
  TreePine,
  LineChart,
  Layers,
} from "lucide-react";

const features = [
  {
    icon: <Zap className="h-10 w-10 text-blue-600" />,
    title: "Habit Chain Reaction",
    description:
      "Build powerful habit sequences where completing one habit automatically triggers related ones, creating seamless routines.",
  },
  {
    icon: <Sparkles className="h-10 w-10 text-purple-500" />,
    title: "AI Recommendations",
    description:
      "Get personalized habit suggestions based on your behavior patterns, time-of-day effectiveness, and goals.",
  },
  {
    icon: <Compass className="h-10 w-10 text-blue-500" />,
    title: "Parallel Universe Tracking",
    description:
      "Visualize alternative timelines showing how your life changes based on maintained versus broken habits.",
  },
  {
    icon: <Users className="h-10 w-10 text-green-500" />,
    title: "Habit Tribes",
    description:
      "Join communities of users with similar goals for mutual support, accountability, and motivation.",
  },
  {
    icon: <Activity className="h-10 w-10 text-red-500" />,
    title: "Habit DNA Visualization",
    description:
      "See how your habits interconnect and influence each other with beautiful, interactive visualizations.",
  },
  {
    icon: <LineChart className="h-10 w-10 text-yellow-500" />,
    title: "Impact Calculator",
    description:
      "Understand the long-term compound effect of your habits with predictive analytics and visualizations.",
  },
  {
    icon: <TreePine className="h-10 w-10 text-teal-500" />,
    title: "Habit Weather Forecast",
    description:
      "Receive predictions about challenging days based on your historical data and environmental factors.",
  },
  {
    icon: <Layers className="h-10 w-10 text-orange-500" />,
    title: "Micro-Habit Stacking",
    description:
      "Break complex habits into achievable micro-steps that build upon each other for sustainable progress.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="w-full py-16 md:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 lg:mb-6">
            Features That Set Us Apart
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
            Necmettinyo combines behavioral science, AI, and gamification to create
            a unique habit-building experience.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-6 border border-border hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group hover:-translate-y-1"
            >
              <div className="mb-4 p-3 rounded-lg bg-muted inline-block overflow-hidden">
                <div className="group-hover:scale-110 transition-transform duration-300 origin-center">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 leading-tight">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}