"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import Container from "@/components/layout/container";
import { authenticatedApiRequest } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";

const categories = ["Fiction", "Science", "History", "Kids", "Others"] as const;

type BookCategory = (typeof categories)[number];

interface Book {
  _id: string;
  title: string;
  author: string;
  category: BookCategory;
  imageUrl: string;
  description: string;
  totalCopies: number;
  availableCopies: number;
  createdBy: {
    userId: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface EditBookValues {
  title: string;
  author: string;
  category: BookCategory;
  imageUrl: string;
  description: string;
  totalCopies: string;
}

function formatDate(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Recently added";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function BookCover({ book }: { book: Book }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="relative aspect-3/4 overflow-hidden bg-secondary">
      {!imageFailed ? (
        <Image
          src={book.imageUrl}
          alt={`Cover of ${book.title}`}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          onError={() => setImageFailed(true)}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
          <BookOpen className="size-10" strokeWidth={1.2} />
          <span className="font-serif text-lg">{book.title}</span>
        </div>
      )}

      <span className="absolute top-3 left-3 rounded-full border border-border/50 bg-background/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
        {book.category}
      </span>
    </div>
  );
}

function BookCard({
  book,
  onEdit,
  onDelete,
}: {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
}) {
  return (
    <article className="group overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <BookCover book={book} />

      <div className="p-5">
        <h2 className="line-clamp-1 font-serif text-2xl font-semibold text-foreground">
          {book.title}
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">by {book.author}</p>

        <p className="mt-4 line-clamp-2 min-h-12 text-sm leading-6 text-muted-foreground">
          {book.description}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
          <div>
            <p className="text-xs text-muted-foreground">Available copies</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {book.availableCopies}{" "}
              <span className="font-normal text-muted-foreground">
                of {book.totalCopies}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(book)}
              aria-label={`Edit ${book.title}`}
              className="inline-flex size-9 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Pencil className="size-4" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(book)}
              aria-label={`Delete ${book.title}`}
              className="inline-flex size-9 items-center justify-center rounded-md border border-border text-destructive transition-colors hover:border-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>

        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" />
          Added {formatDate(book.createdAt)}
        </p>
      </div>
    </article>
  );
}

function EditBookDialog({
  book,
  pending,
  onClose,
  onSave,
}: {
  book: Book;
  pending: boolean;
  onClose: () => void;
  onSave: (values: EditBookValues) => Promise<void>;
}) {
  const [values, setValues] = useState<EditBookValues>({
    title: book.title,
    author: book.author,
    category: book.category,
    imageUrl: book.imageUrl,
    description: book.description,
    totalCopies: String(book.totalCopies),
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSave({
      title: values.title.trim(),
      author: values.author.trim(),
      category: values.category,
      imageUrl: values.imageUrl.trim(),
      description: values.description.trim(),
      totalCopies: values.totalCopies,
    });
  }

  const inputClassName =
    "h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10";

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-book-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card px-6 py-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-primary">
              YOUR BOOKSHELF
            </p>
            <h2
              id="edit-book-title"
              className="mt-2 font-serif text-3xl text-foreground"
            >
              Edit book details
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            aria-label="Close edit dialog"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="edit-title" className="text-sm font-medium">
                Book title
              </label>
              <input
                id="edit-title"
                name="title"
                value={values.title}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                maxLength={120}
                required
                disabled={pending}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-author" className="text-sm font-medium">
                Author
              </label>
              <input
                id="edit-author"
                name="author"
                value={values.author}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    author: event.target.value,
                  }))
                }
                maxLength={100}
                required
                disabled={pending}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-category" className="text-sm font-medium">
                Category
              </label>
              <select
                id="edit-category"
                name="category"
                value={values.category}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    category: event.target.value as BookCategory,
                  }))
                }
                disabled={pending}
                className={inputClassName}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="edit-total-copies"
                className="text-sm font-medium"
              >
                Total copies
              </label>
              <input
                id="edit-total-copies"
                name="totalCopies"
                type="number"
                min={1}
                max={10000}
                step={1}
                value={values.totalCopies}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    totalCopies: event.target.value,
                  }))
                }
                required
                disabled={pending}
                className={inputClassName}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-image-url" className="text-sm font-medium">
              Book cover image URL
            </label>
            <input
              id="edit-image-url"
              name="imageUrl"
              type="url"
              value={values.imageUrl}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  imageUrl: event.target.value,
                }))
              }
              required
              disabled={pending}
              className={inputClassName}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="edit-description"
              name="description"
              value={values.description}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              maxLength={1000}
              rows={4}
              required
              disabled={pending}
              className="w-full resize-y rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="inline-flex h-11 items-center justify-center rounded-md border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending && <LoaderCircle className="size-4 animate-spin" />}
              {pending ? "Saving changes..." : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function DeleteBookDialog({
  book,
  pending,
  onClose,
  onConfirm,
}: {
  book: Book;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <div
      role="presentation"
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) {
          onClose();
        }
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-book-title"
        aria-describedby="delete-book-description"
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Trash2 className="size-5" />
        </div>

        <h2
          id="delete-book-title"
          className="mt-5 font-serif text-2xl text-foreground"
        >
          Remove this book?
        </h2>

        <p
          id="delete-book-description"
          className="mt-3 text-sm leading-6 text-muted-foreground"
        >
          <span className="font-semibold text-foreground">{book.title}</span>{" "}
          will be removed from your bookshelf. A book with active borrows cannot
          be deleted.
        </p>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="inline-flex h-11 items-center justify-center rounded-md border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
          >
            Keep book
          </button>

          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={pending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-destructive px-5 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending && <LoaderCircle className="size-4 animate-spin" />}
            {pending ? "Removing..." : "Remove book"}
          </button>
        </div>
      </section>
    </div>
  );
}

