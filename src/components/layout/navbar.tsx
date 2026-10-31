"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useState } from "react";

import Container from "@/components/layout/container";
import BrandLogo from "@/components/layout/brand-logo";
import ThemeToggle from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

const publicLinks = [
  { label: "Home", href: "/" },
  { label: "All Books", href: "/books" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md">
      <Container>
        <div className="flex h-20 min-w-0 items-center gap-4">
          {/* Brand */}
          <div className="shrink-0">
            <BrandLogo iconSize={36} priority />
          </div>

          {/* Desktop Navigation */}
          <nav className="scrollbar-none mx-8 hidden min-w-0 flex-1 items-center gap-6 overflow-x-auto whitespace-nowrap md:flex lg:mx-8">
            {publicLinks.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative shrink-0 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}

                  {isActive && (
                    <span className="absolute bottom-1 left-0 h-0.5 w-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <ThemeToggle />

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
          </div>

          {/* Mobile Actions */}
          <div className="ml-auto flex shrink-0 items-center gap-3 md:hidden">
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
          <div className="border-t border-border pt-4 pb-6 md:hidden">
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
          </div>
        )}
      </Container>
    </header>
  );
}
