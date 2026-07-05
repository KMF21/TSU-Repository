import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminQueuePage() {
  const supabase = await createServerSupabaseClient();

  const { data: theses, error } = await supabase
    .from("theses")
    .select(
      `id, title, year, submitted_at, degree_type,
       author:users!theses_author_id_fkey ( full_name ),
       department:departments ( name ),
       programme:programmes ( name )`
    )
    .eq("status", "pending")
    .order("submitted_at", { ascending: true });

  return (
    <main className="min-h-screen bg-tsu-bg">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-7">
          <div>
            <p className="text-xs text-tsu-text-muted mb-1">Admin · TSU Digital Research Repository</p>
            <h1 className="text-2xl font-semibold text-tsu-text-heading">Review queue</h1>
          </div>
          {theses && theses.length > 0 && (
            <span className="bg-tsu-accent-tag-bg text-tsu-accent-tag-text text-xs font-medium px-3.5 py-1.5 rounded-pill">
              {theses.length} pending
            </span>
          )}
        </div>

        {error && (
          <div className="bg-red-950 text-red-400 rounded-lg p-4 text-sm">
            Could not load submissions: {error.message}
          </div>
        )}

        {!error && (!theses || theses.length === 0) && (
          <div className="bg-tsu-card border border-tsu-card-border rounded-card p-10 text-center">
            <p className="text-tsu-text-secondary text-sm">Nothing pending review right now.</p>
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
                  <p className="text-sm font-medium text-tsu-text-heading truncate">{t.title}</p>
                  <p className="text-xs text-tsu-text-muted mt-1.5">
                    {t.author?.full_name} &middot; {t.department?.name} &middot; {t.programme?.name} &middot; {t.year}
                  </p>
                </div>
                <span className="flex-shrink-0 ml-4 bg-tsu-accent-tag-bg text-tsu-accent-tag-text text-xs font-medium px-3.5 py-1.5 rounded-pill group-hover:bg-tsu-accent group-hover:text-white transition-colors">
                  Review
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}