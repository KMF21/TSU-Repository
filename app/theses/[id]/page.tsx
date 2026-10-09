import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";
import { ExpandableText } from "@/app/components/ExpandableText";
import { DEGREE_LABELS, INSTITUTION, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * One RLS-scoped fetch shared by generateMetadata and the page itself.
 * RLS already prevents unauthorized visitors from ever getting a row back:
 * a restricted thesis simply won't resolve for a signed-out visitor, so this
 * doubles as the access check.
 */
const getThesis = cache(async (id: string) => {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("theses")
    .select(
      `id, title, abstract, keywords, year, degree_type, supervisor_name, access_level,
       author_name, view_count, download_count,
       department:departments ( name, faculty ),
       programme:programmes ( name )`
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  return data;
});

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const thesis = await getThesis(params.id);
  if (!thesis) return { title: "Thesis not found", robots: { index: false } };

  const author = thesis.author_name;
  const department = thesis.department as any;
  const isOpen = thesis.access_level === "open";
  const pageUrl = `${SITE_URL}/theses/${thesis.id}`;
  const pdfUrl = `${pageUrl}/pdf`;
  const description =
    thesis.abstract.length > 300 ? thesis.abstract.slice(0, 297).trimEnd() + "…" : thesis.abstract;

  // Google Scholar inclusion tags (https://scholar.google.com/intl/en/scholar/inclusion.html)
  // plus Dublin Core. Restricted theses get none of these and are noindexed.
  const scholar: Record<string, string | string[]> = isOpen
    ? {
        citation_title: thesis.title,
        ...(author ? { citation_author: author } : {}),
        citation_publication_date: String(thesis.year),
        citation_dissertation_institution: INSTITUTION,
        citation_abstract_html_url: pageUrl,
        citation_pdf_url: pdfUrl,
        citation_language: "en",
        ...(thesis.keywords?.length ? { citation_keywords: thesis.keywords } : {}),
        "DC.title": thesis.title,
        ...(author ? { "DC.creator": author } : {}),
        "DC.date": String(thesis.year),
        "DC.type": "Text.Thesis",
        "DC.publisher": INSTITUTION,
        "DC.identifier": pageUrl,
        "DC.language": "en",
      }
    : {};

  return {
    title: thesis.title,
    description,
    alternates: { canonical: pageUrl },
    robots: isOpen ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: "article",
      url: pageUrl,
      title: thesis.title,
      description,
      siteName: SITE_NAME,
      ...(department?.name ? { section: department.name } : {}),
    },
    other: scholar,
  };
}

export default async function ThesisDetailPage({ params }: { params: { id: string } }) {
  const thesis = await getThesis(params.id);
  if (!thesis) return notFound();

  // Atomic increment, done server-side via service role — see
  // migration 005 for why this isn't a plain JS read-modify-write.
  const serviceClient = createServiceRoleSupabaseClient();
  const { data: newViewCount } = await serviceClient.rpc("increment_view_count", {
    p_thesis_id: params.id,
  });

  const authorName = thesis.author_name;
  const department = thesis.department as any;
  const programme = thesis.programme as any;
  const degree = DEGREE_LABELS[thesis.degree_type] ?? thesis.degree_type;
  const pageUrl = `${SITE_URL}/theses/${thesis.id}`;

  const citation = `${authorName}. (${thesis.year}). ${thesis.title}. ${degree} thesis, ${department?.name}, ${INSTITUTION}.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Thesis",
    name: thesis.title,
    url: pageUrl,
    author: { "@type": "Person", name: authorName },
    datePublished: String(thesis.year),
    inLanguage: "en",
    description: thesis.abstract.slice(0, 500),
    keywords: (thesis.keywords ?? []).join(", "),
    inSupportOf: degree,
    publisher: { "@type": "CollegeOrUniversity", name: INSTITUTION },
  };

  return (
    <main className="min-h-screen bg-tsu-bg">
      {thesis.access_level === "open" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <Link
          href="/browse"
          className="mb-8 inline-flex items-center gap-2 text-base font-medium text-tsu-text-secondary transition-colors hover:text-white"
        >
          &larr; Back to browse
        </Link>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
          {/* ---------- Main column ---------- */}
          <div className="min-w-0 space-y-6">
            <div className="card p-6 sm:p-10">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <p className="eyebrow">{department?.faculty}</p>
                {thesis.access_level === "restricted" && (
                  <span className="pill-gold">TSU access only</span>
                )}
              </div>

              <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-[44px]">
                {thesis.title}
              </h1>

              <p className="mt-6 text-xl font-medium text-white">{authorName}</p>
              <p className="mt-1.5 text-base text-tsu-text-secondary sm:text-lg">
                {degree} &middot; {department?.name} &middot; {thesis.year}
              </p>
            </div>

            <div className="card p-6 sm:p-10">
              <p className="section-label mb-4">Abstract</p>
              <ExpandableText
                text={thesis.abstract}
                maxLength={600}
                className="text-base leading-[1.8] text-tsu-text-primary/90 sm:text-lg"
              />

              {thesis.keywords?.length > 0 && (
                <div className="mt-7 flex flex-wrap gap-2.5 border-t border-tsu-card-border pt-6">
                  {thesis.keywords.map((k: string) => (
                    <span key={k} className="chip">
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-6 sm:p-10">
              <p className="section-label mb-4">How to cite this</p>
              <p className="font-display text-lg leading-relaxed text-white sm:text-xl">{citation}</p>
            </div>
          </div>

          {/* ---------- Sidebar ---------- */}
          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="card p-6 sm:p-7">
              <a
                href={`/theses/${thesis.id}/pdf?download=1`}
                className="btn-primary w-full py-4 text-lg"
              >
                Download PDF
              </a>
              <a
                href={`/theses/${thesis.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary mt-3 w-full"
              >
                Read online
              </a>

              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-tsu-card-border pt-6 text-center">
                <div>
                  <p className="font-display text-3xl font-semibold text-white">
                    {(newViewCount ?? thesis.view_count ?? 0).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-tsu-text-muted">Views</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-semibold text-white">
                    {(thesis.download_count ?? 0).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-tsu-text-muted">Downloads</p>
                </div>
              </div>
            </div>

            <div className="card p-6 sm:p-7">
              <p className="section-label mb-5">Details</p>
              <dl className="space-y-4 text-base">
                <Detail label="Department" value={department?.name} />
                <Detail label="Programme" value={programme?.name} />
                <Detail label="Degree" value={degree} />
                <Detail label="Year" value={String(thesis.year)} />
                <Detail label="Supervisor" value={thesis.supervisor_name} />
                <Detail
                  label="Access"
                  value={thesis.access_level === "open" ? "Open access" : "TSU users only"}
                />
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-sm text-tsu-text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium text-tsu-text-primary">{value}</dd>
    </div>
  );
}
