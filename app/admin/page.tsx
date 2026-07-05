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
    <main className="min-h-screen bg-tsu-cream">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <p className="font-mono text-xs tracking-widest text-tsu-slate uppercase mb-1">
          Admin &middot; TSU Digital Research Repository
        </p>
        <h1 className="font-display text-3xl font-semibold text-tsu-navy mb-8">
          Review queue
        </h1>

        {error && (
          <p className="text-red-600 text-sm">Could not load submissions: {error.message}</p>
        )}

        {!error && (!theses || theses.length === 0) && (
          <div className="border border-dashed border-tsu-border p-8 text-center text-tsu-slate bg-white">
            Nothing pending review right now.
          </div>
        )}

        {theses && theses.length > 0 && (
          <div className="border-t border-tsu-border">
            {theses.map((t: any) => (
              <Link
                key={t.id}
                href={`/admin/theses/${t.id}`}
                className="flex items-center justify-between py-4 border-b border-tsu-border hover:bg-white transition-colors px-2 -mx-2"
              >
                <div>
                  <p className="font-display text-lg text-tsu-charcoal">{t.title}</p>
                  <p className="text-sm text-tsu-slate">
                    {t.author?.full_name} &middot; {t.department?.name} &middot; {t.programme?.name} &middot; {t.year}
                  </p>
                </div>
                <span className="font-mono text-xs text-tsu-gold uppercase tracking-wider">
                  Review &rarr;
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}