"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ChevronDown,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import BrandLogo from "@/components/layout/brand-logo";
import Container from "@/components/layout/container";
import ThemeToggle from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const publicLinks = [
  { label: "Home", href: "/" },
  { label: "All Books", href: "/books" },
];

const privateLinks = [
  { label: "Add Book", href: "/add-book" },
  { label: "My Books", href: "/my-books" },
  { label: "My Borrows", href: "/my-borrows" },
];

interface NavUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

function UserAvatar({
  user,
  className,
}: {
  user: NavUser;
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const initial =
    user.name?.trim().charAt(0).toUpperCase() ||
    user.email?.trim().charAt(0).toUpperCase() ||
    "R";

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary",
        className,
      )}
    >
      {user.image && !imageFailed ? (
        <Image
          src={user.image}
          alt=""
          width={36}
          height={36}
          unoptimized
          onError={() => setImageFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  );
}

function ProfileMenu({
  user,
  onSignedOut,
}: {
  user: NavUser;
  onSignedOut?: () => void;
}) {
  const router = useRouter();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      const { error } = await authClient.signOut();

      if (error) {
        toast.error(error.message || "Could not sign out.");
        return;
      }

      menuRef.current?.removeAttribute("open");
      onSignedOut?.();
      toast.success("You have signed out.");
      router.replace("/");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not sign out.",
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <details ref={menuRef} className="group relative">
      <summary
        aria-label="Open account menu"
        className="flex cursor-pointer list-none items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden"
      >
        <UserAvatar user={user} className="size-9 border border-border" />

        <span className="hidden max-w-28 truncate text-sm font-medium text-foreground lg:inline">
          {user.name || "Reader"}
        </span>

        <ChevronDown className="hidden size-4 text-muted-foreground lg:block" />
      </summary>

      <div className="absolute top-[calc(100%+0.75rem)] right-0 z-50 w-64 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div className="border-b border-border px-4 py-3">
          <p className="truncate text-sm font-semibold text-foreground">
            {user.name || "BookNook Reader"}
          </p>

          {user.email && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          )}
        </div>

        <div className="p-2">
          <Link
            href="/my-profile"
            onClick={() => menuRef.current?.removeAttribute("open")}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
          >
            <UserRound className="size-4 text-muted-foreground" />
            My Profile
          </Link>

          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={isSigningOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="size-4" />
            {isSigningOut ? "Signing out..." : "Logout"}
          </button>
        </div>
      </div>
    </details>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  const user = session?.user;
  const links = user ? [...publicLinks, ...privateLinks] : publicLinks;

  function isLinkActive(href: string) {
    return (
      pathname === href || (href !== "/" && pathname.startsWith(`${href}/`))
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md">
      <Container>
        <div className="flex h-20 min-w-0 items-center gap-4">
          {/* Brand */}
          <div className="shrink-0">
            <BrandLogo iconSize={36} priority />
          </div>

          {/* Tablet and Desktop Navigation */}
          <nav className="scrollbar-none mx-4 hidden min-w-0 flex-1 items-center gap-6 overflow-x-auto whitespace-nowrap md:flex lg:mx-8">
            {links.map((link) => {
              const active = isLinkActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative shrink-0 py-3 text-sm font-medium transition-colors ${
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}

                  {active && (
                    <span className="absolute right-0 bottom-1 left-0 h-0.5 bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Tablet and Desktop Actions */}
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <ThemeToggle />

            {isPending ? (
              <div
                aria-label="Checking account"
                className="h-9 w-24 animate-pulse rounded-md bg-muted"
              />
            ) : user ? (
              <ProfileMenu user={user} />
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-2 py-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
                >
                  Login
                </Link>

                <Button
                  nativeButton={false}
                  size="lg"
                  className="rounded-md px-4"
                  render={
                    <Link href="/register">
                      Join BookNook
                      <ArrowUpRight className="ml-1 size-4" />
                    </Link>
                  }
                />
              </>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="ml-auto flex shrink-0 items-center gap-2 md:hidden">
            <ThemeToggle />

            {!isPending && user && (
              <ProfileMenu user={user} onSignedOut={() => setMenuOpen(false)} />
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="flex size-10 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-secondary"
            >
              {menuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="border-t border-border pt-4 pb-6 md:hidden">
            <nav className="flex flex-col gap-1">
              {links.map((link) => {
                const active = isLinkActive(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                      active
                        ? "bg-secondary text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {isPending ? (
              <div className="mt-5 h-11 animate-pulse rounded-md bg-muted" />
            ) : user ? (
              <div className="mt-5 flex items-center gap-3 border-t border-border px-4 pt-5">
                <UserAvatar user={user} className="size-9" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Signed in as</p>
                  <p className="truncate text-sm font-medium text-foreground">
                    {user.name || user.email || "BookNook Reader"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-5">
                <Button
                  nativeButton={false}
                  variant="outline"
                  render={
                    <Link href="/login" onClick={() => setMenuOpen(false)}>
                      Login
                    </Link>
                  }
                />

                <Button
                  nativeButton={false}
                  render={
                    <Link href="/register" onClick={() => setMenuOpen(false)}>
                      Register
                    </Link>
                  }
                />
              </div>
            )}
          </div>
        )}
      </Container>
    </header>
  );
}
