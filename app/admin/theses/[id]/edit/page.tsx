import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ThesisEditForm } from "@/app/components/ThesisEditForm";

export const metadata: Metadata = {
  title: "Admin — Edit metadata",
  robots: { index: false, follow: false },
};

export default async function EditThesisPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient();

  const [{ data: thesis }, { data: departments }, { data: programmes }] = await Promise.all([
    supabase
      .from("theses")
      .select(
        `id, title, abstract, keywords, year, supervisor_name, department_id, programme_id, status,
         author_name, private:thesis_author_private ( matric_number )`
      )
      .eq("id", params.id)
      .maybeSingle(),
    supabase.from("departments").select("id, name, faculty").order("name"),
    supabase.from("programmes").select("id, name, degree_type, department_id").order("name"),
  ]);

  if (!thesis) return notFound();

  return (
    <main className="min-h-screen bg-tsu-bg">
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <Link
          href={`/admin/theses/${thesis.id}`}
          className="mb-8 inline-flex items-center gap-2 text-base font-medium text-tsu-text-secondary transition-colors hover:text-white"
        >
          &larr; Back to review
        </Link>

        <div className="card p-6 sm:p-10">
          <p className="eyebrow mb-3">Admin</p>
          <h1 className="page-title mb-3">Edit metadata</h1>
          <p className="mb-8 text-base text-tsu-text-secondary sm:text-lg">
            Corrections are logged in the audit trail. The PDF, author, status and access level are
            not changed here.
            {thesis.status === "published" &&
              " This thesis is published, so saved changes appear publicly straight away."}
          </p>

          <ThesisEditForm
            thesisId={thesis.id}
            departments={departments ?? []}
            programmes={programmes ?? []}
            initial={{
              author_name: thesis.author_name,
              matric_number:
                ((Array.isArray(thesis.private) ? thesis.private[0] : thesis.private) as any)
                  ?.matric_number ?? "",
              title: thesis.title,
              abstract: thesis.abstract,
              keywords: thesis.keywords ?? [],
              year: thesis.year,
              supervisor_name: thesis.supervisor_name,
              department_id: thesis.department_id,
              programme_id: thesis.programme_id,
            }}
          />
        </div>
      </div>
    </main>
  );
}
