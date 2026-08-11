import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";

const DEGREE_LABELS: Record<string, string> = {
  bsc: "B.Sc.",
  msc: "M.Sc.",
  ma: "M.A.",
  med: "M.Ed.",
  pgd: "PGD",
  mphil: "M.Phil.",
  phd: "Ph.D.",
  other: "Other",
};

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: { q?: string; department?: string; degree?: string };
}) {
  const supabase = await createServerSupabaseClient();
  const { q, department, degree } = searchParams;

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");

  let query = supabase
    .from("theses")
    .select(
      `id, title, year, degree_type,
       author:users!theses_author_id_fkey ( full_name ),
       department:departments ( name )`
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (department) query = query.eq("department_id", department);
  if (degree) query = query.eq("degree_type", degree);
  if (q && q.trim()) {
    query = query.textSearch("search_vector", q.trim(), {
      type: "websearch",
      config: "english",
    });
  }

  const { data: theses, error } = await query;

  return (
    <main className="min-h-screen bg-tsu-bg">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-md text-tsu-text-muted mb-1">Search the archive</p>
        <h1 className="text-2xl md:text-4xl font-semibold text-tsu-text-heading mb-7">Browse research</h1>

        {/* Search + filters */}
        <form method="GET" className="bg-tsu-card border border-tsu-card-border rounded-card p-5 mb-6">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by title, abstract, or keyword"
            className="w-full bg-tsu-input-bg border border-tsu-input-border rounded-lg px-3.5 py-2.5 text-md md:text-lg text-tsu-text-primary mb-3 focus:outline-none focus:ring-1 focus:ring-tsu-accent"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              name="department"
              defaultValue={department ?? ""}
              className="bg-tsu-input-bg border border-tsu-input-border rounded-lg px-3.5 py-2.5 text-md md:text-lg text-tsu-text-primary focus:outline-none focus:ring-1 focus:ring-tsu-accent"
            >
              <option value="">All departments</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              name="degree"
              defaultValue={degree ?? ""}
              className="bg-tsu-input-bg border border-tsu-input-border rounded-lg px-3.5 py-2.5 text-md md:text-lg text-tsu-text-primary focus:outline-none focus:ring-1 focus:ring-tsu-accent"
            >
              <option value="">All degree types</option>
              {Object.entries(DEGREE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="mt-3 bg-tsu-accent text-white text-md md:text-lg font-medium px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            Search
          </button>
        </form>

        {error && (
          <div className="bg-red-950 text-red-400 rounded-lg p-4 text-md md:text-lg">
            Could not load results: {error.message}
          </div>
        )}

        {!error && (!theses || theses.length === 0) && (
          <div className="bg-tsu-card border border-tsu-card-border rounded-card p-10 text-center">
            <p className="text-tsu-text-secondary text-md md:text-lg">
              {q || department || degree
                ? "No results match your search."
                : "No published research yet."}
            </p>
          </div>
        )}

        {theses && theses.length > 0 && (
          <div className="flex flex-col gap-3">
            {theses.map((t: any) => (
              <Link
                key={t.id}
                href={`/theses/${t.id}`}
                className="bg-tsu-card border border-tsu-card-border rounded-card p-5 hover:border-tsu-accent transition-colors"
              >
                <p className="text-md md:text-lg font-medium text-tsu-text-heading mb-1.5">{t.title}</p>
                <p className="text-md text-tsu-text-muted">
                  {t.author?.full_name} &middot; {t.department?.name} &middot;{" "}
                  {DEGREE_LABELS[t.degree_type]} &middot; {t.year}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}