import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import heroImage from "./assets/PG.png";
import { Reveal } from "@/app/components/Reveal";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";
import { DEGREE_LABELS, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};

/** Live numbers and content for the home page. Never throws: a database hiccup
 *  must not take the front door down, so every query degrades to empty. */
async function getHomeData() {
  try {
    const supabase = await createServerSupabaseClient();
    const service = createServiceRoleSupabaseClient();

    const [thesesCount, programmesCount, departments, latest] = await Promise.all([
      service.from("theses").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("programmes").select("id", { count: "exact", head: true }),
      supabase.from("departments").select("faculty"),
      supabase
        .from("theses")
        .select(
          "id, title, abstract, author_name, year, degree_type, department:departments ( name )"
        )
        .eq("status", "published")
        .eq("access_level", "open")
        .order("published_at", { ascending: false })
        .limit(3),
    ]);

    const faculties = new Map<string, number>();
    for (const d of departments.data ?? []) {
      faculties.set(d.faculty, (faculties.get(d.faculty) ?? 0) + 1);
    }

    return {
      theses: thesesCount.count ?? 0,
      programmes: programmesCount.count ?? 0,
      departments: departments.data?.length ?? 0,
      faculties: Array.from(faculties.entries())
        .map(([name, departments]) => ({ name, departments }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      latest: (latest.data ?? []) as any[],
    };
  } catch {
    return { theses: 0, programmes: 0, departments: 0, faculties: [], latest: [] as any[] };
  }
}

export default async function HomePage() {
  const data = await getHomeData();

  const stats = [
    ...(data.theses > 0 ? [{ label: "Theses archived", value: data.theses }] : []),
    { label: "Faculties", value: data.faculties.length || 10 },
    { label: "Departments", value: data.departments || 37 },
    { label: "Programmes covered", value: data.programmes || 254 },
  ];

  return (
    <main className="min-h-screen bg-tsu-bg">
      {/* ================= HERO ================= */}
      <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden pb-24 sm:min-h-[calc(100vh-4.5rem)] sm:pb-28">
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
          <div className="absolute inset-0 bg-gradient-to-b from-tsu-bg/30 via-transparent to-tsu-bg" />
          {/* faint dotted grid for texture */}
          <div
            className="absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            }}
          />
        </div>

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-tsu-accent/25 blur-[150px]" />
          <div className="absolute -bottom-40 right-0 h-[420px] w-[420px] rounded-full bg-tsu-gold-text/10 blur-[140px]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-4xl animate-fade-up px-5 py-20 text-center sm:px-8">
          <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-tsu-accent-tag-text backdrop-blur sm:text-[13px]">
            <span className="h-1.5 w-1.5 rounded-full bg-tsu-success-text" />
            College of Postgraduate Studies
          </p>

          <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
            The permanent{" "}
            <span className="bg-gradient-to-r from-sky-300 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
              scholarly record
            </span>{" "}
            of Taraba State University
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-tsu-text-secondary sm:mt-8 sm:text-xl lg:text-2xl">
            Postgraduate theses, dissertations, and research from every faculty — archived,
            searchable, and citable in one place.
          </p>

          {/* Search-first: the one thing most visitors came to do */}
          <form
            action="/browse"
            method="GET"
            className="mx-auto mt-9 flex max-w-2xl flex-col gap-3 rounded-2xl border border-white/15 bg-tsu-bg/70 p-2.5 shadow-[0_20px_60px_-20px_rgba(37,99,235,0.45)] backdrop-blur-md sm:mt-11 sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-tsu-text-muted"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                type="text"
                name="q"
                aria-label="Search research"
                placeholder="Search by title, topic or keyword"
                className="w-full rounded-xl bg-transparent py-4 pl-12 pr-4 text-base text-white placeholder:text-tsu-text-muted focus:outline-none sm:text-lg"
              />
            </div>
            <button type="submit" className="btn-primary px-8 py-4 text-lg">
              Search
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-base">
            <Link
              href="/browse"
              className="font-medium text-tsu-text-secondary underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              Browse all research
            </Link>
            <SignedIn>
              <Link
                href="/submit"
                className="font-medium text-tsu-text-secondary underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                Submit your research
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="font-medium text-tsu-text-secondary underline-offset-4 transition-colors hover:text-white hover:underline">
                  Sign in to submit
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </section>

      {/* ================= STATS (overlaps the hero edge) ================= */}
      <section className="relative z-20 mx-auto -mt-16 max-w-6xl px-5 sm:-mt-20 sm:px-8">
        <Reveal>
          <div className="card grid grid-cols-2 divide-x divide-y divide-tsu-card-border overflow-hidden lg:grid-cols-4 lg:divide-y-0">
            {stats.map((s) => (
              <div key={s.label} className="p-6 text-center sm:p-9">
                <p className="font-display text-4xl font-semibold text-white sm:text-5xl lg:text-6xl">
                  {s.value.toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-tsu-text-secondary sm:text-base">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ================= LATEST RESEARCH ================= */}
      {data.latest.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pt-20 sm:px-8 sm:pt-28">
          <Reveal>
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow mb-3">Recently published</p>
                <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
                  Latest research
                </h2>
              </div>
              <Link
                href="/browse"
                className="text-base font-semibold text-tsu-accent-tag-text transition-colors hover:text-white"
              >
                View all research &rarr;
              </Link>
            </div>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-3">
            {data.latest.map((t, i) => (
              <Reveal key={t.id} delay={i * 90} className="h-full">
                <Link
                  href={`/theses/${t.id}`}
                  className="card group relative flex h-full flex-col overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:border-tsu-accent hover:bg-tsu-card-hover sm:p-7"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-tsu-accent via-sky-400 to-transparent opacity-70" />
                  <p className="eyebrow mb-4">
                    {DEGREE_LABELS[t.degree_type] ?? t.degree_type} &middot; {t.year}
                  </p>
                  <h3 className="font-display text-xl font-semibold leading-snug text-white sm:text-2xl">
                    {t.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 flex-1 text-base leading-relaxed text-tsu-text-secondary">
                    {t.abstract}
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-tsu-card-border pt-4">
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium text-white">{t.author_name}</p>
                      <p className="truncate text-sm text-tsu-text-muted">{t.department?.name}</p>
                    </div>
                    <span className="ml-3 text-tsu-text-muted transition-all group-hover:translate-x-1 group-hover:text-tsu-accent-tag-text">
                      &rarr;
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ================= FACULTIES ================= */}
      {data.faculties.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pt-20 sm:px-8 sm:pt-28">
          <Reveal>
            <div className="mb-10 max-w-2xl">
              <p className="eyebrow mb-3">Explore by faculty</p>
              <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
                One archive for every discipline
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.faculties.map((f, i) => (
              <Reveal key={f.name} delay={(i % 3) * 70} className="h-full">
                <Link
                  href={`/browse?faculty=${encodeURIComponent(f.name)}`}
                  className="card group flex h-full items-center gap-4 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-tsu-accent hover:bg-tsu-card-hover sm:p-6"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-tsu-accent-tag-bg text-tsu-accent-tag-text transition-colors group-hover:bg-tsu-accent group-hover:text-white">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold leading-snug text-white">{f.name}</p>
                    <p className="mt-0.5 text-sm text-tsu-text-muted">
                      {f.departments} {f.departments === 1 ? "department" : "departments"}
                    </p>
                  </div>
                  <span className="text-tsu-text-muted transition-all group-hover:translate-x-1 group-hover:text-tsu-accent-tag-text">
                    &rarr;
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ================= HOW IT WORKS ================= */}
      <section className="mx-auto max-w-6xl px-5 pt-20 sm:px-8 sm:pt-28">
        <Reveal>
          <div className="mb-12 text-center">
            <p className="eyebrow mb-3">How it works</p>
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              From defense copy to public record
            </h2>
          </div>
        </Reveal>

        <div className="relative grid gap-5 md:grid-cols-3 md:gap-6">
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-[54px] hidden h-px bg-gradient-to-r from-transparent via-tsu-input-border to-transparent md:block" />
          {[
            ["1", "Submit", "Sign in, complete the thesis details, and upload your final defense copy as a PDF."],
            ["2", "Reviewed", "An administrator checks your submission against the record before anything goes public."],
            ["3", "Published", "Your work gets a permanent page, a ready-made citation, and becomes discoverable worldwide."],
          ].map(([n, title, body], i) => (
            <Reveal key={n} delay={i * 100} className="h-full">
              <div className="card relative h-full p-7 text-center sm:p-9">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-tsu-input-border bg-tsu-bg font-display text-2xl font-semibold text-tsu-accent-tag-text shadow-glow">
                  {n}
                </div>
                <p className="text-xl font-semibold text-white">{title}</p>
                <p className="mt-2 text-base leading-relaxed text-tsu-text-secondary sm:text-[17px]">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= GUIDELINES ================= */}
      <section className="mx-auto max-w-6xl px-5 pt-20 sm:px-8 sm:pt-28">
        <Reveal>
          <div className="card p-6 sm:p-10">
            <p className="eyebrow mb-6">Before you submit</p>
            <div className="grid gap-8 sm:grid-cols-2">
              <Guideline title="PDF only" body="Submissions must be your final defense copy, saved as a PDF." />
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
              <Guideline title="50MB limit" body="This is a hard limit — files above this size will be rejected at upload." />
              <Guideline
                title="Reviewed before publishing"
                body="An admin reviews every submission before it becomes part of the public record."
              />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ================= CLOSING CTA ================= */}
      <section className="mx-auto max-w-6xl px-5 pb-8 pt-12 sm:px-8 sm:pt-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-card border border-tsu-card-border bg-gradient-to-br from-tsu-blue/30 via-tsu-card to-tsu-card p-8 text-center sm:p-16">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-tsu-accent/25 blur-[100px]" />
            <h2 className="relative font-display text-3xl font-semibold text-white sm:text-5xl">
              Explore Taraba State University research
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-lg text-tsu-text-secondary">
              Search by title, abstract or keyword, and filter by department or degree.
            </p>
            <Link href="/browse" className="btn-primary relative mt-8 px-8 py-4 text-lg">
              Start browsing
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
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
