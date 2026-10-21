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
    <main className="bg-tsu-bg">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-tsu-navy-deep pb-32 pt-16 sm:pb-40 sm:pt-24">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[30%_center] opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-tsu-navy-deep via-tsu-navy-deep/85 to-tsu-navy-deep/30" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-tsu-navy-deep/70 to-transparent" />

        <div className="relative z-10 mx-auto max-w-6xl animate-fade-up px-5 sm:px-8">
          <p className="mb-6 inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-slate-100 backdrop-blur sm:text-[13px]">
            <span className="h-1.5 w-1.5 rounded-full bg-tsu-gold" />
            College of Postgraduate Studies
          </p>

          <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl">
            The permanent <span className="text-tsu-gold">scholarly record</span> of Taraba State
            University
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-200 sm:text-xl">
            Postgraduate theses, dissertations, and research from every faculty, archived,
            searchable, and citable in one place.
          </p>

          {/* Search-first: the one thing most visitors came to do */}
          <form
            action="/browse"
            method="GET"
            className="mt-9 flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-lift sm:flex-row sm:items-center sm:rounded-pill sm:pl-3"
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
                className="w-full rounded-pill bg-transparent py-3.5 pl-12 pr-4 text-base text-tsu-navy placeholder:text-tsu-text-muted focus:outline-none sm:text-lg"
              />
            </div>
            <button type="submit" className="btn-gold px-8 py-3.5 text-base sm:text-lg">
              Search
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-base">
            <Link
              href="/browse"
              className="font-medium text-slate-200 underline-offset-4 transition-colors hover:text-tsu-gold hover:underline"
            >
              Browse all research
            </Link>
            <SignedIn>
              <Link
                href="/submit"
                className="font-medium text-slate-200 underline-offset-4 transition-colors hover:text-tsu-gold hover:underline"
              >
                Submit your research
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="font-medium text-slate-200 underline-offset-4 transition-colors hover:text-tsu-gold hover:underline">
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
          <div className="grid grid-cols-2 divide-x divide-y divide-tsu-card-border overflow-hidden rounded-card border border-tsu-card-border bg-white shadow-lift lg:grid-cols-4 lg:divide-y-0">
            {stats.map((s) => (
              <div key={s.label} className="p-6 sm:p-8">
                <p className="text-sm font-medium text-tsu-text-muted">{s.label}</p>
                <p className="mt-1 font-display text-3xl font-bold text-tsu-navy sm:text-4xl">
                  {s.value.toLocaleString()}
                </p>
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
                <h2 className="font-display text-3xl font-bold text-tsu-navy sm:text-4xl">
                  Latest research
                </h2>
              </div>
              <Link
                href="/browse"
                className="text-base font-semibold text-tsu-navy transition-colors hover:text-tsu-gold-text"
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
                  className="card group flex h-full flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:border-tsu-accent/50 hover:shadow-lift sm:p-7"
                >
                  <p className="eyebrow mb-4">
                    {DEGREE_LABELS[t.degree_type] ?? t.degree_type} &middot; {t.year}
                  </p>
                  <h3 className="font-display text-lg font-bold leading-snug text-tsu-navy sm:text-xl">
                    {t.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 flex-1 text-base leading-relaxed text-tsu-text-secondary">
                    {t.abstract}
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-tsu-card-border pt-4">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-tsu-navy">{t.author_name}</p>
                      <p className="truncate text-sm text-tsu-text-muted">{t.department?.name}</p>
                    </div>
                    <span className="ml-3 text-tsu-text-muted transition-all group-hover:translate-x-1 group-hover:text-tsu-navy">
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
              <h2 className="font-display text-3xl font-bold text-tsu-navy sm:text-4xl">
                One archive for every discipline
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.faculties.map((f, i) => (
              <Reveal key={f.name} delay={(i % 3) * 70} className="h-full">
                <Link
                  href={`/browse?faculty=${encodeURIComponent(f.name)}`}
                  className="card group flex h-full items-center gap-4 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-tsu-accent/50 hover:shadow-lift sm:p-6"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-tsu-navy text-tsu-gold">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold leading-snug text-tsu-navy sm:text-lg">{f.name}</p>
                    <p className="mt-0.5 text-sm text-tsu-text-muted">
                      {f.departments} {f.departments === 1 ? "department" : "departments"}
                    </p>
                  </div>
                  <span className="text-tsu-text-muted transition-all group-hover:translate-x-1 group-hover:text-tsu-navy">
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
          <div className="mb-10 max-w-2xl">
            <p className="eyebrow mb-3">How it works</p>
            <h2 className="font-display text-3xl font-bold text-tsu-navy sm:text-4xl">
              From defense copy to public record
            </h2>
            <p className="mt-4 text-lg text-tsu-text-secondary">
              Three steps, and you can see where your submission stands at every stage.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["01", "Submit", "Sign in, complete the thesis details, and upload your final defense copy as a PDF.", "M12 16V4m0 0l-4 4m4-4l4 4M4 20h16"],
            ["02", "Reviewed", "An administrator checks your submission against the record before anything goes public.", "M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"],
            ["03", "Published", "Your work gets a permanent page, a ready-made citation, and becomes discoverable worldwide.", "M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.5-2.5 4-5.5 4-9s-1.5-6.5-4-9m0 18c-2.5-2.5-4-5.5-4-9s1.5-6.5 4-9M3 12h18"],
          ].map(([n, title, body, icon], i) => (
            <Reveal key={n} delay={i * 100} className="h-full">
              <div className="card relative h-full p-7 sm:p-8">
                <span className="absolute right-6 top-5 font-display text-5xl font-bold text-tsu-navy/[0.06]">
                  {n}
                </span>
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-tsu-navy text-tsu-gold">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={icon} />
                  </svg>
                </div>
                <p className="font-display text-lg font-bold text-tsu-navy">{title}</p>
                <p className="mt-2 text-base leading-relaxed text-tsu-text-secondary">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= GUIDELINES ================= */}
      <section className="mt-20 bg-white py-16 sm:mt-28 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:gap-14">
          <Reveal>
            <p className="eyebrow mb-3">Before you submit</p>
            <h2 className="font-display text-3xl font-bold text-tsu-navy sm:text-4xl">
              Submission guidelines
            </h2>
            <p className="mt-4 text-lg text-tsu-text-secondary">
              Read these points first. They keep every record clean and quick to review.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Guideline title="PDF only" body="Submissions must be your final defense copy, saved as a PDF." />
              <Guideline
                title="Compress large files"
                body={
                  <>
                    Scanned pages or many images? Compress first, try{" "}
                    <a
                      href="https://smallpdf.com/compress-pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-tsu-navy underline underline-offset-4"
                    >
                      smallpdf.com
                    </a>{" "}
                    or{" "}
                    <a
                      href="https://www.ilovepdf.com/compress_pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-tsu-navy underline underline-offset-4"
                    >
                      ilovepdf.com
                    </a>
                    .
                  </>
                }
              />
              <Guideline title="50MB limit" body="This is a hard limit. Files above this size are rejected at upload." />
              <Guideline
                title="Reviewed before publishing"
                body="An admin reviews every submission before it becomes part of the public record."
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= CLOSING CTA ================= */}
      <section className="bg-gradient-to-br from-tsu-navy via-[#13274d] to-tsu-navy-deep">
        <Reveal>
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-16 sm:px-8 sm:py-20 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
                Explore Taraba State University research
              </h2>
              <p className="mt-4 text-lg text-slate-300">
                Search by title, abstract or keyword, and filter by department or degree.
              </p>
            </div>
            <Link href="/browse" className="btn-gold self-start px-8 py-4 text-lg md:self-auto">
              Start browsing &rarr;
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}

function Guideline({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div className="rounded-card border border-tsu-card-border bg-tsu-bg/60 p-6">
      <p className="font-display text-base font-bold text-tsu-navy">{title}</p>
      <p className="mt-2 text-base leading-relaxed text-tsu-text-secondary">{body}</p>
    </div>
  );
}
