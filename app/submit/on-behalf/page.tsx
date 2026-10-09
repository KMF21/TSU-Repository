import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SubmissionForm } from "@/app/components/SubmissioForm";

export const metadata: Metadata = {
  title: "Upload for an author",
  robots: { index: false, follow: false },
};

/**
 * Upload on behalf of another person. Only admins and depositors may open
 * this page. The role is read from the database (never from the browser),
 * and submitThesis checks it again on the server before saving anything.
 */
export default async function SubmitOnBehalfPage() {
  const user = await currentUser();
  const supabase = await createServerSupabaseClient();

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("clerk_id", user?.id ?? "")
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "depositor")) {
    redirect("/submit");
  }

  const [{ data: departments }, { data: programmes }] = await Promise.all([
    supabase.from("departments").select("id, name, faculty").order("name"),
    supabase.from("programmes").select("id, name, degree_type, department_id").order("name"),
  ]);

  return (
    <main className="min-h-screen bg-tsu-bg">
      <SubmissionForm
        mode="onBehalf"
        departments={departments ?? []}
        programmes={programmes ?? []}
        authorName=""
        initialMatricNumber=""
      />
    </main>
  );
}
