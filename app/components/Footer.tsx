import Link from "next/link";
import { ADMIN_EMAIL } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-0 bg-tsu-navy-deep text-white">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-14">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-display text-xl font-bold text-white">
              TSU Digital Research Repository
            </p>
            <p className="mt-3 max-w-sm text-base leading-relaxed text-slate-300">
              The permanent, citable scholarly record of Taraba State University postgraduate research.
            </p>
          </div>

          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-tsu-gold">Explore</p>
            <ul className="space-y-3 text-base">
              <li>
                <Link href="/browse" className="text-slate-300 transition-colors hover:text-tsu-gold">
                  Browse research
                </Link>
              </li>
              <li>
                <Link href="/submit" className="text-slate-300 transition-colors hover:text-tsu-gold">
                  Submit research
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-slate-300 transition-colors hover:text-tsu-gold">
                  My submissions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-tsu-gold">Contact</p>
            <ul className="space-y-3 text-base text-slate-300">
              <li>Office of Postgraduate Studies</li>
              <li>Jalingo, Taraba State</li>
              <li>
                <a
                  href={`mailto:${ADMIN_EMAIL}`}
                  className="text-white transition-colors hover:text-tsu-gold"
                >
                  {ADMIN_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} Taraba State University &middot; Office of Postgraduate Studies. All rights reserved.
          </p>
          <a
            href="https://www.kmfenterprise.ng"
            target="_blank"
            rel="noopener noreferrer"
            className="text-tsu-gold transition-colors hover:text-white"
          >
            Built and Maintained by KMFenterprise
          </a>
        </div>
      </div>
    </footer>
  );
}
