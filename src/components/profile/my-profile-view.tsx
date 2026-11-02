"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  LibraryBig,
  Mail,
  UserRound,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";

function formatMemberSince(value: Date | string | null | undefined): string {
  if (!value) {
    return "Welcome to BookNook";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Welcome to BookNook";
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "B";
}

function ProfileAvatar({ imageUrl, name }: { imageUrl: string; name: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!imageUrl || imageFailed) {
    return (
      <div
        aria-label={`${name}'s profile initials`}
        className="grid size-24 shrink-0 place-items-center rounded-full bg-[#234237] font-serif text-3xl font-semibold text-[#F2E9D8] ring-4 ring-[#E8E1D6] dark:bg-[#F2E9D8] dark:text-[#172B25] dark:ring-white/10 sm:size-28"
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={`${name}'s profile`}
      referrerPolicy="no-referrer"
      onError={() => setImageFailed(true)}
      className="size-24 shrink-0 rounded-full bg-[#EEE6DA] object-cover ring-4 ring-[#E8E1D6] dark:bg-[#263D34] dark:ring-white/10 sm:size-28"
    />
  );
}

function LoadingState() {
  return (
    <main className="grid min-h-[55vh] place-items-center px-4">
      <div className="flex items-center gap-3 text-sm text-[#6D675F] dark:text-[#C8C0B3]">
        <span className="size-5 animate-spin rounded-full border-2 border-[#234237] border-t-transparent dark:border-[#F2E9D8] dark:border-t-transparent" />
        Loading your profile…
      </div>
    </main>
  );
}

export function MyProfileView() {
  const router = useRouter();
  const { data: sessionData, isPending: isSessionPending } =
    authClient.useSession();

  const user = sessionData?.user;
  const userId = user?.id;

  useEffect(() => {
    if (!isSessionPending && !userId) {
      router.replace(`/login?callbackURL=${encodeURIComponent("/my-profile")}`);
    }
  }, [isSessionPending, router, userId]);

  if (isSessionPending || !user) {
    return <LoadingState />;
  }

  const name = user.name?.trim() || "BookNook reader";
  const email = user.email?.trim() || "Email not available";
  const imageUrl = user.image || "";
  const memberSince = formatMemberSince(user.createdAt);

  return (
    <main className="min-h-[70vh] bg-[#F8F5EF] py-12 dark:bg-[#172B25] md:py-16">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#765C46] dark:text-[#D8C5A9]">
            Your corner of the library
          </p>

          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-[#292621] dark:text-[#F2E9D8] sm:text-5xl">
            My Profile
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6D675F] dark:text-[#C8C0B3] sm:text-base">
            A little space for your BookNook account and reading life.
          </p>
        </header>

        <section className="overflow-hidden rounded-3xl border border-[#E8E1D6] bg-[#FFFEFA] shadow-sm dark:border-white/10 dark:bg-[#1E352D]">
          <div className="h-2 bg-[#234237] dark:bg-[#D8C5A9]" />

          <div className="p-5 sm:p-8 md:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
              <ProfileAvatar imageUrl={imageUrl} name={name} />

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#765C46] dark:text-[#D8C5A9]">
                  BookNook member
                </p>

                <h2 className="mt-2 wrap-break-word font-serif text-3xl font-semibold text-[#292621] dark:text-[#F2E9D8] sm:text-4xl">
                  {name}
                </h2>

                <p className="mt-2 break-all text-sm text-[#6D675F] dark:text-[#C8C0B3]">
                  {email}
                </p>

                <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#F8F5EF] px-3.5 py-2 text-xs font-medium text-[#765C46] dark:bg-[#172B25] dark:text-[#D8C5A9]">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  Member since {memberSince}
                </p>
              </div>
            </div>

            <div className="my-8 border-t border-[#E8E1D6] dark:border-white/10" />

            <div className="grid gap-4 sm:grid-cols-2">
              <section className="rounded-2xl bg-[#F8F5EF] p-5 dark:bg-[#172B25]">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#E8E1D6] text-[#234237] dark:bg-white/10 dark:text-[#F2E9D8]">
                  <UserRound className="size-5" aria-hidden="true" />
                </div>

                <h3 className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#8A8175] dark:text-[#B8B0A3]">
                  Account name
                </h3>

                <p className="mt-2 wrap-break-word text-base font-medium text-[#292621] dark:text-[#F2E9D8]">
                  {name}
                </p>
              </section>

              <section className="rounded-2xl bg-[#F8F5EF] p-5 dark:bg-[#172B25]">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#E8E1D6] text-[#234237] dark:bg-white/10 dark:text-[#F2E9D8]">
                  <Mail className="size-5" aria-hidden="true" />
                </div>

                <h3 className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#8A8175] dark:text-[#B8B0A3]">
                  Email address
                </h3>

                <p className="mt-2 break-all text-base font-medium text-[#292621] dark:text-[#F2E9D8]">
                  {email}
                </p>
              </section>
            </div>

            <section className="mt-8 rounded-2xl border border-[#E8E1D6] p-5 dark:border-white/10 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E8E1D6] text-[#234237] dark:bg-white/10 dark:text-[#F2E9D8]">
                  <BookOpen className="size-5" aria-hidden="true" />
                </div>

                <div>
                  <h3 className="font-serif text-xl font-semibold text-[#292621] dark:text-[#F2E9D8]">
                    Keep your reading life moving
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#6D675F] dark:text-[#C8C0B3]">
                    Find a new read, manage the books you’ve added, or check the
                    books you’ve borrowed.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/my-books"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#234237] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#315748] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234237] focus-visible:ring-offset-2 dark:bg-[#F2E9D8] dark:text-[#172B25] dark:hover:bg-white"
                >
                  <LibraryBig className="size-4" aria-hidden="true" />
                  My Books
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>

                <Link
                  href="/my-borrows"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#E8E1D6] px-5 py-3 text-sm font-semibold text-[#234237] transition hover:bg-[#F8F5EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234237] focus-visible:ring-offset-2 dark:border-white/10 dark:text-[#F2E9D8] dark:hover:bg-white/10"
                >
                  <BookOpen className="size-4" aria-hidden="true" />
                  My Borrows
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

export default MyProfileView;
