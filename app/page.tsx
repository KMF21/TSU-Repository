import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import heroImage from "./assets/PG.png";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-tsu-bg">
      {/* ================= HERO ================= */}
      <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden sm:min-h-[calc(100vh-4.5rem)]">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt="Taraba State University"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[25%_center]"
          />
          <div className="absolute inset-0 bg-tsu-bg/80" />
          <div className="absolute inset-0 bg-gradient-to-b from-tsu-bg/40 via-transparent to-tsu-bg" />
        </div>

        {/* Glow effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-tsu-accent/25 blur-[140px]" />
          <div className="absolute -bottom-40 right-0 h-[420px] w-[420px] rounded-full bg-tsu-gold-text/10 blur-[140px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 animate-fade-up">
          <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-tsu-accent-tag-text backdrop-blur sm:text-[13px]">
            <span className="h-1.5 w-1.5 rounded-full bg-tsu-success-text" />
            College of Postgraduate Studies
          </p>
          <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
            The permanent scholarly record of Taraba State University
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-tsu-text-secondary sm:mt-8 sm:text-xl lg:text-2xl">
            Postgraduate theses, dissertations, and research from every faculty — archived,
            searchable, and citable in one place.
          </p>

          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:mt-11 sm:flex-row sm:items-center sm:gap-4">
            <Link href="/browse" className="btn-primary px-8 py-4 text-lg">
              Browse research
            </Link>
            <SignedIn>
              <Link href="/submit" className="btn-secondary px-8 py-4 text-lg backdrop-blur">
                Submit your research
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="btn-secondary px-8 py-4 text-lg backdrop-blur">
                  Sign in to submit
                </button>
              </SignInButton>
            </SignedOut>
          </div>

          <p className="mt-8 text-sm text-tsu-text-muted sm:text-base">
            Open access &middot; Discoverable on Google Scholar &middot; Permanently citable
          </p>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="mb-10 text-center">
          <p className="eyebrow mb-3">Across the university</p>
          <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            One archive for every discipline
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
          <StatCard label="Faculties represented" value="10" />
          <StatCard label="Departments" value="37" />
          <StatCard label="Programmes covered" value="254" />
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8 sm:pb-20">
        <div className="mb-10 text-center">
          <p className="eyebrow mb-3">How it works</p>
          <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            From defense copy to public record
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3 md:gap-6">
          <StepCard
            n="1"
            title="Submit"
            body="Sign in, complete the thesis details, and upload your final defense copy as a PDF."
          />
          <StepCard
            n="2"
            title="Reviewed"
            body="An administrator checks your submission against the record before anything goes public."
          />
          <StepCard
            n="3"
            title="Published"
            body="Your work gets a permanent page, a ready-made citation, and becomes discoverable worldwide."
          />
        </div>
      </section>

      {/* ================= GUIDELINES ================= */}
      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="card p-6 sm:p-10">
          <p className="eyebrow mb-6">Before you submit</p>
          <div className="grid gap-8 sm:grid-cols-2">
            <Guideline
              title="PDF only"
              body="Submissions must be your final defense copy, saved as a PDF."
            />
            <Guideline
              title="Compress large files"
              body={
                <>
                  Files with scanned pages or many images should be compressed before uploading —
                  try{" "}
                  <a
                    href="https://smallpdf.com/compress-pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-tsu-accent-tag-text underline-offset-4 hover:underline"
                  >
                    smallpdf.com
                  </a>{" "}
                  or{" "}
                  <a
                    href="https://www.ilovepdf.com/compress_pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-tsu-accent-tag-text underline-offset-4 hover:underline"
                  >
                    ilovepdf.com
                  </a>
                  . Smaller files are faster for everyone to access.
                </>
              }
            />
            <Guideline
              title="50MB limit"
              body="This is a hard limit — files above this size will be rejected at upload."
            />
            <Guideline
              title="Reviewed before publishing"
              body="An admin reviews every submission before it becomes part of the public record."
            />
          </div>
        </div>
      </section>

      {/* ================= CLOSING CTA ================= */}
      <section className="mx-auto max-w-6xl px-5 pb-8 sm:px-8">
        <div className="relative overflow-hidden rounded-card border border-tsu-card-border bg-gradient-to-br from-tsu-blue/30 via-tsu-card to-tsu-card p-8 text-center sm:p-14">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-tsu-accent/25 blur-[100px]" />
          <h2 className="relative font-display text-3xl font-semibold text-white sm:text-4xl">
            Explore Taraba State University research
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-tsu-text-secondary">
            Search by title, abstract or keyword, and filter by department or degree.
          </p>
          <Link href="/browse" className="btn-primary relative mt-8 px-8 py-4 text-lg">
            Start browsing
          </Link>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card relative overflow-hidden p-7 text-center sm:p-9">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-tsu-accent to-transparent" />
      <p className="font-display text-6xl font-semibold text-white sm:text-7xl">{value}</p>
      <p className="mt-3 text-base text-tsu-text-secondary sm:text-lg">{label}</p>
    </div>
  );
}

function StepCard({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="card p-7 sm:p-8">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-tsu-accent-tag-bg font-display text-xl font-semibold text-tsu-accent-tag-text">
        {n}
      </div>
      <p className="text-xl font-semibold text-white">{title}</p>
      <p className="mt-2 text-base leading-relaxed text-tsu-text-secondary sm:text-[17px]">{body}</p>
    </div>
  );
}

function Guideline({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div>
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="mt-2 text-base leading-relaxed text-tsu-text-secondary sm:text-[17px]">{body}</p>
    </div>
  );
}
