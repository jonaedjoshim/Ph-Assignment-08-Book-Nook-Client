"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, BookOpen, CalendarDays, X } from "lucide-react";
import { toast } from "sonner";

import { authenticatedApiRequest } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";

type ViewStatus = "loading" | "success" | "not-found" | "error";

type Book = {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  imageUrl: string;
  totalCopies?: number;
  availableCopies?: number;
  addedBy: string;
  addedByEmail: string;
  createdAt: string;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

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

function findBookRecord(
  value: unknown,
  depth = 0,
): Record<string, unknown> | null {
  if (!isRecord(value) || depth > 4) {
    return null;
  }

  const id = readString(value._id) || readString(value.id);

  if (id && readString(value.title)) {
    return value;
  }

  for (const key of ["book", "data", "result"]) {
    const nestedBook = findBookRecord(value[key], depth + 1);

    if (nestedBook) {
      return nestedBook;
    }
  }

  return null;
}

function normalizeBook(payload: unknown): Book | null {
  const record = findBookRecord(payload);

  if (!record) {
    return null;
  }

  const creator = isRecord(record.createdBy) ? record.createdBy : {};
  const addedBy =
    readString(creator.name) ||
    readString(record.createdByName) ||
    "BookNook member";
  const addedByEmail =
    readString(creator.email) || readString(record.createdByEmail);

  const totalCopies = readNumber(record.totalCopies);
  const availableCopies = readNumber(record.availableCopies);

  return {
    id: readString(record._id) || readString(record.id),
    title: readString(record.title),
    author: readString(record.author) || "Unknown author",
    category: readString(record.category) || "Others",
    description: readString(record.description) || "No description provided.",
    imageUrl: readString(record.imageUrl),
    ...(totalCopies !== undefined ? { totalCopies } : {}),
    ...(availableCopies !== undefined ? { availableCopies } : {}),
    addedBy,
    addedByEmail,
    createdAt: readString(record.createdAt),
  };
}

function getApiMessage(payload: unknown): string {
  if (!isRecord(payload)) {
    return "";
  }

  return (
    readString(payload.message) ||
    readString(payload.error) ||
    readString(payload.detail)
  );
}

function formatAddedDate(value: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function LoadingState() {
  return (
    <main className="grid min-h-[55vh] place-items-center px-4">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Opening the book…
      </div>
    </main>
  );
}

function BookCover({ imageUrl, title }: { imageUrl: string; title: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="relative aspect-3/4 overflow-hidden rounded-3xl bg-[#EEE6DA] dark:bg-[#263D34]">
      {imageUrl && !imageFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={`Cover of ${title}`}
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="grid h-full place-content-center gap-4 text-center text-[#765C46] dark:text-[#D8C5A9]">
          <BookOpen className="mx-auto size-14" aria-hidden="true" />
          <span className="font-serif text-2xl">BookNook</span>
        </div>
      )}
    </div>
  );
}

export function BookDetailsView({ bookId }: { bookId: string }) {
  const router = useRouter();
  const { data: sessionData, isPending: isSessionPending } =
    authClient.useSession();

  const user = sessionData?.user;
  const userId = user?.id;

  const [book, setBook] = useState<Book | null>(null);
  const [status, setStatus] = useState<ViewStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [isBorrowDialogOpen, setIsBorrowDialogOpen] = useState(false);
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isSessionPending && !userId) {
      const destination = `/books/${encodeURIComponent(bookId)}`;
      router.replace(`/login?callbackURL=${encodeURIComponent(destination)}`);
    }
  }, [bookId, isSessionPending, router, userId]);

  useEffect(() => {
    if (isSessionPending || !userId || !bookId) {
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    async function loadBook() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/books/${encodeURIComponent(bookId)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const payload: unknown = await response.json().catch(() => null);

        if (!isActive) {
          return;
        }

        if (response.status === 404) {
          setBook(null);
          setStatus("not-found");
          return;
        }

        if (!response.ok) {
          throw new Error(
            getApiMessage(payload) || "Could not load this book.",
          );
        }

        const loadedBook = normalizeBook(payload);

        if (!loadedBook) {
          setBook(null);
          setStatus("not-found");
          return;
        }

        setBook(loadedBook);
        setErrorMessage("");
        setStatus("success");
      } catch (error) {
        if (!isActive || controller.signal.aborted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not load this book. Please try again.",
        );
        setStatus("error");
      }
    }

    void loadBook();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [bookId, isSessionPending, reloadKey, userId]);

  useEffect(() => {
    if (!isBorrowDialogOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isBorrowing) {
        setIsBorrowDialogOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isBorrowDialogOpen, isBorrowing]);

  async function handleBorrowSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!book || !user) {
      return;
    }

    setIsBorrowing(true);

    try {
      const response = await authenticatedApiRequest("borrows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookId: book.id,
        }),
      });

      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getApiMessage(payload) || "This book could not be borrowed.",
        );
      }

      toast.success("Borrow request completed.");
      setIsBorrowDialogOpen(false);

      if (book.availableCopies !== undefined) {
        setBook({
          ...book,
          availableCopies: Math.max(0, book.availableCopies - 1),
        });
      }

      router.push("/my-borrows");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "This book could not be borrowed.",
      );
    } finally {
      setIsBorrowing(false);
    }
  }

  if (isSessionPending || !userId) {
    return <LoadingState />;
  }

  if (status === "loading" || (status === "success" && !book)) {
    return <LoadingState />;
  }

  if (status === "error" || status === "not-found" || !book) {
    const isNotFound = status === "not-found";

    return (
      <main className="grid min-h-[65vh] place-items-center bg-[#F8F5EF] px-4 py-16 dark:bg-[#172B25]">
        <section className="w-full max-w-xl rounded-3xl border border-[#E8E1D6] bg-[#FFFEFA] px-6 py-12 text-center dark:border-white/10 dark:bg-[#1E352D]">
          <BookOpen
            className="mx-auto size-10 text-[#765C46] dark:text-[#D8C5A9]"
            aria-hidden="true"
          />

          <h1 className="mt-4 font-serif text-3xl font-semibold text-[#292621] dark:text-[#F2E9D8]">
            {isNotFound
              ? "This book isn’t on the shelf"
              : "Book details couldn’t load"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#6D675F] dark:text-[#C8C0B3]">
            {isNotFound
              ? "The book may have been removed, or the link may be out of date."
              : errorMessage}
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {!isNotFound && (
              <button
                type="button"
                onClick={() => {
                  setStatus("loading");
                  setReloadKey((currentKey) => currentKey + 1);
                }}
                className="rounded-full border border-[#E8E1D6] px-5 py-3 text-sm font-semibold text-[#234237] transition hover:bg-[#EEE6DA] dark:border-white/10 dark:text-[#F2E9D8] dark:hover:bg-white/10"
              >
                Try again
              </button>
            )}

            <Link
              href="/books"
              className="inline-flex items-center gap-2 rounded-full bg-[#234237] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#315748]"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to all books
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const isUnavailable =
    book.availableCopies !== undefined && book.availableCopies <= 0;
  const addedDate = formatAddedDate(book.createdAt);

  return (
    <main className="min-h-[70vh] bg-[#F8F5EF] py-10 dark:bg-[#172B25] sm:py-14">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/books"
          className="inline-flex items-center gap-2 rounded-full px-1 py-2 text-sm font-medium text-[#765C46] transition hover:text-[#234237] dark:text-[#D8C5A9] dark:hover:text-white"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to all books
        </Link>

        <article className="mt-6 grid gap-8 rounded-3xl border border-[#E8E1D6] bg-[#FFFEFA] p-5 shadow-sm dark:border-white/10 dark:bg-[#1E352D] sm:p-8 lg:grid-cols-[minmax(260px,0.78fr)_minmax(0,1.22fr)] lg:gap-12 lg:p-10">
          <div className="mx-auto w-full max-w-md">
            <BookCover
              key={book.id}
              imageUrl={book.imageUrl}
              title={book.title}
            />
          </div>

          <div className="flex flex-col">
            <div>
              <span className="inline-flex rounded-full bg-[#EEE6DA] px-3.5 py-1.5 text-xs font-semibold text-[#234237] dark:bg-white/10 dark:text-[#F2E9D8]">
                {book.category}
              </span>

              <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight tracking-tight text-[#292621] dark:text-[#F2E9D8] sm:text-5xl">
                {book.title}
              </h1>

              <p className="mt-3 text-base text-[#765C46] dark:text-[#D8C5A9]">
                by {book.author}
              </p>
            </div>

            <section className="mt-8 border-t border-[#E8E1D6] pt-6 dark:border-white/10">
              <h2 className="font-serif text-2xl font-semibold text-[#292621] dark:text-[#F2E9D8]">
                About this book
              </h2>

              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#6D675F] dark:text-[#C8C0B3]">
                {book.description}
              </p>
            </section>

            <section className="mt-7 grid gap-4 rounded-2xl bg-[#F8F5EF] p-5 dark:bg-[#172B25] sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A8175] dark:text-[#B8B0A3]">
                  Added by
                </p>
                <p className="mt-2 text-sm font-semibold text-[#292621] dark:text-[#F2E9D8]">
                  {book.addedBy}
                </p>
                {book.addedByEmail && (
                  <p className="mt-1 break-all text-xs text-[#6D675F] dark:text-[#C8C0B3]">
                    {book.addedByEmail}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A8175] dark:text-[#B8B0A3]">
                  Copies available
                </p>
                <p
                  className={`mt-2 text-sm font-semibold ${
                    isUnavailable
                      ? "text-[#9A5147] dark:text-[#E0A69D]"
                      : "text-[#3B6D4E] dark:text-[#A9D1A9]"
                  }`}
                >
                  {book.availableCopies === undefined
                    ? "Availability not provided"
                    : isUnavailable
                      ? "Not available"
                      : `${book.availableCopies} of ${book.totalCopies ?? book.availableCopies} available`}
                </p>
              </div>

              {addedDate && (
                <div className="sm:col-span-2">
                  <p className="flex items-center gap-2 text-xs text-[#6D675F] dark:text-[#C8C0B3]">
                    <CalendarDays className="size-4" aria-hidden="true" />
                    Added on {addedDate}
                  </p>
                </div>
              )}
            </section>

            <div className="mt-7">
              <button
                type="button"
                onClick={() => setIsBorrowDialogOpen(true)}
                disabled={isUnavailable}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#234237] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#315748] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234237] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#A6A198] dark:bg-[#F2E9D8] dark:text-[#172B25] dark:hover:bg-white dark:disabled:bg-white/20 sm:w-auto"
              >
                {isUnavailable ? "Not Available" : "Borrow This Book"}
              </button>

              {!isUnavailable && (
                <p className="mt-3 text-xs leading-5 text-[#8A8175] dark:text-[#B8B0A3]">
                  Borrowing dates and available copies are managed by the
                  library.
                </p>
              )}
            </div>
          </div>
        </article>
      </div>

      {isBorrowDialogOpen && (
        <div
          className="fixed inset-0 z-100 grid place-items-center overflow-y-auto bg-[#172B25]/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isBorrowing) {
              setIsBorrowDialogOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="borrow-dialog-title"
            aria-describedby="borrow-dialog-description"
            className="my-auto w-full max-w-lg rounded-3xl border border-[#E8E1D6] bg-[#FFFEFA] p-5 shadow-2xl dark:border-white/10 dark:bg-[#1E352D] sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#765C46] dark:text-[#D8C5A9]">
                  Borrow from BookNook
                </p>
                <h2
                  id="borrow-dialog-title"
                  className="mt-2 font-serif text-3xl font-semibold text-[#292621] dark:text-[#F2E9D8]"
                >
                  Borrow this book
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsBorrowDialogOpen(false)}
                disabled={isBorrowing}
                aria-label="Close borrow dialog"
                className="rounded-full p-2 text-[#765C46] transition hover:bg-[#EEE6DA] disabled:opacity-50 dark:text-[#D8C5A9] dark:hover:bg-white/10"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <p
              id="borrow-dialog-description"
              className="mt-3 text-sm leading-6 text-[#6D675F] dark:text-[#C8C0B3]"
            >
              Confirm that you want to borrow{" "}
              <span className="font-semibold text-[#292621] dark:text-[#F2E9D8]">
                {book.title}
              </span>
              .
            </p>

            <form onSubmit={handleBorrowSubmit} className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-[#292621] dark:text-[#F2E9D8]">
                Your name
                <input
                  className="mt-2 w-full rounded-xl border border-[#E8E1D6] bg-[#F8F5EF] px-4 py-3 text-sm text-[#6D675F] outline-none dark:border-white/10 dark:bg-[#172B25] dark:text-[#C8C0B3]"
                  value={user.name ?? ""}
                  readOnly
                />
              </label>

              <label className="block text-sm font-medium text-[#292621] dark:text-[#F2E9D8]">
                Your email
                <input
                  className="mt-2 w-full rounded-xl border border-[#E8E1D6] bg-[#F8F5EF] px-4 py-3 text-sm text-[#6D675F] outline-none dark:border-white/10 dark:bg-[#172B25] dark:text-[#C8C0B3]"
                  type="email"
                  value={user.email ?? ""}
                  readOnly
                />
              </label>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsBorrowDialogOpen(false)}
                  disabled={isBorrowing}
                  className="rounded-full border border-[#E8E1D6] px-5 py-3 text-sm font-semibold text-[#765C46] transition hover:bg-[#F8F5EF] disabled:opacity-50 dark:border-white/10 dark:text-[#D8C5A9] dark:hover:bg-white/10"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isBorrowing || isUnavailable}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#234237] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#315748] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#F2E9D8] dark:text-[#172B25] dark:hover:bg-white"
                >
                  {isBorrowing && (
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  )}
                  {isBorrowing ? "Confirming…" : "Confirm Borrow"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default BookDetailsView;
