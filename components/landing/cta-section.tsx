import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="w-full py-16 md:py-20 lg:py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 lg:mb-6 leading-tight">
            Ready to Transform Your Habits?
          </h2>
          <p className="text-lg sm:text-xl mb-8 lg:mb-10 text-primary-foreground/90 leading-relaxed max-w-3xl mx-auto">
            Join thousands of people who have already changed their lives with
            Ehtos unique habit-building system.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="group mb-4 w-full sm:w-auto"
            asChild
          >
            <Link href="/register">
              Get Started Now
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </Button>
          <p className="text-sm text-primary-foreground/80 mt-4">
            Free 14-day trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}