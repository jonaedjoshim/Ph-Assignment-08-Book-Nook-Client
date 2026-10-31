import Container from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, BookOpen } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Container className="flex min-h-screen flex-col items-center justify-center text-center">
        {/* Brand Icon */}
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <BookOpen size={30} strokeWidth={1.5} />
        </div>

        {/* Introduction */}
        <span className="editorial-label mb-5">Welcome to BookNook</span>

        <h1 className="max-w-4xl font-serif text-6xl font-semibold leading-[1.05] tracking-tight md:text-7xl lg:text-8xl">
          A quiet corner for
          <span className="block italic text-primary">curious minds.</span>
        </h1>

        <p className="mt-8 max-w-xl text-base leading-8 text-muted-foreground md:text-lg">
          Discover stories worth getting lost in. Borrow, share, and explore a
          thoughtfully curated world of books.
        </p>

        {/* Action */}
        <div className="mt-10">
          <Button
            size="lg"
            className="h-12 rounded-md px-7"
            render={
              <Link href="/books">
                Explore the Collection
                <ArrowUpRight className="ml-1 size-4" />
              </Link>
            }
          />
        </div>

        {/* Footer Text */}
        <p className="mt-16 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Read • Discover • Belong
        </p>
      </Container>
    </main>
  );
}
