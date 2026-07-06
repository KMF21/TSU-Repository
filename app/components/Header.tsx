import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export function Header() {
  return (
    <header className="border-b border-tsu-card-border">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          {/* Sourced from the live Screening Portal (tsucpgs.com.ng) so the
              repository visually belongs to the same TSU digital ecosystem. */}
          <img
            src="https://www.tsucpgs.com.ng/assets/tsu_logo1.png"
            alt="Taraba State University"
            className="h-9 w-9 rounded-full object-cover flex-shrink-0"
          />
          <div>
            <p className="text-sm font-medium text-tsu-text-heading leading-tight">
              TSU Digital Research Repository
            </p>
            <p className="text-[11px] text-tsu-text-muted leading-tight">
              College of Postgraduate Studies
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-5">
          <Link
            href="/browse"
            className="text-sm text-tsu-text-secondary hover:text-tsu-text-primary transition-colors"
          >
            Browse research
          </Link>

          <SignedIn>
            <Link
              href="/submit"
              className="text-sm text-tsu-text-secondary hover:text-tsu-text-primary transition-colors"
            >
              Submit research
            </Link>
            <UserButton />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-tsu-accent-tag-bg text-tsu-accent-tag-text text-sm font-medium px-4 py-2 rounded-pill hover:bg-tsu-accent hover:text-white transition-colors">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
}