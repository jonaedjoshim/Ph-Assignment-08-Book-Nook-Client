"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, BookOpen, RotateCw } from "lucide-react";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

type Book = {
  id: string;
  title: string;
  author: string;
  category: string;
  imageUrl: string;
};

type LoadStatus = "loading" | "success" | "error";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function findBookArray(value: unknown, depth = 0): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value) || depth > 3) {
    return [];
  }

  for (const key of ["books", "data", "results", "items"]) {
    const candidate = value[key];

    if (Array.isArray(candidate)) {
      return candidate;
    }

    const nestedBooks = findBookArray(candidate, depth + 1);

    if (nestedBooks.length > 0) {
      return nestedBooks;
    }
  }

  return [];
}

function getBookList(payload: unknown): Book[] {
  return findBookArray(payload)
    .map((item): Book | null => {
      if (!isRecord(item)) {
        return null;
      }

      const id = readString(item._id) || readString(item.id);
      const title = readString(item.title);

      if (!id || !title) {
        return null;
      }

      return {
        id,
        title,
        author: readString(item.author) || "Unknown author",
        category: readString(item.category) || "Others",
        imageUrl: readString(item.imageUrl),
      };
    })
    .filter((book): book is Book => book !== null)
    .slice(0, 6);
}

function getApiMessage(payload: unknown): string {
  if (!isRecord(payload)) {
    return "";
  }

  return readString(payload.message) || readString(payload.error);
}

function LatestBookCard({ book }: { book: Book }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article className="h-full">
      <Link
        href={`/books/${encodeURIComponent(book.id)}`}
        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[#E8E1D6] bg-[#FFFEFA] transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#292621]/10 dark:border-white/10 dark:bg-[#1E352D]"
      >
        <div className="relative aspect-4/5 overflow-hidden bg-[#EEE6DA] dark:bg-[#263D34]">
          {book.imageUrl && !imageFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.imageUrl}
              alt={`Cover of ${book.title}`}
              loading="lazy"
              decoding="async"
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-content-center gap-3 text-center text-[#765C46] dark:text-[#D8C5A9]">
              <BookOpen className="mx-auto size-10" aria-hidden="true" />
              <span className="font-serif text-xl">BookNook</span>
            </div>
          )}

          <span className="absolute left-4 top-4 rounded-full bg-[#FFFEFA]/95 px-3 py-1.5 text-xs font-semibold text-[#234237] shadow-sm dark:bg-[#172B25]/95 dark:text-[#F2E9D8]">
            {book.category}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-serif text-2xl font-semibold leading-tight text-[#292621] dark:text-[#F2E9D8]">
            {book.title}
          </h3>

          <p className="mt-2 text-sm text-[#765C46] dark:text-[#D8C5A9]">
            by {book.author}
          </p>

          <span className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-[#234237] dark:text-[#D8C5A9]">
            Explore book
            <ArrowUpRight
              className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </Link>
    </article>
  );
}

function BookSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-3xl border border-[#E8E1D6] bg-[#FFFEFA] dark:border-white/10 dark:bg-[#1E352D]"
    >
      <div className="aspect-4/5 animate-pulse bg-[#EEE6DA] dark:bg-[#263D34]" />
      <div className="space-y-3 p-5">
        <div className="h-6 w-3/4 animate-pulse rounded bg-[#EEE6DA] dark:bg-[#263D34]" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-[#EEE6DA] dark:bg-[#263D34]" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-[#EEE6DA] dark:bg-[#263D34]" />
      </div>
    </div>
  );
}

export function LatestBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    async function loadBooks() {
      try {
        const response = await fetch(`${API_BASE_URL}/books?page=1&limit=6`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const payload: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            getApiMessage(payload) || "Could not load the latest books.",
          );
        }

        if (!isActive) {
          return;
        }

        setBooks(getBookList(payload));
        setStatus("success");
        setErrorMessage("");
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not load the latest books.",
        );
        setStatus("error");
      }
    }

    void loadBooks();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [reloadKey]);

  function handleRetry() {
    setErrorMessage("");
    setStatus("loading");
    setReloadKey((currentKey) => currentKey + 1);
  }

  return (
    <section className="bg-[#F8F5EF] py-16 dark:bg-[#172B25] md:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#765C46] dark:text-[#D8C5A9]">
              Fresh from the shelves
            </p>

            <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-[#292621] dark:text-[#F2E9D8] sm:text-5xl">
              New arrivals
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#6D675F] dark:text-[#C8C0B3] sm:text-base">
              Meet the latest books added to our little library. Your next
              favourite might be waiting here.
            </p>
          </div>

          <Link
            href="/books"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[#234237]/20 px-5 py-3 text-sm font-semibold text-[#234237] transition hover:bg-[#234237] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234237] focus-visible:ring-offset-2 dark:border-white/20 dark:text-[#F2E9D8] dark:hover:bg-[#F2E9D8] dark:hover:text-[#172B25]"
          >
            See all books
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </header>

        {status === "loading" && (
          <div
            aria-label="Loading latest books"
            aria-busy="true"
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <BookSkeleton key={`book-skeleton-${index}`} />
            ))}
          </div>
        )}

        {status === "error" && (
          <div className="rounded-3xl border border-[#E8E1D6] bg-[#FFFEFA] px-6 py-12 text-center dark:border-white/10 dark:bg-[#1E352D]">
            <BookOpen
              className="mx-auto size-9 text-[#765C46] dark:text-[#D8C5A9]"
              aria-hidden="true"
            />
            <h3 className="mt-4 font-serif text-2xl font-semibold text-[#292621] dark:text-[#F2E9D8]">
              Books couldn&apos;t load
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#6D675F] dark:text-[#C8C0B3]">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#234237] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#315748] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234237] focus-visible:ring-offset-2"
            >
              <RotateCw className="size-4" aria-hidden="true" />
              Try again
            </button>
          </div>
        )}

        {status === "success" && books.length === 0 && (
          <div className="rounded-3xl border border-[#E8E1D6] bg-[#FFFEFA] px-6 py-12 text-center dark:border-white/10 dark:bg-[#1E352D]">
            <BookOpen
              className="mx-auto size-9 text-[#765C46] dark:text-[#D8C5A9]"
              aria-hidden="true"
            />
            <h3 className="mt-4 font-serif text-2xl font-semibold text-[#292621] dark:text-[#F2E9D8]">
              The shelves are waiting
            </h3>
            <p className="mt-2 text-sm text-[#6D675F] dark:text-[#C8C0B3]">
              No books have been added yet. Check back soon.
            </p>
          </div>
        )}

        {status === "success" && books.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <LatestBookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
