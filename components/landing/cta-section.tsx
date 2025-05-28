import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Habits?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            Join thousands of people who have already changed their lives with
            Necmettinyo's unique habit-building system.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="group"
            asChild
          >
            <Link href="/register">
              Get Started Now
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <p className="mt-4 text-sm text-primary-foreground/80">
            Free 14-day trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}