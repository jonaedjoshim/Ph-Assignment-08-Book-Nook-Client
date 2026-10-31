import { ArrowUpRight, BookOpen, RotateCcw, Search } from "lucide-react";

import Container from "@/components/layout/container";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Discover a Book",
    description:
      "Explore our thoughtfully curated collection and find a story that speaks to you.",
  },
  {
    number: "02",
    icon: BookOpen,
    title: "Borrow & Enjoy",
    description:
      "Borrow your chosen book in just a few clicks and let the reading adventure begin.",
  },
  {
    number: "03",
    icon: RotateCcw,
    title: "Return & Repeat",
    description:
      "Finished the last page? Return your book and make room for another wonderful read.",
  },
];

export default function HowItWorks() {
  return (
    <section className="section-padding relative overflow-hidden bg-card">
      <Container>
        {/* Section Heading */}
        <div className="mx-auto mb-14 max-w-2xl text-center md:mb-20">
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-primary/50" />
            <span className="editorial-label text-primary">
              SIMPLE BY DESIGN
            </span>
            <span className="h-px w-8 bg-primary/50" />
          </div>

          <h2 className="section-heading text-foreground">
            Your reading journey,{" "}
            <span className="font-normal italic text-primary">
              made simple.
            </span>
          </h2>

          <p className="section-description mx-auto">
            Good stories should be easy to find and even easier to share.
            Here&apos;s how your BookNook journey unfolds.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.number}
                className="group relative rounded-lg border border-border bg-background p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 lg:p-10"
              >
                <div className="mb-12 flex items-start justify-between">
                  <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-6" strokeWidth={1.5} />
                  </div>

                  <span className="font-serif text-5xl font-medium text-primary/15">
                    {step.number}
                  </span>
                </div>

                <h3 className="mb-4 font-serif text-3xl font-semibold tracking-tight text-foreground">
                  {step.title}
                </h3>

                <p className="max-w-sm text-sm leading-7 text-muted-foreground">
                  {step.description}
                </p>

                <ArrowUpRight className="absolute right-8 bottom-8 size-5 text-primary/30 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary lg:right-10 lg:bottom-10" />
              </div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <div className="mt-12 text-center md:mt-16">
          <p className="font-serif text-xl italic text-muted-foreground md:text-2xl">
            One book. A thousand possibilities.
          </p>
        </div>
      </Container>
    </section>
  );
}
