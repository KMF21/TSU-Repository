import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getThesisPreviewUrl } from "@/lib/actions/reviewThesis";
import { ReviewDecision } from "@/app/components/ReviewDecision";
import { AccessLevelToggle } from "@/app/components/Accessleveltoggle";
import { ExpandableText } from "@/app/components/ExpandableText";
import { DEGREE_LABELS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Admin — Review submission",
  robots: { index: false, follow: false },
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
    .maybeSingle();

  if (!thesis) return notFound();

  const previewUrl = await getThesisPreviewUrl(params.id);
  const author = thesis.author as any;
  const department = thesis.department as any;
  const programme = thesis.programme as any;

  return (
    <main className="min-h-screen bg-tsu-bg">
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <Link
          href="/admin"
          className="mb-8 inline-flex items-center gap-2 text-base font-medium text-tsu-text-secondary transition-colors hover:text-white"
        >
          &larr; Back to submissions
        </Link>

        <div className="card p-6 sm:p-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="eyebrow">Reviewing submission</p>
            <div className="flex items-center gap-3">
              <span className="pill-blue capitalize">{thesis.status}</span>
              <Link
                href={`/admin/theses/${thesis.id}/edit`}
                className="btn-secondary !px-4 !py-2 text-sm sm:text-base"
              >
                Edit metadata
              </Link>
            </div>
          </div>

          <h1 className="font-display text-2xl font-semibold leading-tight text-white sm:text-4xl">
            {thesis.title}
          </h1>
          <p className="mt-4 text-base text-tsu-text-secondary sm:text-lg">
            {author?.full_name} &middot; {author?.matric_number || "No matric number on file"}
            {author?.email ? <> &middot; {author.email}</> : null}
          </p>

          <div className="panel mt-8 p-5 sm:p-7">
            <p className="section-label mb-5">Academic record</p>
            <dl className="grid gap-x-8 gap-y-5 text-base sm:grid-cols-2">
              <Field label="Department" value={department?.name} />
              <Field label="Faculty" value={department?.faculty} />
              <Field
                label="Programme"
                value={`${DEGREE_LABELS[thesis.degree_type] ?? thesis.degree_type} — ${programme?.name}`}
              />
              <Field label="Year" value={String(thesis.year)} />
              <Field label="Supervisor" value={thesis.supervisor_name} />
            </dl>
          </div>

          <div className="panel mt-5 p-5 sm:p-7">
            <p className="section-label mb-4">Abstract</p>
            <ExpandableText
              text={thesis.abstract}
              maxLength={600}
              className="text-base leading-[1.8] text-tsu-text-primary/90 sm:text-lg"
            />
            {thesis.keywords?.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2.5 border-t border-tsu-card-border pt-5">
                {thesis.keywords.map((k: string) => (
                  <span key={k} className="chip">
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="panel mt-5 mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-white sm:text-lg">
                {thesis.original_filename}
              </p>
              <p className="mt-0.5 text-base text-tsu-text-muted">
                {thesis.file_size_bytes
                  ? (thesis.file_size_bytes / (1024 * 1024)).toFixed(1)
                  : "?"}
                MB
              </p>
            </div>
            {previewUrl ? (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex-shrink-0"
              >
                Open PDF
              </a>
            ) : (
              <span className="text-base text-tsu-text-muted">Preview unavailable</span>
            )}
          </div>

          <AccessLevelToggle thesisId={thesis.id} currentAccessLevel={thesis.access_level} />

          <ReviewDecision thesisId={thesis.id} />
        </div>
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-sm text-tsu-text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium text-tsu-text-primary">{value || "—"}</dd>
    </div>
  );
}
