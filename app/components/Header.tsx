"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import logo from "../assets/tsu_logo1.png";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-tsu-card-border relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 min-w-0" onClick={() => setMenuOpen(false)}>
          <Image
            src={logo}
            width={36}
            height={36}
            alt="Taraba State University"
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-md sm:text-sm md:text-lg font-medium text-tsu-text-heading leading-tight truncate">
              TSU Digital Research Repository
            </p>
            <p className="hidden sm:block text-[11px] text-tsu-text-muted leading-tight">
              College of Postgraduate Studies
            </p>
          </div>
        </Link>

        {/* Desktop nav — hidden below md */}
        <nav className="hidden md:flex items-center gap-5 flex-shrink-0">
          <Link
            href="/browse"
            className="text-md md:text-lg text-tsu-text-secondary hover:text-tsu-text-primary transition-colors"
          >
            Browse research
          </Link>

          <SignedIn>
            <Link
              href="/dashboard"
              className="text-md md:text-lg text-tsu-text-secondary hover:text-tsu-text-primary transition-colors"
            >
              My submissions
            </Link>
            <Link
              href="/submit"
              className="text-md md:text-lg text-tsu-text-secondary hover:text-tsu-text-primary transition-colors"
            >
              Submit research
            </Link>
            <UserButton />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-tsu-accent-tag-bg text-tsu-accent-tag-text text-md md:text-lg font-medium px-4 py-2 rounded-pill hover:bg-tsu-accent hover:text-white transition-colors">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
        </nav>

        {/* Mobile controls — visible below md */}
        <div className="flex md:hidden items-center gap-3 flex-shrink-0">
          <SignedIn>
            <UserButton />
          </SignedIn>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-tsu-card border border-tsu-card-border text-tsu-text-secondary"
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {menuOpen && (
        <nav className="md:hidden border-t border-tsu-card-border bg-tsu-card px-4 sm:px-6 py-4 flex flex-col gap-1">
          <Link
            href="/browse"
            onClick={() => setMenuOpen(false)}
            className="text-md md:text-lg text-tsu-text-secondary hover:text-tsu-text-primary transition-colors py-2.5"
          >
            Browse research
          </Link>

          <SignedIn>
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="text-md md:text-lg text-tsu-text-secondary hover:text-tsu-text-primary transition-colors py-2.5"
            >
              My submissions
            </Link>
            <Link
              href="/submit"
              onClick={() => setMenuOpen(false)}
              className="text-md md:text-lg text-tsu-text-secondary hover:text-tsu-text-primary transition-colors py-2.5"
            >
              Submit research
            </Link>
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button
                onClick={() => setMenuOpen(false)}
                className="mt-2 bg-tsu-accent-tag-bg text-tsu-accent-tag-text text-md md:text-lg font-medium px-4 py-2.5 rounded-lg hover:bg-tsu-accent hover:text-white transition-colors text-left"
              >
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
        </nav>
      )}
    </header>
  );
}