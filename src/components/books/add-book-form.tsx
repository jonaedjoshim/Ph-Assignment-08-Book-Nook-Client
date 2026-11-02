"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  ImagePlus,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

import Container from "@/components/layout/container";
import { authenticatedApiRequest } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";

const categories = ["Fiction", "Science", "History", "Kids", "Others"] as const;
type BookCategory = (typeof categories)[number];

const bookFormSchema = z.object({
  title: z.string().trim().min(1, "Enter the book title.").max(120),
  author: z.string().trim().min(1, "Enter the author's name.").max(100),
  category: z.enum(categories),
  description: z
    .string()
    .trim()
    .min(1, "Add a short description.")
    .max(1000, "Description must be 1,000 characters or fewer."),
  totalCopies: z.coerce
    .number()
    .int("Enter a whole number.")
    .min(1, "Add at least one copy.")
    .max(10000, "Maximum 10,000 copies are allowed."),
});

type BookFormValues = {
  title: string;
  author: string;
  category: BookCategory;
  description: string;
  totalCopies: string;
};

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface CreatedBook {
  _id: string;
  title: string;
}

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const inputClassName =
  "h-12 w-full rounded-md border border-border bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/10";

export default function AddBookForm() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const [values, setValues] = useState<BookFormValues>({
    title: "",
    author: "",
    category: "Fiction",
    description: "",
    totalCopies: "1",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitStage, setSubmitStage] = useState<
    "idle" | "uploading" | "saving"
  >("idle");

  const isSubmitting = submitStage !== "idle";

  useEffect(() => {
    if (!sessionPending && !session) {
      router.replace(`/login?returnTo=${encodeURIComponent("/add-book")}`);
    }
  }, [router, session, sessionPending]);

  useEffect(() => {
    if (!imagePreview) {
      return;
    }

    return () => URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  function updateValue<Key extends keyof BookFormValues>(
    field: Key,
    value: BookFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const image = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";

    if (!image) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
      toast.error("Choose a JPG, PNG, or WebP image.");
      return;
    }

    if (image.size > MAX_IMAGE_SIZE) {
      toast.error("Choose an image smaller than 4 MB.");
      return;
    }

    setSelectedImage(image);
    setImagePreview(URL.createObjectURL(image));
    setErrors((current) => ({ ...current, image: "" }));
  }

  function removeImage() {
    setSelectedImage(null);
    setImagePreview(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    if (!selectedImage) {
      setErrors({ image: "Choose a cover image for the book." });
      toast.error("Add a book cover image before submitting.");
      return;
    }

    const validation = bookFormSchema.safeParse({
      ...values,
      totalCopies: values.totalCopies,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};

      for (const issue of validation.error.issues) {
        const field = issue.path[0];

        if (typeof field === "string" && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }

      setErrors(fieldErrors);
      toast.error("Check the highlighted book details.");
      return;
    }

    setSubmitStage("uploading");

    try {
      const imageFormData = new FormData();
      imageFormData.append("image", selectedImage);

      const uploadResponse = await fetch("/api/uploads/image", {
        method: "POST",
        body: imageFormData,
      });

      const uploadResult = (await uploadResponse
        .json()
        .catch(() => null)) as ApiResponse<{ imageUrl: string }> | null;

      if (
        !uploadResponse.ok ||
        !uploadResult?.success ||
        !uploadResult.data?.imageUrl
      ) {
        throw new Error(uploadResult?.message || "Could not upload the cover.");
      }

      setSubmitStage("saving");

      const bookResponse = await authenticatedApiRequest("books", {
        method: "POST",
        body: JSON.stringify({
          ...validation.data,
          imageUrl: uploadResult.data.imageUrl,
        }),
      });

      const bookResult = (await bookResponse
        .json()
        .catch(() => null)) as ApiResponse<CreatedBook> | null;

      if (!bookResponse.ok || !bookResult?.success || !bookResult.data) {
        throw new Error(bookResult?.message || "Could not add this book.");
      }

      toast.success("Book added to the BookNook collection.");
      router.replace("/my-books");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not add this book.",
      );
    } finally {
      setSubmitStage("idle");
    }
  }

  if (sessionPending || !session) {
    return (
      <main className="section-padding min-h-[60vh] bg-background">
        <Container>
          <div className="mx-auto max-w-3xl animate-pulse rounded-xl border border-border bg-card p-8">
            <div className="h-8 w-56 rounded bg-muted" />
            <div className="mt-8 h-12 rounded bg-muted" />
            <div className="mt-5 h-12 rounded bg-muted" />
            <div className="mt-5 h-40 rounded bg-muted" />
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main>
      <section className="section-padding min-h-[70vh] bg-background">
        <Container>
          <div className="mx-auto max-w-5xl">
            <a
              href="/my-books"
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="size-4" />
              Back to My Books
            </a>

            <div className="mb-10 max-w-2xl">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-primary/50" />
                <span className="editorial-label text-primary">
                  SHARE A STORY
                </span>
              </div>

              <h1 className="section-heading text-foreground">
                Add a book to{" "}
                <span className="font-normal italic text-primary">
                  the shelf.
                </span>
              </h1>

              <p className="section-description">
                Add a book you love and let another reader discover where its
                pages might take them.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]"
            >
              <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
                <div className="mb-7">
                  <h2 className="font-serif text-2xl text-foreground">
                    Book details
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tell readers a little about this book.
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label
                      htmlFor="book-title"
                      className="text-sm font-medium text-foreground"
                    >
                      Book title
                    </label>
                    <input
                      id="book-title"
                      name="title"
                      autoComplete="off"
                      maxLength={120}
                      required
                      disabled={isSubmitting}
                      value={values.title}
                      onChange={(event) =>
                        updateValue("title", event.target.value)
                      }
                      placeholder="e.g. The Midnight Library"
                      aria-invalid={Boolean(errors.title)}
                      className={`${inputClassName} ${
                        errors.title ? "border-destructive" : ""
                      }`}
                    />
                    {errors.title && (
                      <p className="text-xs text-destructive">{errors.title}</p>
                    )}
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="book-author"
                        className="text-sm font-medium text-foreground"
                      >
                        Author
                      </label>
                      <input
                        id="book-author"
                        name="author"
                        maxLength={100}
                        required
                        disabled={isSubmitting}
                        value={values.author}
                        onChange={(event) =>
                          updateValue("author", event.target.value)
                        }
                        placeholder="e.g. Matt Haig"
                        aria-invalid={Boolean(errors.author)}
                        className={`${inputClassName} ${
                          errors.author ? "border-destructive" : ""
                        }`}
                      />
                      {errors.author && (
                        <p className="text-xs text-destructive">
                          {errors.author}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="book-category"
                        className="text-sm font-medium text-foreground"
                      >
                        Category
                      </label>
                      <select
                        id="book-category"
                        name="category"
                        disabled={isSubmitting}
                        value={values.category}
                        onChange={(event) =>
                          updateValue(
                            "category",
                            event.target.value as BookCategory,
                          )
                        }
                        className={inputClassName}
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="book-copies"
                      className="text-sm font-medium text-foreground"
                    >
                      Total copies
                    </label>
                    <input
                      id="book-copies"
                      name="totalCopies"
                      type="number"
                      min={1}
                      max={10000}
                      step={1}
                      required
                      disabled={isSubmitting}
                      value={values.totalCopies}
                      onChange={(event) =>
                        updateValue("totalCopies", event.target.value)
                      }
                      placeholder="Number of available copies"
                      aria-invalid={Boolean(errors.totalCopies)}
                      className={`${inputClassName} ${
                        errors.totalCopies ? "border-destructive" : ""
                      }`}
                    />
                    {errors.totalCopies && (
                      <p className="text-xs text-destructive">
                        {errors.totalCopies}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label
                        htmlFor="book-description"
                        className="text-sm font-medium text-foreground"
                      >
                        Short description
                      </label>
                      <span className="text-xs text-muted-foreground">
                        {values.description.length}/1000
                      </span>
                    </div>
                    <textarea
                      id="book-description"
                      name="description"
                      rows={6}
                      maxLength={1000}
                      required
                      disabled={isSubmitting}
                      value={values.description}
                      onChange={(event) =>
                        updateValue("description", event.target.value)
                      }
                      placeholder="What might make another reader pick up this book?"
                      aria-invalid={Boolean(errors.description)}
                      className={`w-full resize-y rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/10 ${
                        errors.description ? "border-destructive" : ""
                      }`}
                    />
                    {errors.description && (
                      <p className="text-xs text-destructive">
                        {errors.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-8 border-t border-border pt-6">
                  <div className="mb-5">
                    <h2 className="font-serif text-2xl text-foreground">
                      Added by
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      These account details are read-only.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="creator-name"
                        className="text-sm font-medium text-foreground"
                      >
                        Your name
                      </label>
                      <input
                        id="creator-name"
                        value={session.user.name || ""}
                        readOnly
                        className={`${inputClassName} cursor-not-allowed bg-muted/50`}
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="creator-email"
                        className="text-sm font-medium text-foreground"
                      >
                        Your email
                      </label>
                      <input
                        id="creator-email"
                        type="email"
                        value={session.user.email || ""}
                        readOnly
                        className={`${inputClassName} cursor-not-allowed bg-muted/50`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <aside className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
                  <div>
                    <h2 className="font-serif text-2xl text-foreground">
                      Cover image
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Choose a clear JPG, PNG, or WebP image up to 4 MB.
                    </p>
                  </div>

                  <div className="mt-6 overflow-hidden rounded-lg border border-dashed border-border bg-background">
                    {imagePreview ? (
                      <div className="relative flex min-h-70 items-center justify-center bg-secondary/40 p-5">
                        <Image
                          src={imagePreview}
                          alt="Selected book cover preview"
                          width={220}
                          height={300}
                          unoptimized
                          className="max-h-75 w-auto rounded-md object-contain shadow-md"
                        />
                      </div>
                    ) : (
                      <div className="flex min-h-70 flex-col items-center justify-center px-6 text-center">
                        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <BookOpen className="size-6" strokeWidth={1.5} />
                        </div>
                        <p className="mt-4 font-serif text-xl text-foreground">
                          A cover helps a story find its reader.
                        </p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          JPG, PNG, or WebP · Up to 4 MB
                        </p>
                      </div>
                    )}
                  </div>

                  <input
                    id="book-cover"
                    name="image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    disabled={isSubmitting}
                    className="peer sr-only"
                  />

                  <div className="mt-4 flex flex-wrap gap-3">
                    <label
                      htmlFor="book-cover"
                      className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary peer-focus-visible:ring-2 peer-focus-visible:ring-primary"
                    >
                      <ImagePlus className="size-4" />
                      {selectedImage ? "Choose another image" : "Choose image"}
                    </label>

                    {selectedImage && (
                      <button
                        type="button"
                        onClick={removeImage}
                        disabled={isSubmitting}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                      >
                        <Trash2 className="size-4" />
                        Remove
                      </button>
                    )}
                  </div>

                  {errors.image && (
                    <p className="mt-3 text-xs text-destructive">
                      {errors.image}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-primary/15 bg-primary/5 p-6">
                  <p className="text-xs font-semibold tracking-[0.18em] text-primary">
                    A NOTE FOR READERS
                  </p>
                  <p className="mt-3 font-serif text-xl italic leading-7 text-foreground">
                    “A book shared is a story that travels further.”
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <ArrowUpRight className="size-4" />
                  )}
                  {submitStage === "uploading"
                    ? "Uploading cover..."
                    : submitStage === "saving"
                      ? "Adding your book..."
                      : "Add book to BookNook"}
                </button>
              </aside>
            </form>
          </div>
        </Container>
      </section>
    </main>
  );
}
