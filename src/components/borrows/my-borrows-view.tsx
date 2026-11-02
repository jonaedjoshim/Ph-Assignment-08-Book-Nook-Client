"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { authenticatedApiRequest } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";

type BorrowStatus = "active" | "returned";
type FilterValue = "all" | "active" | "returned";
type LoadStatus = "loading" | "success" | "error";

type BorrowRecord = {
  id: string;
  bookTitle: string;
  bookImageUrl: string;
  borrowedAt: string;
  dueAt: string;
  status: BorrowStatus;
  returnedAt: string;
};

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All books" },
  { value: "active", label: "Currently borrowed" },
  { value: "returned", label: "Returned" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getBorrowList(payload: unknown): BorrowRecord[] {
  if (!isRecord(payload) || !Array.isArray(payload.borrows)) {
    return [];
  }

  return payload.borrows.flatMap((item): BorrowRecord[] => {
    if (!isRecord(item)) {
      return [];
    }

    const id = readString(item.id) || readString(item._id);
    const bookTitle = readString(item.bookTitle);

    if (!id || !bookTitle) {
      return [];
    }

    return [
      {
        id,
        bookTitle,
        bookImageUrl: readString(item.bookImageUrl),
        borrowedAt: readString(item.borrowedAt),
        dueAt: readString(item.dueAt),
        status: item.status === "returned" ? "returned" : "active",
        returnedAt: readString(item.returnedAt),
      },
    ];
  });
}

function getApiMessage(payload: unknown): string {
  if (!isRecord(payload)) {
    return "";
  }

  return readString(payload.message) || readString(payload.error);
}

function formatDate(value: string): string {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function BorrowCover({ imageUrl, title }: { imageUrl: string; title: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!imageUrl || imageFailed) {
    return (
      <div
        className="grid size-16 shrink-0 place-items-center rounded-xl bg-[#EEE6DA] text-[#765C46] dark:bg-[#263D34] dark:text-[#D8C5A9]"
        aria-label={`No cover image for ${title}`}
      >
        <BookOpen className="size-7" aria-hidden="true" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={`Cover of ${title}`}
      loading="lazy"
      decoding="async"
      onError={() => setImageFailed(true)}
      className="size-16 shrink-0 rounded-xl bg-[#EEE6DA] object-cover dark:bg-[#263D34]"
    />
  );
}

function LoadingView() {
  return (
    <div
      aria-label="Loading your borrowed books"
      aria-busy="true"
      className="grid min-h-64 place-items-center rounded-3xl border border-[#E8E1D6] bg-[#FFFEFA] dark:border-white/10 dark:bg-[#1E352D]"
    >
      <div className="flex items-center gap-3 text-sm text-[#6D675F] dark:text-[#C8C0B3]">
        <span className="size-5 animate-spin rounded-full border-2 border-[#234237] border-t-transparent dark:border-[#F2E9D8] dark:border-t-transparent" />
        Loading your borrowed books…
      </div>
    </div>
  );
}

function EmptyView({
  filter,
  hasBorrows,
}: {
  filter: FilterValue;
  hasBorrows: boolean;
}) {
  const message = !hasBorrows
    ? "You haven’t borrowed a book yet. There’s a whole shelf waiting to be explored."
    : filter === "active"
      ? "You don’t have any books to return right now."
      : "No returned books to show yet.";

  return (
    <section className="rounded-3xl border border-[#E8E1D6] bg-[#FFFEFA] px-6 py-14 text-center dark:border-white/10 dark:bg-[#1E352D]">
      <BookOpen
        className="mx-auto size-10 text-[#765C46] dark:text-[#D8C5A9]"
        aria-hidden="true"
      />

      <h2 className="mt-4 font-serif text-2xl font-semibold text-[#292621] dark:text-[#F2E9D8]">
        Your reading list is quiet
      </h2>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#6D675F] dark:text-[#C8C0B3]">
        {message}
      </p>

      <Link
        href="/books"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#234237] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#315748] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234237] focus-visible:ring-offset-2 dark:bg-[#F2E9D8] dark:text-[#172B25] dark:hover:bg-white"
      >
        Browse books
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

export function MyBorrowsView() {
  const router = useRouter();
  const { data: sessionData, isPending: isSessionPending } =
    authClient.useSession();

  const userId = sessionData?.user?.id;

  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [errorMessage, setErrorMessage] = useState("");
  const [returningId, setReturningId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isSessionPending && !userId) {
      router.replace(`/login?callbackURL=${encodeURIComponent("/my-borrows")}`);
    }
  }, [isSessionPending, router, userId]);

  useEffect(() => {
    if (isSessionPending || !userId) {
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    async function loadBorrows() {
      try {
        const response = await authenticatedApiRequest("borrows", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const payload: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            getApiMessage(payload) || "Could not load your borrowed books.",
          );
        }

        if (!isActive) {
          return;
        }

        setBorrows(getBorrowList(payload));
        setErrorMessage("");
        setStatus("success");
      } catch (error) {
        if (!isActive || controller.signal.aborted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not load your borrowed books.",
        );
        setStatus("error");
      }
    }

    void loadBorrows();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [isSessionPending, reloadKey, userId]);

  async function handleReturn(borrow: BorrowRecord) {
    if (borrow.status !== "active" || returningId) {
      return;
    }

    setReturningId(borrow.id);

    try {
      const response = await authenticatedApiRequest(
        `borrows/${encodeURIComponent(borrow.id)}`,
        { method: "DELETE" },
      );

      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getApiMessage(payload) || "This book could not be returned.",
        );
      }

      const returnedRecord =
        isRecord(payload) && isRecord(payload.borrow) ? payload.borrow : null;

      const returnedAt =
        readString(returnedRecord?.returnedAt) || new Date().toISOString();

      setBorrows((currentBorrows) =>
        currentBorrows.map((currentBorrow) =>
          currentBorrow.id === borrow.id
            ? {
                ...currentBorrow,
                status: "returned",
                returnedAt,
              }
            : currentBorrow,
        ),
      );

      toast.success(getApiMessage(payload) || "Book returned successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "This book could not be returned.",
      );
    } finally {
      setReturningId(null);
    }
  }

  function handleRetry() {
    setErrorMessage("");
    setStatus("loading");
    setReloadKey((currentKey) => currentKey + 1);
  }

  if (isSessionPending || !userId) {
    return (
      <main className="grid min-h-[50vh] place-items-center px-4">
        <div className="flex items-center gap-3 text-sm text-[#6D675F] dark:text-[#C8C0B3]">
          <span className="size-5 animate-spin rounded-full border-2 border-[#234237] border-t-transparent dark:border-[#F2E9D8] dark:border-t-transparent" />
          Loading your account…
        </div>
      </main>
    );
  }

  const activeCount = borrows.filter(
    (borrow) => borrow.status === "active",
  ).length;

  const returnedCount = borrows.filter(
    (borrow) => borrow.status === "returned",
  ).length;

  const visibleBorrows = borrows.filter((borrow) => {
    if (filter === "active") {
      return borrow.status === "active";
    }

    if (filter === "returned") {
      return borrow.status === "returned";
    }

    return true;
  });

  return (
    <main className="min-h-[70vh] bg-[#F8F5EF] py-12 dark:bg-[#172B25] md:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#765C46] dark:text-[#D8C5A9]">
            Your BookNook shelf
          </p>

          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-[#292621] dark:text-[#F2E9D8] sm:text-5xl">
            My Borrows
          </h1>

          <p className="mt-4 text-sm leading-7 text-[#6D675F] dark:text-[#C8C0B3] sm:text-base">
            Keep track of the books you’ve borrowed and return them when you’re
            ready to pass them along.
          </p>
        </header>

        <section className="rounded-3xl border border-[#E8E1D6] bg-[#FFFEFA] p-4 dark:border-white/10 dark:bg-[#1E352D] sm:p-6">
          <div className="flex flex-col gap-4 border-b border-[#E8E1D6] pb-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#292621] dark:text-[#F2E9D8]">
                Borrowing history
              </h2>
              <p className="mt-1 text-sm text-[#6D675F] dark:text-[#C8C0B3]">
                {activeCount} currently borrowed · {returnedCount} returned
              </p>
            </div>

            <Link
              href="/books"
              className="inline-flex w-fit items-center gap-2 rounded-full px-1 py-2 text-sm font-semibold text-[#234237] transition hover:text-[#765C46] dark:text-[#F2E9D8] dark:hover:text-[#D8C5A9]"
            >
              Find another book
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div
            className="mt-5 flex flex-wrap gap-2"
            aria-label="Filter borrowing history"
          >
            {FILTERS.map((item) => {
              const count =
                item.value === "active"
                  ? activeCount
                  : item.value === "returned"
                    ? returnedCount
                    : borrows.length;

              const isSelected = filter === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setFilter(item.value)}
                  className={`rounded-full px-4 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234237] focus-visible:ring-offset-2 ${
                    isSelected
                      ? "bg-[#234237] text-white dark:bg-[#F2E9D8] dark:text-[#172B25]"
                      : "bg-[#F8F5EF] text-[#6D675F] hover:bg-[#EEE6DA] dark:bg-[#172B25] dark:text-[#C8C0B3] dark:hover:bg-white/10"
                  }`}
                >
                  {item.label} ({count})
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            {status === "loading" && <LoadingView />}

            {status === "error" && (
              <section className="rounded-3xl border border-[#E8E1D6] bg-[#F8F5EF] px-6 py-12 text-center dark:border-white/10 dark:bg-[#172B25]">
                <h3 className="font-serif text-2xl font-semibold text-[#292621] dark:text-[#F2E9D8]">
                  Borrowing history couldn’t load
                </h3>

                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#6D675F] dark:text-[#C8C0B3]">
                  {errorMessage}
                </p>

                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#234237] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#315748] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234237] focus-visible:ring-offset-2"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  Try again
                </button>
              </section>
            )}

            {status === "success" && visibleBorrows.length === 0 && (
              <EmptyView filter={filter} hasBorrows={borrows.length > 0} />
            )}

            {status === "success" && visibleBorrows.length > 0 && (
              <>
                <div className="space-y-3 md:hidden">
                  {visibleBorrows.map((borrow) => {
                    const isReturning = returningId === borrow.id;

                    return (
                      <article
                        key={borrow.id}
                        className="rounded-2xl border border-[#E8E1D6] bg-[#F8F5EF] p-4 dark:border-white/10 dark:bg-[#172B25]"
                      >
                        <div className="flex items-center gap-3">
                          <BorrowCover
                            imageUrl={borrow.bookImageUrl}
                            title={borrow.bookTitle}
                          />

                          <div className="min-w-0">
                            <h3 className="truncate font-serif text-xl font-semibold text-[#292621] dark:text-[#F2E9D8]">
                              {borrow.bookTitle}
                            </h3>

                            <span
                              className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                borrow.status === "active"
                                  ? "bg-[#E1EBDD] text-[#315748] dark:bg-[#315748]/40 dark:text-[#C9E1C2]"
                                  : "bg-[#EEE6DA] text-[#765C46] dark:bg-white/10 dark:text-[#D8C5A9]"
                              }`}
                            >
                              {borrow.status === "active"
                                ? "Currently borrowed"
                                : "Returned"}
                            </span>
                          </div>
                        </div>

                        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <dt className="text-xs text-[#8A8175] dark:text-[#B8B0A3]">
                              Borrowed on
                            </dt>
                            <dd className="mt-1 font-medium text-[#292621] dark:text-[#F2E9D8]">
                              {formatDate(borrow.borrowedAt)}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-xs text-[#8A8175] dark:text-[#B8B0A3]">
                              Return by
                            </dt>
                            <dd className="mt-1 font-medium text-[#292621] dark:text-[#F2E9D8]">
                              {formatDate(borrow.dueAt)}
                            </dd>
                          </div>
                        </dl>

                        {borrow.status === "returned" && borrow.returnedAt && (
                          <p className="mt-3 text-xs text-[#6D675F] dark:text-[#C8C0B3]">
                            Returned on {formatDate(borrow.returnedAt)}
                          </p>
                        )}

                        {borrow.status === "active" && (
                          <button
                            type="button"
                            onClick={() => void handleReturn(borrow)}
                            disabled={returningId !== null}
                            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#234237] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#315748] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#F2E9D8] dark:text-[#172B25] dark:hover:bg-white"
                          >
                            {isReturning ? (
                              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <RotateCcw
                                className="size-4"
                                aria-hidden="true"
                              />
                            )}
                            {isReturning ? "Returning…" : "Return Book"}
                          </button>
                        )}
                      </article>
                    );
                  })}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-190 border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#E8E1D6] text-xs uppercase tracking-[0.12em] text-[#8A8175] dark:border-white/10 dark:text-[#B8B0A3]">
                        <th scope="col" className="px-4 py-4 font-semibold">
                          Book
                        </th>
                        <th scope="col" className="px-4 py-4 font-semibold">
                          Borrowed
                        </th>
                        <th scope="col" className="px-4 py-4 font-semibold">
                          Return by
                        </th>
                        <th scope="col" className="px-4 py-4 font-semibold">
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-4 text-right font-semibold"
                        >
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#E8E1D6] dark:divide-white/10">
                      {visibleBorrows.map((borrow) => {
                        const isReturning = returningId === borrow.id;

                        return (
                          <tr key={borrow.id}>
                            <th scope="row" className="px-4 py-4 font-normal">
                              <div className="flex min-w-52 items-center gap-3">
                                <BorrowCover
                                  imageUrl={borrow.bookImageUrl}
                                  title={borrow.bookTitle}
                                />
                                <span className="font-serif text-lg font-semibold text-[#292621] dark:text-[#F2E9D8]">
                                  {borrow.bookTitle}
                                </span>
                              </div>
                            </th>

                            <td className="px-4 py-4 text-sm text-[#6D675F] dark:text-[#C8C0B3]">
                              {formatDate(borrow.borrowedAt)}
                            </td>

                            <td className="px-4 py-4 text-sm text-[#6D675F] dark:text-[#C8C0B3]">
                              {formatDate(borrow.dueAt)}
                              {borrow.status === "returned" &&
                                borrow.returnedAt && (
                                  <span className="mt-1 block text-xs">
                                    Returned {formatDate(borrow.returnedAt)}
                                  </span>
                                )}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                                  borrow.status === "active"
                                    ? "bg-[#E1EBDD] text-[#315748] dark:bg-[#315748]/40 dark:text-[#C9E1C2]"
                                    : "bg-[#EEE6DA] text-[#765C46] dark:bg-white/10 dark:text-[#D8C5A9]"
                                }`}
                              >
                                {borrow.status === "active"
                                  ? "Borrowed"
                                  : "Returned"}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-right">
                              {borrow.status === "active" ? (
                                <button
                                  type="button"
                                  onClick={() => void handleReturn(borrow)}
                                  disabled={returningId !== null}
                                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#234237] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#315748] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#F2E9D8] dark:text-[#172B25] dark:hover:bg-white"
                                >
                                  {isReturning ? (
                                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                  ) : (
                                    <RotateCcw
                                      className="size-4"
                                      aria-hidden="true"
                                    />
                                  )}
                                  {isReturning ? "Returning…" : "Return Book"}
                                </button>
                              ) : (
                                <span className="text-sm text-[#8A8175] dark:text-[#B8B0A3]">
                                  Complete
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default MyBorrowsView;
