"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Search,
  X,
} from "lucide-react";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const PAGE_SIZE = 9;

const BOOK_CATEGORIES = [
  "Fiction",
  "Science",
  "History",
  "Kids",
  "Others",
] as const;

type CategoryFilter = "All categories" | (typeof BOOK_CATEGORIES)[number];

type Book = {
  id: string;
  title: string;
  author: string;
  category: string;
  imageUrl: string;
  availableCopies?: number;
};

type LoadStatus = "loading" | "success" | "error";

type PaginationInfo = {
  totalPages?: number;
  hasNextPage: boolean;
};

const inputClassName =
  "w-full rounded-xl border border-[#E8E1D6] bg-[#FFFEFA] px-4 py-3 text-sm text-[#292621] outline-none transition placeholder:text-[#92897D] focus-visible:ring-2 focus-visible:ring-[#234237] dark:border-white/10 dark:bg-[#1E352D] dark:text-[#F2E9D8] dark:placeholder:text-[#B8B0A3] dark:focus-visible:ring-[#D8C5A9]";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsedValue = Number(value);

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return undefined;
}

function findBookArray(value: unknown, depth = 0): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value) || depth > 4) {
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

function findNumber(
  value: unknown,
  keys: string[],
  depth = 0,
): number | undefined {
  if (!isRecord(value) || depth > 4) {
    return undefined;
  }

  for (const key of keys) {
    const result = readNumber(value[key]);

    if (result !== undefined) {
      return result;
    }
  }

  for (const key of ["pagination", "meta", "data"]) {
    const result = findNumber(value[key], keys, depth + 1);

    if (result !== undefined) {
      return result;
    }
  }

  return undefined;
}

function findBoolean(
  value: unknown,
  keys: string[],
  depth = 0,
): boolean | undefined {
  if (!isRecord(value) || depth > 4) {
    return undefined;
  }

  for (const key of keys) {
    if (typeof value[key] === "boolean") {
      return value[key];
    }
  }

  for (const key of ["pagination", "meta", "data"]) {
    const result = findBoolean(value[key], keys, depth + 1);

    if (result !== undefined) {
      return result;
    }
  }

  return undefined;
}

function getBooks(payload: unknown): Book[] {
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

      const availableCopies = readNumber(item.availableCopies);

      return {
        id,
        title,
        author: readString(item.author) || "Unknown author",
        category: readString(item.category) || "Others",
        imageUrl: readString(item.imageUrl),
        ...(availableCopies !== undefined ? { availableCopies } : {}),
      };
    })
    .filter((book): book is Book => book !== null);
}

function getPaginationInfo(
  payload: unknown,
  currentPage: number,
  booksOnPage: number,
): PaginationInfo {
  const totalPagesFromResponse = findNumber(payload, [
    "totalPages",
    "pageCount",
    "pages",
  ]);

  const totalFromResponse = findNumber(payload, [
    "total",
    "totalBooks",
    "totalCount",
    "totalItems",
  ]);

  const totalPages =
    totalPagesFromResponse ??
    (totalFromResponse !== undefined
      ? Math.max(1, Math.ceil(totalFromResponse / PAGE_SIZE))
      : undefined);

  const explicitHasNextPage = findBoolean(payload, [
    "hasNextPage",
    "hasNext",
    "hasMore",
  ]);

  return {
    totalPages,
    hasNextPage:
      explicitHasNextPage ??
      (totalPages !== undefined
        ? currentPage < totalPages
        : booksOnPage === PAGE_SIZE),
  };
}

