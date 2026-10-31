import Link from "next/link";
import { ArrowUpRight, Mail, MapPin } from "lucide-react";
import { FaFacebookF, FaInstagram, FaXTwitter } from "react-icons/fa6";

import Container from "@/components/layout/container";
import BrandLogo from "@/components/layout/brand-logo";
import Copyright from "@/components/layout/copyright";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "All Books", href: "/books" },
  { label: "Add Book", href: "/add-book" },
  { label: "My Books", href: "/my-books" },
];

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/",
    icon: FaFacebookF,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/",
    icon: FaInstagram,
  },
  {
    label: "X",
    href: "https://x.com/",
    icon: FaXTwitter,
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <Container>
        {/* Main Footer */}
        <div className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4 lg:gap-10 lg:py-20">
          {/* Brand */}
          <div className="lg:col-span-2">
            <BrandLogo iconSize={46} />

            <p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground">
              A thoughtfully crafted digital home for book lovers. Discover
              meaningful stories, share your favorite reads, and find your next
              literary adventure.
            </p>

            {/* Social Links */}
            <div className="mt-7 flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Icon size={17} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-sans text-sm font-semibold tracking-wide text-foreground">
              Explore
            </h3>

            <ul className="mt-6 space-y-4">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                    <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-sans text-sm font-semibold tracking-wide text-foreground">
              Get in Touch
            </h3>

            <ul className="mt-6 space-y-5">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
                <a
                  href="mailto:hello@booknook.com"
                  className="hover:text-primary"
                >
                  hello@booknook.com
                </a>
              </li>

              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>Dhaka, Bangladesh</span>
              </li>
            </ul>

            <div className="mt-8">
              <p className="font-serif text-2xl italic text-primary">
                Every page holds a possibility.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border py-6 text-center sm:flex-row sm:text-left">
          <Copyright />

          <p className="text-xs text-muted-foreground">
            Made for readers, with care.
          </p>
        </div>
      </Container>
    </footer>
  );
}
