import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin — Submissions",
  robots: { index: false, follow: false },
};

const STATUS_TABS = [
  { value: "pending", label: "Pending" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
] as const;

export default async function AdminQueuePage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const activeStatus = searchParams.status ?? "pending";
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("theses")
    .select(
      `id, title, abstract, year, submitted_at, reviewed_at, degree_type, status, access_level, rejection_reason,
       author:users!theses_author_id_fkey ( full_name ),
       department:departments ( name ),
       programme:programmes ( name )`
    )
    .order("submitted_at", { ascending: false });

  if (activeStatus !== "all") {
    query = query.eq("status", activeStatus);
  }

  const { data: theses, error } = await query;

  return (
    <main className="min-h-screen bg-tsu-bg">
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-3">Admin</p>
            <h1 className="page-title">Submissions</h1>
          </div>
          {theses && (
            <span className="pill-blue self-start text-base sm:self-auto">
              {theses.length} {activeStatus === "all" ? "total" : activeStatus}
            </span>
          )}
        </div>

        {/* Status tabs — scroll sideways on very narrow screens instead of wrapping awkwardly */}
        <div className="-mx-5 mb-8 flex gap-2.5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={`/admin?status=${tab.value}`}
              className={`flex-shrink-0 rounded-pill px-5 py-2.5 text-base font-semibold transition-colors ${
                activeStatus === tab.value
                  ? "bg-tsu-accent text-white shadow-glow"
                  : "border border-tsu-card-border bg-tsu-card text-tsu-text-secondary hover:text-white"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {error && <div className="alert-error">Could not load submissions: {error.message}</div>}

        {!error && (!theses || theses.length === 0) && (
          <div className="card p-10 text-center sm:p-14">
            <p className="text-lg text-tsu-text-secondary">
              Nothing {activeStatus === "all" ? "" : activeStatus} right now.
            </p>
          </div>
        )}

        {theses && theses.length > 0 && (
          <div className="flex flex-col gap-4">
            {theses.map((t: any) => (
              <Link
                key={t.id}
                href={`/admin/theses/${t.id}`}
                className="card group flex flex-col gap-4 p-5 transition-colors hover:border-tsu-accent hover:bg-tsu-card-hover sm:flex-row sm:items-center sm:justify-between sm:p-7"
              >
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold leading-snug text-white sm:text-xl">
                    {t.title}
                  </p>
                  <p className="mt-2 text-base text-tsu-text-secondary">
                    {t.author?.full_name} &middot; {t.department?.name} &middot; {t.programme?.name}{" "}
                    &middot; {t.year}
                  </p>
                  <p className="mt-2.5 line-clamp-2 text-base leading-relaxed text-tsu-text-muted">
                    {t.abstract}
                  </p>
                  {t.status === "rejected" && t.rejection_reason && (
                    <p className="mt-2.5 text-base text-red-400">Reason: {t.rejection_reason}</p>
                  )}
                </div>
                <StatusPill status={t.status} accessLevel={t.access_level} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function StatusPill({ status, accessLevel }: { status: string; accessLevel: string }) {
  if (status === "published") {
    return (
      <span className={`flex-shrink-0 self-start sm:self-auto ${accessLevel === "restricted" ? "pill-gold" : "pill-green"}`}>
        {accessLevel === "restricted" ? "Published (restricted)" : "Published"}
      </span>
    );
  }
  if (status === "rejected") {
    return <span className="pill-red flex-shrink-0 self-start sm:self-auto">Rejected</span>;
  }
  return (
    <span className="pill-blue flex-shrink-0 self-start transition-colors group-hover:bg-tsu-accent group-hover:text-white sm:self-auto">
      Review
    </span>
  );
}