function getApiMessage(payload: unknown): string {
  if (!isRecord(payload)) {
    return "";
  }

  return readString(payload.message) || readString(payload.error);
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

function BookCard({ book }: { book: Book }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#E8E1D6] bg-[#FFFEFA] transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#292621]/10 dark:border-white/10 dark:bg-[#1E352D]">
      <div className="relative aspect-4/5 overflow-hidden bg-[#EEE6DA] dark:bg-[#263D34]">
        {book.imageUrl && !imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.imageUrl}
            alt={`Cover of ${book.title}`}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-content-center gap-3 text-center text-[#765C46] dark:text-[#D8C5A9]">
            <BookOpen className="mx-auto size-11" aria-hidden="true" />
            <span className="font-serif text-xl">BookNook</span>
          </div>
        )}

        <span className="absolute left-4 top-4 rounded-full bg-[#FFFEFA]/95 px-3 py-1.5 text-xs font-semibold text-[#234237] shadow-sm dark:bg-[#172B25]/95 dark:text-[#F2E9D8]">
          {book.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="min-h-14 font-serif text-2xl font-semibold leading-tight text-[#292621] dark:text-[#F2E9D8]">
          {book.title}
        </h2>

        <p className="mt-2 text-sm text-[#765C46] dark:text-[#D8C5A9]">
          by {book.author}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
          {book.availableCopies !== undefined && (
            <span
              className={`text-xs font-medium ${
                book.availableCopies > 0
                  ? "text-[#3B6D4E] dark:text-[#A9D1A9]"
                  : "text-[#9A5147] dark:text-[#E0A69D]"
              }`}
            >
              {book.availableCopies > 0
                ? `${book.availableCopies} available`
                : "Not available"}
            </span>
          )}

          <Link
            href={`/books/${encodeURIComponent(book.id)}`}
            aria-label={`View details for ${book.title}`}
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#234237] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#315748] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234237] focus-visible:ring-offset-2 dark:bg-[#F2E9D8] dark:text-[#172B25] dark:hover:bg-white"
          >
            View Details
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function AllBooksView() {
  const [books, setBooks] = useState<Book[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("All categories");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    async function loadBooks() {
      try {
        const query = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        });

        if (activeSearch) {
          query.set("search", activeSearch);
        }

        if (selectedCategory !== "All categories") {
          query.set("category", selectedCategory);
        }

        const response = await fetch(
          `${API_BASE_URL}/books?${query.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const payload: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            getApiMessage(payload) || "Could not load the books.",
          );
        }

        if (!isActive) {
          return;
        }

        const loadedBooks = getBooks(payload);
        const pagination = getPaginationInfo(payload, page, loadedBooks.length);

        setBooks(loadedBooks);
        setTotalPages(pagination.totalPages);
        setHasNextPage(pagination.hasNextPage);
        setErrorMessage("");
        setStatus("success");
      } catch (error) {
        if (!isActive || controller.signal.aborted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not load the books. Please try again.",
        );
        setStatus("error");
      }
    }

    void loadBooks();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [activeSearch, page, reloadKey, selectedCategory]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextSearch = searchInput.trim();

    setStatus("loading");
    setPage(1);
    setActiveSearch(nextSearch);

    if (nextSearch === activeSearch && page === 1) {
      setReloadKey((currentKey) => currentKey + 1);
    }
  }

  function handleCategoryChange(value: CategoryFilter) {
    setStatus("loading");
    setPage(1);
    setSelectedCategory(value);
  }

  function handleClearFilters() {
    const filtersWereActive =
      activeSearch !== "" ||
      selectedCategory !== "All categories" ||
      page !== 1;

    setSearchInput("");
    setActiveSearch("");
    setSelectedCategory("All categories");
    setPage(1);
    setStatus("loading");

    if (!filtersWereActive) {
      setReloadKey((currentKey) => currentKey + 1);
    }
  }

  function handleRetry() {
    setErrorMessage("");
    setStatus("loading");
    setReloadKey((currentKey) => currentKey + 1);
  }

  function changePage(nextPage: number) {
    if (nextPage < 1) {
      return;
    }

    setStatus("loading");
    setPage(nextPage);
  }

  const hasActiveFilters =
    activeSearch !== "" || selectedCategory !== "All categories";

  return (
    <main className="min-h-[70vh] bg-[#F8F5EF] py-12 dark:bg-[#172B25] md:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#765C46] dark:text-[#D8C5A9]">
            Find your next read
          </p>

          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-[#292621] dark:text-[#F2E9D8] sm:text-5xl">
            All Books
          </h1>

          <p className="mt-4 text-sm leading-7 text-[#6D675F] dark:text-[#C8C0B3] sm:text-base">
            Browse the BookNook shelves by title, author, or category. A good
            book may be closer than you think.
          </p>
        </header>

        <form
          onSubmit={handleSearch}
          className="mt-8 grid gap-3 rounded-3xl border border-[#E8E1D6] bg-[#FFFEFA] p-4 dark:border-white/10 dark:bg-[#1E352D] sm:grid-cols-[minmax(0,1fr)_220px_auto]"
        >
          <label className="relative block">
            <span className="sr-only">Search by book title or author</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#8A8175]"
              aria-hidden="true"
            />
            <input
              className={`${inputClassName} pl-11`}
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search books or authors"
            />
          </label>

          <label>
            <span className="sr-only">Filter books by category</span>
            <select
              className={inputClassName}
              value={selectedCategory}
              onChange={(event) =>
                handleCategoryChange(event.target.value as CategoryFilter)
              }
            >
              <option value="All categories">All categories</option>
              {BOOK_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#234237] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#315748] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234237] focus-visible:ring-offset-2 dark:bg-[#F2E9D8] dark:text-[#172B25] dark:hover:bg-white"
          >
            <Search className="size-4" aria-hidden="true" />
            Search
          </button>
        </form>

        <div className="mt-6 flex min-h-8 flex-wrap items-center justify-between gap-3">
          <p
            aria-live="polite"
            className="text-sm text-[#6D675F] dark:text-[#C8C0B3]"
          >
            {status === "success" &&
              (books.length === 1
                ? "Showing 1 book"
                : `Showing ${books.length} books`)}

            {status === "loading" && "Finding books on the shelves…"}
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#765C46] transition hover:bg-[#EEE6DA] dark:text-[#D8C5A9] dark:hover:bg-white/10"
            >
              <X className="size-4" aria-hidden="true" />
              Clear filters
            </button>
          )}
        </div>

        {status === "loading" && (
          <div
            aria-label="Loading books"
            aria-busy="true"
            className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <BookSkeleton key={`book-skeleton-${index}`} />
            ))}
          </div>
        )}

        {status === "error" && (
          <section className="mt-5 rounded-3xl border border-[#E8E1D6] bg-[#FFFEFA] px-6 py-14 text-center dark:border-white/10 dark:bg-[#1E352D]">
            <BookOpen
              className="mx-auto size-10 text-[#765C46] dark:text-[#D8C5A9]"
              aria-hidden="true"
            />

            <h2 className="mt-4 font-serif text-2xl font-semibold text-[#292621] dark:text-[#F2E9D8]">
              The shelves aren&apos;t loading
            </h2>

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
          </section>
        )}

        {status === "success" && books.length === 0 && (
          <section className="mt-5 rounded-3xl border border-[#E8E1D6] bg-[#FFFEFA] px-6 py-14 text-center dark:border-white/10 dark:bg-[#1E352D]">
            <BookOpen
              className="mx-auto size-10 text-[#765C46] dark:text-[#D8C5A9]"
              aria-hidden="true"
            />

            <h2 className="mt-4 font-serif text-2xl font-semibold text-[#292621] dark:text-[#F2E9D8]">
              No books found
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#6D675F] dark:text-[#C8C0B3]">
              Try another title or author, or choose a different category.
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#234237] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#315748]"
              >
                <X className="size-4" aria-hidden="true" />
                Clear filters
              </button>
            )}
          </section>
        )}

        {status === "success" && books.length > 0 && (
          <>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>

            {(page > 1 || hasNextPage) && (
              <nav
                aria-label="Book pages"
                className="mt-10 flex items-center justify-center gap-4"
              >
                <button
                  type="button"
                  onClick={() => changePage(page - 1)}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-2 rounded-full border border-[#E8E1D6] bg-[#FFFEFA] px-4 py-2.5 text-sm font-semibold text-[#234237] transition hover:bg-[#EEE6DA] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-[#1E352D] dark:text-[#F2E9D8] dark:hover:bg-white/10"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Previous
                </button>

                <span
                  aria-live="polite"
                  className="text-sm font-medium text-[#6D675F] dark:text-[#C8C0B3]"
                >
                  Page {page}
                  {totalPages !== undefined ? ` of ${totalPages}` : ""}
                </span>

                <button
                  type="button"
                  onClick={() => changePage(page + 1)}
                  disabled={!hasNextPage}
                  className="inline-flex items-center gap-2 rounded-full border border-[#E8E1D6] bg-[#FFFEFA] px-4 py-2.5 text-sm font-semibold text-[#234237] transition hover:bg-[#EEE6DA] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-[#1E352D] dark:text-[#F2E9D8] dark:hover:bg-white/10"
                >
                  Next
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default AllBooksView;
