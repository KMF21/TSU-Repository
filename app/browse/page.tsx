import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEGREE_LABELS, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Browse research",
  description:
    "Search and browse postgraduate theses and dissertations from Taraba State University by title, abstract, keyword, department or degree.",
  alternates: { canonical: `${SITE_URL}/browse` },
};

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: { q?: string; department?: string; degree?: string; faculty?: string };
}) {
  const supabase = await createServerSupabaseClient();
  const { q, department, degree, faculty } = searchParams;

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, faculty")
    .order("name");

  // Faculty filter: resolve to the department ids inside that faculty.
  const facultyDeptIds = faculty
    ? (departments ?? []).filter((d: any) => d.faculty === faculty).map((d: any) => d.id)
    : null;

  let query = supabase
    .from("theses")
    .select(
      `id, title, abstract, keywords, year, degree_type, author_name,
       department:departments ( name )`
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (facultyDeptIds) query = query.in("department_id", facultyDeptIds.length ? facultyDeptIds : ["00000000-0000-0000-0000-000000000000"]);
  if (department) query = query.eq("department_id", department);
  if (degree) query = query.eq("degree_type", degree);
  if (q && q.trim()) {
    query = query.textSearch("search_vector", q.trim(), {
      type: "websearch",
      config: "english",
    });
  }

  const { data: theses, error } = await query;
  const hasFilters = !!(q || department || degree || faculty);

  return (
    <main className="min-h-screen bg-tsu-bg">
      <div className="relative overflow-hidden border-b border-tsu-card-border bg-gradient-to-b from-tsu-card/60 to-tsu-bg">
        <div className="pointer-events-none absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-tsu-accent/15 blur-[120px]" />
        <div className="relative mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="eyebrow mb-3">Search the archive</p>
          <h1 className="page-title">Browse research</h1>
          <p className="mt-4 max-w-2xl text-base text-tsu-text-secondary sm:text-lg">
            Theses and dissertations from every faculty of Taraba State University.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">

        {/* Search + filters */}
        <form method="GET" className="card mb-8 p-5 sm:p-7">
          <div className="relative">
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
              defaultValue={q}
              placeholder="Search by title, abstract, or keyword"
              className="field !pl-12 sm:py-4 sm:text-lg"
            />
          </div>

          {faculty && <input type="hidden" name="faculty" value={faculty} />}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-center">
            <select name="department" defaultValue={department ?? ""} className="field">
              <option value="">All departments</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select name="degree" defaultValue={degree ?? ""} className="field">
              <option value="">All degree types</option>
              {Object.entries(DEGREE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <div className="flex gap-3 sm:col-span-2 lg:col-span-1">
              <button type="submit" className="btn-primary flex-1 lg:flex-none">
                Search
              </button>
              {hasFilters && (
                <Link href="/browse" className="btn-secondary">
                  Reset
                </Link>
              )}
            </div>
          </div>
        </form>

        {error && <div className="alert-error">Could not load results: {error.message}</div>}

        {!error && (!theses || theses.length === 0) && (
          <div className="card p-10 text-center sm:p-14">
            <p className="text-lg text-tsu-text-secondary">
              {hasFilters ? "No results match your search." : "No published research yet."}
            </p>
          </div>
        )}

        {theses && theses.length > 0 && (
          <>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <p className="text-base text-tsu-text-muted">
                {theses.length} {theses.length === 1 ? "result" : "results"}
              </p>
              {faculty && (
                <Link
                  href={`/browse${q ? `?q=${encodeURIComponent(q)}` : ""}`}
                  className="chip gap-2 hover:bg-tsu-accent hover:text-white"
                >
                  {faculty} <span aria-hidden>&times;</span>
                </Link>
              )}
            </div>
            <div className="flex flex-col gap-4">
              {theses.map((t: any) => (
                <Link
                  key={t.id}
                  href={`/theses/${t.id}`}
                  className="card group relative block overflow-hidden p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-tsu-accent hover:bg-tsu-card-hover sm:p-8"
                >
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-tsu-accent to-sky-400 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="font-display text-xl font-semibold leading-snug text-white sm:text-2xl">
                      {t.title}
                    </h2>
                    <span className="flex-shrink-0 pt-1 text-tsu-text-muted transition-all group-hover:translate-x-1 group-hover:text-tsu-accent-tag-text">
                      &rarr;
                    </span>
                  </div>

                  <p className="mt-2 text-base text-tsu-text-secondary sm:text-[17px]">
                    {t.author_name} &middot; {t.department?.name}{" "}
                    &middot; {DEGREE_LABELS[t.degree_type]} &middot; {t.year}
                  </p>

                  <p className="mt-4 line-clamp-2 text-base leading-relaxed text-tsu-text-muted sm:text-[17px]">
                    {t.abstract}
                  </p>

                  {t.keywords?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {t.keywords.slice(0, 4).map((k: string) => (
                        <span key={k} className="chip">
                          {k}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
