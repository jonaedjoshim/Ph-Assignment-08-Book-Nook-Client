"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { FaGoogle } from "react-icons/fa6";
import { toast } from "sonner";
import { z } from "zod";

import Container from "@/components/layout/container";
import { authClient } from "@/lib/auth-client";

const registrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters.")
    .max(80),
  email: z.string().trim().email("Enter a valid email address."),
  photoUrl: z.string().trim().url("Enter a valid photo URL."),
  password: z
    .string()
    .min(6, "Password must contain at least 6 characters.")
    .regex(/[a-z]/, "Password must contain a lowercase letter.")
    .regex(/[A-Z]/, "Password must contain an uppercase letter."),
});

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type AuthMode = "login" | "register";

interface AuthFormProps {
  mode: AuthMode;
}

interface AuthFormValues {
  name: string;
  email: string;
  photoUrl: string;
  password: string;
}

function getReturnTo() {
  if (typeof window === "undefined") {
    return "/";
  }

  const requestedPath = new URLSearchParams(window.location.search).get(
    "returnTo",
  );

  if (
    requestedPath &&
    requestedPath.startsWith("/") &&
    !requestedPath.startsWith("//")
  ) {
    return requestedPath;
  }

  return "/";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";

  const [values, setValues] = useState<AuthFormValues>({
    name: "",
    email: "",
    photoUrl: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [pending, setPending] = useState(false);

  function updateValue(field: keyof AuthFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    if (isRegister) {
      const result = registrationSchema.safeParse(values);

      if (!result.success) {
        const fieldErrors: Record<string, string> = {};

        for (const issue of result.error.issues) {
          const field = issue.path[0];

          if (typeof field === "string" && !fieldErrors[field]) {
            fieldErrors[field] = issue.message;
          }
        }

        setErrors(fieldErrors);
        toast.error("Please check the highlighted fields.");
        return;
      }

      setPending(true);

      try {
        const { error } = await authClient.signUp.email({
          name: result.data.name,
          email: result.data.email,
          password: result.data.password,
          image: result.data.photoUrl,
        });

        if (error) {
          toast.error(error.message || "Could not create your account.");
          return;
        }

        toast.success("Your account is ready. Please sign in.");
        router.replace("/login");
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not create your account.",
        );
      } finally {
        setPending(false);
      }

      return;
    }

    const result = loginSchema.safeParse({
      email: values.email,
      password: values.password,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};

      for (const issue of result.error.issues) {
        const field = issue.path[0];

        if (typeof field === "string" && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }

      setErrors(fieldErrors);
      toast.error("Please check your email and password.");
      return;
    }

    setPending(true);

    try {
      const returnTo = getReturnTo();
      const { error } = await authClient.signIn.email({
        email: result.data.email,
        password: result.data.password,
        callbackURL: returnTo,
      });

      if (error) {
        toast.error(error.message || "Could not sign in.");
        return;
      }

      toast.success("Welcome back to BookNook.");
      router.replace(returnTo);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not sign in.",
      );
    } finally {
      setPending(false);
    }
  }

  async function handleGoogleSignIn() {
    setPending(true);

    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: getReturnTo(),
      });

      if (error) {
        toast.error(error.message || "Google sign-in is unavailable.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Google sign-in is unavailable.",
      );
    } finally {
      setPending(false);
    }
  }

  const inputClassName =
    "h-12 w-full rounded-md border border-border bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/10";

  return (
    <section className="bg-background py-12 sm:py-16 lg:py-20">
      <Container>
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
          {/* Editorial Panel */}
          <aside className="relative hidden min-h-[680px] flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
            <div className="absolute -top-20 -right-20 size-64 rounded-full border border-primary-foreground/10" />
            <div className="absolute right-10 bottom-20 size-40 rounded-full bg-primary-foreground/5" />

            <Link
              href="/"
              className="relative z-10 inline-flex w-fit items-center gap-2"
            >
              <BookOpen className="size-7" strokeWidth={1.5} />
              <span className="font-serif text-3xl font-semibold tracking-tight">
                BookNook
              </span>
            </Link>

            <div className="relative z-10 max-w-sm">
              <p className="mb-5 text-xs font-semibold tracking-[0.2em] text-primary-foreground/70">
                A HOME FOR BOOK LOVERS
              </p>

              <h2 className="font-serif text-5xl leading-[1.05] tracking-tight">
                Every page holds a possibility.
              </h2>

              <p className="mt-6 text-sm leading-7 text-primary-foreground/75">
                Find a story worth keeping close, borrow it for a while, and
                pass the joy of reading along.
              </p>
            </div>

            <p className="relative z-10 font-serif text-xl italic text-primary-foreground/80">
              Read · Discover · Belong
            </p>
          </aside>

          {/* Form */}
          <div className="flex items-center px-6 py-10 sm:px-10 lg:px-12">
            <div className="mx-auto w-full max-w-md">
              <p className="text-xs font-semibold tracking-[0.2em] text-primary">
                {isRegister ? "JOIN THE BOOKNOOK COMMUNITY" : "WELCOME BACK"}
              </p>

              <h1 className="mt-4 font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
                {isRegister ? (
                  <>
                    Make room for{" "}
                    <span className="italic text-primary">a new story.</span>
                  </>
                ) : (
                  <>
                    Your quiet corner{" "}
                    <span className="italic text-primary">awaits.</span>
                  </>
                )}
              </h1>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {isRegister
                  ? "Create an account to discover, borrow, and share meaningful reads."
                  : "Sign in to pick up where your next reading adventure begins."}
              </p>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={pending}
                className="mt-8 inline-flex h-12 w-full items-center justify-center gap-3 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaGoogle className="size-4 text-[#4285F4]" />
                Continue with Google
              </button>

              <div className="my-6 flex items-center gap-4">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">
                  or continue with email
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                {isRegister && (
                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="text-sm font-medium text-foreground"
                    >
                      Full name
                    </label>

                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Your name"
                      value={values.name}
                      onChange={(event) =>
                        updateValue("name", event.target.value)
                      }
                      disabled={pending}
                      required
                      aria-invalid={Boolean(errors.name)}
                      className={`${inputClassName} ${
                        errors.name ? "border-destructive" : ""
                      }`}
                    />

                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={values.email}
                    onChange={(event) =>
                      updateValue("email", event.target.value)
                    }
                    disabled={pending}
                    required
                    aria-invalid={Boolean(errors.email)}
                    className={`${inputClassName} ${
                      errors.email ? "border-destructive" : ""
                    }`}
                  />

                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                {isRegister && (
                  <div className="space-y-2">
                    <label
                      htmlFor="photoUrl"
                      className="text-sm font-medium text-foreground"
                    >
                      Profile photo URL
                    </label>

                    <input
                      id="photoUrl"
                      name="photoUrl"
                      type="url"
                      autoComplete="url"
                      placeholder="https://example.com/photo.jpg"
                      value={values.photoUrl}
                      onChange={(event) =>
                        updateValue("photoUrl", event.target.value)
                      }
                      disabled={pending}
                      required
                      aria-invalid={Boolean(errors.photoUrl)}
                      className={`${inputClassName} ${
                        errors.photoUrl ? "border-destructive" : ""
                      }`}
                    />

                    {errors.photoUrl && (
                      <p className="text-xs text-destructive">
                        {errors.photoUrl}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-foreground"
                    >
                      Password
                    </label>

                    {!isRegister && (
                      <button
                        type="button"
                        onClick={() =>
                          toast.info("Password reset is not available yet.")
                        }
                        className="text-xs font-medium text-primary transition-colors hover:text-foreground"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={passwordVisible ? "text" : "password"}
                      autoComplete={
                        isRegister ? "new-password" : "current-password"
                      }
                      placeholder={
                        isRegister ? "Create a password" : "Your password"
                      }
                      value={values.password}
                      onChange={(event) =>
                        updateValue("password", event.target.value)
                      }
                      disabled={pending}
                      required
                      aria-invalid={Boolean(errors.password)}
                      className={`${inputClassName} pr-12 ${
                        errors.password ? "border-destructive" : ""
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => setPasswordVisible((visible) => !visible)}
                      aria-label={
                        passwordVisible ? "Hide password" : "Show password"
                      }
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {passwordVisible ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>

                  {errors.password && (
                    <p className="text-xs text-destructive">
                      {errors.password}
                    </p>
                  )}

                  {isRegister && (
                    <p className="text-xs leading-5 text-muted-foreground">
                      Use at least 6 characters, including an uppercase and a
                      lowercase letter.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <>
                      {isRegister ? "Create account" : "Sign in"}
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-7 text-center text-sm text-muted-foreground">
                {isRegister ? "Already have an account?" : "New to BookNook?"}{" "}
                <Link
                  href={isRegister ? "/login" : "/register"}
                  className="font-semibold text-primary transition-colors hover:text-foreground"
                >
                  {isRegister ? "Sign in" : "Create an account"}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
