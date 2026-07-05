import { currentUser } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SubmissionForm } from "@/components/SubmissioForm";


export default async function SubmitPage() {
  const user = await currentUser();
  const supabase = await createServerSupabaseClient();

  const [{ data: departments }, { data: programmes }] = await Promise.all([
    supabase.from("departments").select("id, name, faculty").order("name"),
    supabase.from("programmes").select("id, name, degree_type, department_id").order("name"),
  ]);

  const authorName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.primaryEmailAddress?.emailAddress || ""
    : "";

  return (
    <main className="min-h-screen bg-tsu-cream">
      <SubmissionForm
        departments={departments ?? []}
        programmes={programmes ?? []}
        authorName={authorName}
      />
    </main>
  );
}