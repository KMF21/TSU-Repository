import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";
import { getThesisFileUrl } from "@/lib/actions/publicThesis";
import { notFound } from "next/navigation";
import { ExpandableText } from "@/app/components/ExpandableText";

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

export default async function ThesisDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createServerSupabaseClient();

  const { data: thesis } = await supabase
    .from("theses")
    .select(
      `id, title, abstract, keywords, year, degree_type, supervisor_name, access_level,
       view_count, download_count,
       author:users!theses_author_id_fkey ( full_name ),
       department:departments ( name, faculty ),
       programme:programmes ( name )`,
    )
    .eq("id", params.id)
    .eq("status", "published")
    .single();

  // RLS already prevents unauthorized visitors from ever getting a row
  // back here — a restricted thesis simply won't resolve for a
  // signed-out visitor, so this doubles as the access check.
  if (!thesis) return notFound();

  // Atomic increment, done server-side via service role — see
  // migration 005 for why this isn't a plain JS read-modify-write.
  const serviceClient = createServiceRoleSupabaseClient();
  const { data: newViewCount } = await serviceClient.rpc(
    "increment_view_count",
    {
      p_thesis_id: params.id,
    },
  );

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
            <p className="text-md text-tsu-text-muted">{department?.faculty}</p>
            {thesis.access_level === "restricted" && (
              <span className="bg-tsu-gold-bg text-tsu-gold-text text-md font-medium px-3.5 py-1.5 rounded-pill">
                TSU access only
              </span>
            )}
          </div>

          <h1 className="text-xl md:text-2xl font-semibold text-tsu-text-heading mb-2 leading-snug">
            {thesis.title}
          </h1>
          <p className="text-sm md:text-md text-tsu-text-secondary mb-1">
            {author?.full_name}
          </p>
          <p className="text-md text-tsu-text-muted mb-6">
            {DEGREE_LABELS[thesis.degree_type]} &middot; {department?.name}{" "}
            &middot; {thesis.year}
          </p>

          <div className="bg-tsu-bg border border-tsu-card-border rounded-card p-5 mb-4">
            <p className="text-[11px] tracking-wider uppercase text-tsu-text-muted mb-3">
              Abstract
            </p>
            <ExpandableText
              text={thesis.abstract}
              maxLength={400}
              className="text-sm md:text-md text-tsu-text-secondary leading-relaxed"
            />
            {thesis.keywords?.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-4">
                {thesis.keywords.map((k: string) => (
                  <span
                    key={k}
                    className="bg-tsu-accent-tag-bg text-tsu-accent-tag-text text-md px-3 py-1 rounded-pill"
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
            <p className="font-display text-sm md:text-md leading-relaxed text-tsu-text-primary">
              {citation}
            </p>
            <p className="text-md text-tsu-text-muted mt-4 pt-3 border-t border-tsu-card-border">
              {newViewCount ?? thesis.view_count} views &middot;{" "}
              {thesis.download_count} downloads
            </p>
          </div>

          {fileUrl ? (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-tsu-accent text-white text-sm md:text-md font-medium py-3.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Download PDF
            </a>
          ) : (
            <div className="bg-tsu-input-bg border border-tsu-input-border rounded-lg p-4 text-center">
              <p className="text-sm md:text-md text-tsu-text-muted">
                Sign in with your TSU account to download this thesis.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
