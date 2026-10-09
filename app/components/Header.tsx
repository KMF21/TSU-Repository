"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import logo from "../assets/tsu_logo1.png";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();
  const role = (user?.publicMetadata as { role?: string } | undefined)?.role;
  const isAdmin = role === "admin";
  const canUploadForOthers = role === "admin" || role === "depositor";

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const links = [
    { href: "/browse", label: "Browse research", show: "always" as const },
    { href: "/dashboard", label: "My submissions", show: "in" as const },
    { href: "/submit", label: "Submit research", show: "in" as const },
    ...(canUploadForOthers
      ? [{ href: "/submit/on-behalf", label: "Upload for others", show: "in" as const }]
      : []),
    ...(isAdmin ? [{ href: "/admin", label: "Admin", show: "in" as const }] : []),
  ];

  const linkClass = (href: string) =>
    `text-base font-medium transition-colors ${
      pathname === href || (href !== "/submit" && pathname.startsWith(href + "/"))
        ? "text-white"
        : "text-tsu-text-secondary hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-tsu-card-border bg-tsu-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8 sm:py-4">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="TSU Digital Research Repository home">
          <Image
            src={logo}
            width={48}
            height={48}
            alt="Taraba State University"
            className="h-10 w-10 flex-shrink-0 rounded-full object-cover ring-2 ring-white/10 sm:h-12 sm:w-12"
          />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold leading-tight text-white sm:text-lg">
              TSU Digital Research Repository
            </p>
            <p className="truncate text-xs leading-tight text-tsu-text-muted sm:text-[13px]">
              College of Postgraduate Studies
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-shrink-0 items-center gap-7 lg:flex" aria-label="Main">
          {links.map((l) => (
            <SignedOutAware key={l.href} show={l.show}>
              <Link href={l.href} className={linkClass(l.href)}>
                {l.label}
              </Link>
            </SignedOutAware>
          ))}

          <SignedIn>
            <UserButton />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-pill bg-tsu-accent px-5 py-2.5 text-[15px] font-semibold text-white shadow-glow transition-colors hover:bg-blue-500">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
        </nav>

        {/* Mobile / tablet controls */}
        <div className="flex flex-shrink-0 items-center gap-3 lg:hidden">
          <SignedIn>
            <UserButton />
          </SignedIn>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-tsu-card-border bg-tsu-card text-tsu-text-secondary transition-colors hover:text-white"
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {menuOpen && (
        <nav
          className="border-t border-tsu-card-border bg-tsu-card px-5 py-4 sm:px-8 lg:hidden"
          aria-label="Mobile"
        >
          <div className="mx-auto flex max-w-6xl flex-col">
            {links.map((l) => (
              <SignedOutAware key={l.href} show={l.show}>
                <Link
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block border-b border-tsu-card-border/60 py-3.5 text-lg ${linkClass(l.href)}`}
                >
                  {l.label}
                </Link>
              </SignedOutAware>
            ))}

            <SignedOut>
              <SignInButton mode="modal">
                <button
                  onClick={() => setMenuOpen(false)}
                  className="mt-4 rounded-xl bg-tsu-accent px-5 py-3.5 text-lg font-semibold text-white"
                >
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </nav>
      )}
    </header>
  );
}

/** Renders children for everyone ("always") or only for signed-in users ("in"). */
function SignedOutAware({
  show,
  children,
}: {
  show: "always" | "in";
  children: React.ReactNode;
}) {
  if (show === "always") return <>{children}</>;
  return <SignedIn>{children}</SignedIn>;
}
