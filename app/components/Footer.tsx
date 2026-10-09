import Link from "next/link";
import { ADMIN_EMAIL } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-tsu-card-border bg-gradient-to-b from-tsu-bg to-[#080e1a]">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-14">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-display text-xl font-semibold text-white sm:text-2xl">
              TSU Digital Research Repository
            </p>
            <p className="mt-3 max-w-sm text-base leading-relaxed text-tsu-text-secondary">
              The permanent, citable scholarly record of Taraba State University postgraduate research.
            </p>
          </div>

          <div>
            <p className="section-label mb-4">Explore</p>
            <ul className="space-y-3 text-base">
              <li>
                <Link href="/browse" className="text-tsu-text-secondary transition-colors hover:text-white">
                  Browse research
                </Link>
              </li>
              <li>
                <Link href="/submit" className="text-tsu-text-secondary transition-colors hover:text-white">
                  Submit research
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-tsu-text-secondary transition-colors hover:text-white">
                  My submissions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="section-label mb-4">Contact</p>
            <ul className="space-y-3 text-base text-tsu-text-secondary">
              <li>Office of Postgraduate Studies</li>
              <li>Jalingo, Taraba State</li>
              <li>
                <a
                  href={`mailto:${ADMIN_EMAIL}`}
                  className="text-tsu-accent-tag-text transition-colors hover:text-white"
                >
                  {ADMIN_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-tsu-card-border pt-6 text-sm text-tsu-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} Taraba State University &middot; Office of Postgraduate Studies. All rights reserved.
          </p>
          <a
            href="https://www.kmfenterprise.ng"
            target="_blank"
            rel="noopener noreferrer"
            className="text-tsu-success-text transition-colors hover:text-white"
          >
            Built and Maintained by KMFenterprise
          </a>
        </div>
      </div>
    </footer>
  );
}
