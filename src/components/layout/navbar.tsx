"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import Container from "@/components/layout/container";
import ThemeToggle from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

const publicLinks = [
  { label: "Home", href: "/" },
  { label: "All Books", href: "/books" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isDark = resolvedTheme === "dark";

  const logo = isDark
    ? "/assets/brand/logo-dark.png"
    : "/assets/brand/logo-light.png";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <Container>
        <div className="flex h-20 items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="relative flex shrink-0 items-center">
            <Image
              src={mounted ? logo : "/assets/brand/logo-light.png"}
              alt="BookNook Logo"
              width={190}
              height={65}
              priority
              className="h-auto w-36 object-contain sm:w-40"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 lg:flex">
            {publicLinks.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-sm font-medium transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}

                  {isActive && (
                    <span className="absolute -bottom-2 left-0 h-0.5 w-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 lg:flex">
            <ThemeToggle />

            <Link
              href="/login"
              className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary"
            >
              Login
            </Link>

            <Button
              size="lg"
              className="rounded-md px-5"
              render={
                <Link href="/register">
                  Join BookNook
                  <ArrowUpRight className="ml-1 size-4" />
                </Link>
              }
            />
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-3 lg:hidden">
            <ThemeToggle />

            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="flex size-10 items-center justify-center rounded-md border border-border"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="border-t border-border pb-6 pt-4 lg:hidden">
            <nav className="flex flex-col gap-1">
              {publicLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-md px-4 py-3 text-sm font-medium ${
                    pathname === link.href
                      ? "bg-secondary text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-5">
              <Button
                variant="outline"
                render={<Link href="/login">Login</Link>}
              />

              <Button render={<Link href="/register">Register</Link>} />
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}