function LoadingBooks() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-lg border border-border bg-card"
        >
          <div className="aspect-3/4 animate-pulse bg-muted" />
          <div className="space-y-3 p-5">
            <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-12 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MyBooksView() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (sessionPending) {
      return;
    }

    if (!session) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
      return;
    }

    let active = true;

    async function loadBooks() {
      try {
        const response = await authenticatedApiRequest(
          "books?mine=true&limit=50",
        );

        const result = (await response.json().catch(() => null)) as ApiResponse<
          Book[]
        > | null;

        if (!response.ok || !result?.success || !Array.isArray(result.data)) {
          throw new Error(result?.message || "Could not load your books.");
        }

        if (active) {
          setBooks(result.data);
          setLoadError("");
        }
      } catch (error) {
        if (active) {
          const message =
            error instanceof Error
              ? error.message
              : "Could not load your books.";

          setLoadError(message);
          toast.error(message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadBooks();

    return () => {
      active = false;
    };
  }, [pathname, router, session, sessionPending]);

  useEffect(() => {
    if (!editingBook && !bookToDelete) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || saving || deleting) {
        return;
      }

      setEditingBook(null);
      setBookToDelete(null);
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [bookToDelete, deleting, editingBook, saving]);

  async function handleSaveBook(values: EditBookValues) {
    if (!editingBook) {
      return;
    }

    const totalCopies = Number(values.totalCopies);

    if (!Number.isInteger(totalCopies) || totalCopies < 1) {
      toast.error("Total copies must be a whole number greater than zero.");
      return;
    }

    setSaving(true);

    try {
      const response = await authenticatedApiRequest(
        `books/${editingBook._id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            ...values,
            totalCopies,
          }),
        },
      );

      const result = (await response
        .json()
        .catch(() => null)) as ApiResponse<Book> | null;

      if (!response.ok || !result?.success || !result.data) {
        throw new Error(result?.message || "Could not update this book.");
      }

      setBooks((current) =>
        current.map((book) =>
          book._id === result.data?._id ? result.data : book,
        ),
      );
      setEditingBook(null);
      toast.success("Book details updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update this book.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBook() {
    if (!bookToDelete) {
      return;
    }

    setDeleting(true);

    try {
      const response = await authenticatedApiRequest(
        `books/${bookToDelete._id}`,
        {
          method: "DELETE",
        },
      );

      const result = (await response.json().catch(() => null)) as ApiResponse<{
        id: string;
      }> | null;

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Could not remove this book.");
      }

      setBooks((current) =>
        current.filter((book) => book._id !== bookToDelete._id),
      );
      setBookToDelete(null);
      toast.success("Book removed from your bookshelf.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not remove this book.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const shouldShowLoading = sessionPending || !session || loading;

  return (
    <main>
      <section className="section-padding min-h-[60vh] bg-background">
        <Container>
          <div className="mb-10 flex flex-col justify-between gap-6 md:mb-14 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-primary/50" />
                <span className="editorial-label text-primary">
                  YOUR BOOKSHELF
                </span>
              </div>

              <h1 className="section-heading text-foreground">
                Books you&apos;ve{" "}
                <span className="font-normal italic text-primary">added.</span>
              </h1>

              <p className="section-description">
                Keep your shared collection in order. Update book details or
                remove a title from your shelf.
              </p>
            </div>

            <Link
              href="/add-book"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="size-4" />
              Add a book
              <ArrowUpRight className="size-4" />
            </Link>
          </div>

          {shouldShowLoading ? (
            <LoadingBooks />
          ) : loadError ? (
            <div className="rounded-lg border border-border bg-card px-6 py-12 text-center">
              <BookOpen className="mx-auto size-10 text-muted-foreground" />
              <h2 className="mt-4 font-serif text-2xl text-foreground">
                Your bookshelf could not be loaded
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-6 inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Try again
              </button>
            </div>
          ) : books.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BookOpen className="size-7" strokeWidth={1.5} />
              </div>

              <h2 className="mt-6 font-serif text-3xl text-foreground">
                Your shelf is waiting for its first story.
              </h2>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                Add a book to your collection and make it available for other
                readers to discover and borrow.
              </p>

              <Link
                href="/add-book"
                className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Add your first book
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-5 text-sm text-muted-foreground">
                {books.length} {books.length === 1 ? "book" : "books"} on your
                shelf
              </p>

              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {books.map((book) => (
                  <BookCard
                    key={book._id}
                    book={book}
                    onEdit={setEditingBook}
                    onDelete={setBookToDelete}
                  />
                ))}
              </div>
            </>
          )}
        </Container>
      </section>

      {editingBook && (
        <EditBookDialog
          key={editingBook._id}
          book={editingBook}
          pending={saving}
          onClose={() => setEditingBook(null)}
          onSave={handleSaveBook}
        />
      )}

      {bookToDelete && (
        <DeleteBookDialog
          book={bookToDelete}
          pending={deleting}
          onClose={() => setBookToDelete(null)}
          onConfirm={handleDeleteBook}
        />
      )}
    </main>
  );
}
