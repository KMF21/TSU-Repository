import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getThesisPreviewUrl } from "@/lib/actions/reviewThesis";

import { notFound } from "next/navigation";
import { ReviewDecision } from "@/app/components/ReviewDecision";
import { AccessLevelToggle } from "@/app/components/Accessleveltoggle";

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

export default async function ThesisReviewPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient();

  const { data: thesis } = await supabase
    .from("theses")
    .select(
      `id, title, abstract, keywords, year, degree_type, supervisor_name, status, access_level,
       original_filename, file_size_bytes,
       author:users!theses_author_id_fkey ( full_name, email, matric_number ),
       department:departments ( name, faculty ),
       programme:programmes ( name )`
    )
    .eq("id", params.id)
    .single();

  if (!thesis) return notFound();

  const previewUrl = await getThesisPreviewUrl(params.id);
  const author = thesis.author as any;
  const department = thesis.department as any;
  const programme = thesis.programme as any;

  return (
    <main className="min-h-screen bg-tsu-bg">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-tsu-card border border-tsu-card-border rounded-card p-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-xs text-tsu-text-muted">Reviewing submission</p>
            <span className="bg-tsu-accent-tag-bg text-tsu-accent-tag-text text-xs font-medium px-3.5 py-1.5 rounded-pill">
              {thesis.status}
            </span>
          </div>

          <h1 className="text-xl font-semibold text-tsu-text-heading mb-1">{thesis.title}</h1>
          <p className="text-sm text-tsu-text-muted mb-6">
            {author?.full_name} &middot; {author?.matric_number || "No matric number on file"}
          </p>

          <div className="bg-tsu-bg border border-tsu-card-border rounded-card p-5 mb-4">
            <p className="text-[11px] tracking-wider uppercase text-tsu-text-muted mb-3">
              Academic record
            </p>
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-tsu-text-muted">Department</dt>
              <dd className="text-tsu-text-primary text-right">{department?.name}</dd>
              <dt className="text-tsu-text-muted">Programme</dt>
              <dd className="text-tsu-text-primary text-right">
                {DEGREE_LABELS[thesis.degree_type]} — {programme?.name}
              </dd>
              <dt className="text-tsu-text-muted">Year</dt>
              <dd className="text-tsu-text-primary text-right">{thesis.year}</dd>
              <dt className="text-tsu-text-muted">Supervisor</dt>
              <dd className="text-tsu-text-primary text-right">{thesis.supervisor_name}</dd>
            </dl>
          </div>

          <div className="bg-tsu-bg border border-tsu-card-border rounded-card p-5 mb-4">
            <p className="text-[11px] tracking-wider uppercase text-tsu-text-muted mb-3">
              Abstract
            </p>
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

          <div className="bg-tsu-bg border border-tsu-card-border rounded-card p-5 mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-tsu-text-primary">{thesis.original_filename}</p>
              <p className="text-xs text-tsu-text-muted mt-0.5">
                {thesis.file_size_bytes ? (thesis.file_size_bytes / (1024 * 1024)).toFixed(1) : "?"}MB
              </p>
            </div>
            {previewUrl ? (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-tsu-accent text-white text-xs font-medium px-4 py-2 rounded-pill hover:opacity-90 transition-opacity"
              >
                Open PDF
              </a>
            ) : (
              <span className="text-xs text-tsu-text-muted">Preview unavailable</span>
            )}
          </div>

          <AccessLevelToggle thesisId={thesis.id} currentAccessLevel={thesis.access_level} />

          <ReviewDecision thesisId={thesis.id} />
        </div>
      </div>
    </main>
  );
}