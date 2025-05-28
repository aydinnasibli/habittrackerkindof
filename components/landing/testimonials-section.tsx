import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { StarIcon } from "lucide-react";

const testimonials = [
  {
    name: "Alex Johnson",
    role: "Software Engineer",
    avatar: "AJ",
    content:
      "The Habit Chain Reaction feature has completely transformed my morning routine. Now one habit naturally flows into the next, and I accomplish so much more before noon.",
    rating: 5,
  },
  {
    name: "Sarah Chen",
    role: "Marketing Director",
    avatar: "SC",
    content:
      "I love the Parallel Universe tracking - seeing the alternative timeline of what my life would be like if I hadn't started exercising is incredibly motivating!",
    rating: 5,
  },
  {
    name: "Miguel Rodriguez",
    role: "Product Designer",
    avatar: "MR",
    content:
      "The AI recommendations are uncannily accurate. It suggested I start journaling before bed, which has dramatically improved my sleep quality and creativity.",
    rating: 4,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-muted">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Our Users Say
          </h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of people who have transformed their habits and lives
            with Necmettinyo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {Array(5)
                    .fill(null)
                    .map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-5 w-5 ${
                          i < testimonial.rating
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-muted"
                        }`}
                      />
                    ))}
                </div>
                <p className="text-card-foreground">"{testimonial.content}"</p>
              </CardContent>
              <CardFooter className="border-t border-border pt-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}