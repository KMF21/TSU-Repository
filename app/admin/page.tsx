import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";

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
      `id, title, year, submitted_at, reviewed_at, degree_type, status, access_level, rejection_reason,
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
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-md text-tsu-text-muted mb-1">Admin</p>
            <h1 className="text-2xl md:text-4xl font-semibold text-tsu-text-heading">Submissions</h1>
          </div>
          {theses && (
            <span className="bg-tsu-accent-tag-bg text-tsu-accent-tag-text text-md font-medium px-3.5 py-1.5 rounded-pill">
              {theses.length} {activeStatus === "all" ? "total" : activeStatus}
            </span>
          )}
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 mb-6">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={`/admin?status=${tab.value}`}
              className={`text-sm md:text-md font-medium px-4 py-2 rounded-pill transition-colors ${
                activeStatus === tab.value
                  ? "bg-tsu-accent text-white"
                  : "bg-tsu-card border border-tsu-card-border text-tsu-text-secondary hover:text-tsu-text-primary"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {error && (
          <div className="bg-red-950 text-red-400 rounded-lg p-4 text-sm md:text-md">
            Could not load submissions: {error.message}
          </div>
        )}

        {!error && (!theses || theses.length === 0) && (
          <div className="bg-tsu-card border border-tsu-card-border rounded-card p-10 text-center">
            <p className="text-tsu-text-secondary text-sm md:text-md">
              Nothing {activeStatus === "all" ? "" : activeStatus} right now.
            </p>
          </div>
        )}

        {theses && theses.length > 0 && (
          <div className="flex flex-col gap-3">
            {theses.map((t: any) => (
              <Link
                key={t.id}
                href={`/admin/theses/${t.id}`}
                className="bg-tsu-card border border-tsu-card-border rounded-card p-5 flex items-center justify-between hover:border-tsu-accent transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm md:text-md font-medium text-tsu-text-heading truncate">{t.title}</p>
                  <p className="text-md text-tsu-text-muted mt-1.5">
                    {t.author?.full_name} &middot; {t.department?.name} &middot; {t.programme?.name} &middot; {t.year}
                  </p>
                  {t.status === "rejected" && t.rejection_reason && (
                    <p className="text-md text-red-400 mt-1.5">Reason: {t.rejection_reason}</p>
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
      <span
        className={`flex-shrink-0 ml-4 text-md font-medium px-3.5 py-1.5 rounded-pill ${
          accessLevel === "restricted"
            ? "bg-tsu-gold-bg text-tsu-gold-text"
            : "bg-tsu-success-bg text-tsu-success-text"
        }`}
      >
        {accessLevel === "restricted" ? "Published (restricted)" : "Published"}
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="flex-shrink-0 ml-4 bg-red-950 text-red-400 text-md font-medium px-3.5 py-1.5 rounded-pill">
        Rejected
      </span>
    );
  }
  return (
    <span className="flex-shrink-0 ml-4 bg-tsu-accent-tag-bg text-tsu-accent-tag-text text-md font-medium px-3.5 py-1.5 rounded-pill group-hover:bg-tsu-accent group-hover:text-white transition-colors">
      Review
    </span>
  );
}