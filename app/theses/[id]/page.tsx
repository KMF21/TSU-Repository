import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getThesisFileUrl } from "@/lib/actions/publicThesis";
import { notFound } from "next/navigation";

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

export default async function ThesisDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient();

  const { data: thesis } = await supabase
    .from("theses")
    .select(
      `id, title, abstract, keywords, year, degree_type, supervisor_name, access_level,
       author:users!theses_author_id_fkey ( full_name ),
       department:departments ( name, faculty ),
       programme:programmes ( name )`
    )
    .eq("id", params.id)
    .eq("status", "published")
    .single();

  // RLS already prevents unauthorized visitors from ever getting a row
  // back here — a restricted thesis simply won't resolve for a
  // signed-out visitor, so this doubles as the access check.
  if (!thesis) return notFound();

  const fileUrl = await getThesisFileUrl(params.id);
  const author = thesis.author as any;
  const department = thesis.department as any;
  const programme = thesis.programme as any;

  const citation = `${author?.full_name}. (${thesis.year}). ${thesis.title}. ${DEGREE_LABELS[thesis.degree_type]} thesis, ${department?.name}, Taraba State University.`;

  return (
    <main className="min-h-screen bg-tsu-bg">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-tsu-card border border-tsu-card-border rounded-card p-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-xs text-tsu-text-muted">{department?.faculty}</p>
            {thesis.access_level === "restricted" && (
              <span className="bg-tsu-gold-bg text-tsu-gold-text text-xs font-medium px-3.5 py-1.5 rounded-pill">
                TSU access only
              </span>
            )}
          </div>

          <h1 className="text-xl font-semibold text-tsu-text-heading mb-2 leading-snug">
            {thesis.title}
          </h1>
          <p className="text-sm text-tsu-text-secondary mb-1">{author?.full_name}</p>
          <p className="text-xs text-tsu-text-muted mb-6">
            {DEGREE_LABELS[thesis.degree_type]} &middot; {department?.name} &middot; {thesis.year}
          </p>

          <div className="bg-tsu-bg border border-tsu-card-border rounded-card p-5 mb-4">
            <p className="text-[11px] tracking-wider uppercase text-tsu-text-muted mb-3">Abstract</p>
            <p className="text-sm text-tsu-text-secondary leading-relaxed">{thesis.abstract}</p>
            {thesis.keywords?.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-4">
                {thesis.keywords.map((k: string) => (
                  <span
                    key={k}
                    className="bg-tsu-accent-tag-bg text-tsu-accent-tag-text text-xs px-3 py-1 rounded-pill"
                  >
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-tsu-bg border border-tsu-card-border rounded-card p-5 mb-4">
            <p className="text-[11px] tracking-wider uppercase text-tsu-text-muted mb-3">
              How to cite this
            </p>
            <p className="font-display text-sm leading-relaxed text-tsu-text-primary">{citation}</p>
          </div>

          {fileUrl ? (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-tsu-accent text-white text-sm font-medium py-3.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Download PDF
            </a>
          ) : (
            <div className="bg-tsu-input-bg border border-tsu-input-border rounded-lg p-4 text-center">
              <p className="text-sm text-tsu-text-muted">
                Sign in with your TSU account to download this thesis.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}