import Link from "next/link";
import {
  ArrowUpRight,
  Atom,
  BookHeart,
  Compass,
  Landmark,
  Shapes,
} from "lucide-react";

import Container from "@/components/layout/container";

const categories = [
  {
    name: "Fiction",
    description: "Stories beyond the ordinary",
    icon: BookHeart,
    number: "01",
    color: "text-rose-700 dark:text-rose-300",
    background: "bg-rose-100 dark:bg-rose-950/40",
  },
  {
    name: "Science",
    description: "Questions that spark discovery",
    icon: Atom,
    number: "02",
    color: "text-sky-700 dark:text-sky-300",
    background: "bg-sky-100 dark:bg-sky-950/40",
  },
  {
    name: "History",
    description: "The stories that shaped us",
    icon: Landmark,
    number: "03",
    color: "text-amber-700 dark:text-amber-300",
    background: "bg-amber-100 dark:bg-amber-950/40",
  },
  {
    name: "Kids",
    description: "Little readers, big adventures",
    icon: Shapes,
    number: "04",
    color: "text-emerald-700 dark:text-emerald-300",
    background: "bg-emerald-100 dark:bg-emerald-950/40",
  },
  {
    name: "Others",
    description: "Something wonderfully different",
    icon: Compass,
    number: "05",
    color: "text-violet-700 dark:text-violet-300",
    background: "bg-violet-100 dark:bg-violet-950/40",
  },
];

export default function ExploreCategories() {
  return (
    <section className="section-padding border-t border-border bg-background">
      <Container>
        {/* Section Heading */}
        <div className="mb-12 flex flex-col justify-between gap-6 md:mb-16 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary/50" />

              <span className="editorial-label text-primary">
                FIND YOUR NEXT READ
              </span>
            </div>

            <h2 className="section-heading text-foreground">
              Explore by{" "}
              <span className="font-normal italic text-primary">category.</span>
            </h2>

            <p className="section-description">
              Every reader has a favorite corner of the bookshelf. Find yours
              and discover what&apos;s waiting inside.
            </p>
          </div>

          <Link
            href="/books"
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-foreground"
          >
            Browse all books
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Categories */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <Link
                key={category.name}
                href={`/books?category=${category.name}`}
                className="group relative flex min-h-62.5 flex-col justify-between overflow-hidden rounded-lg border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex size-14 items-center justify-center rounded-xl ${category.background}`}
                  >
                    <Icon
                      className={`size-7 ${category.color}`}
                      strokeWidth={1.5}
                    />
                  </div>

                  <span className="font-serif text-lg text-muted-foreground/50">
                    {category.number}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                    {category.name}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {category.description}
                  </p>
                </div>

                <ArrowUpRight className="absolute right-6 bottom-6 size-4 text-primary opacity-0 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>

        {/* Bottom Quote */}
        <div className="mt-14 flex items-center justify-center gap-4 md:mt-20">
          <span className="h-px w-12 bg-border" />

          <p className="text-center font-serif text-lg italic text-muted-foreground md:text-xl">
            There&apos;s a story for every kind of reader.
          </p>

          <span className="h-px w-12 bg-border" />
        </div>
      </Container>
    </section>
  );
}
