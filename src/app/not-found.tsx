import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "BookNook | Page Not Found",
  description: "This page could not be found in the BookNook online library.",
};

export default function NotFound() {
  return (
    <main className="grid min-h-[65vh] place-items-center bg-[#F8F5EF] px-4 py-16 dark:bg-[#172B25]">
      <section className="w-full max-w-xl rounded-3xl border border-[#E8E1D6] bg-[#FFFEFA] px-6 py-12 text-center shadow-sm dark:border-white/10 dark:bg-[#1E352D] sm:px-10">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#EEE6DA] text-[#234237] dark:bg-white/10 dark:text-[#F2E9D8]">
          <BookOpen className="size-8" aria-hidden="true" />
        </div>

        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-[#765C46] dark:text-[#D8C5A9]">
          A little off the shelf
        </p>

        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-[#292621] dark:text-[#F2E9D8] sm:text-5xl">
          This page isn’t here
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#6D675F] dark:text-[#C8C0B3] sm:text-base">
          The page may have moved, or the address may have a typo. Let’s take
          you back to a familiar shelf.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#234237] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#315748] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234237] focus-visible:ring-offset-2 dark:bg-[#F2E9D8] dark:text-[#172B25] dark:hover:bg-white"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Home
        </Link>
      </section>
    </main>
  );
}
