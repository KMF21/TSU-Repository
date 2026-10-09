"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export type EditThesisInput = {
  title: string;
  abstract: string;
  keywords: string; // comma-separated, same format as the submission form
  year: number;
  supervisor_name: string;
  department_id: string;
  programme_id: string;
};

export type EditThesisResult =
  | { success: true; changed: string[] }
  | { success: false; error: string };

/**
 * Admin-only metadata correction.
 *
 * Authorization is checked three ways: the caller must be signed in, their
 * users row must have role = 'admin' (read through RLS), and the UPDATE
 * itself runs through the RLS-scoped client so the database's own
 * theses_admin_update policy has the final say.
 *
 * Deliberately NOT editable here: the PDF, the author, status and access
 * level. Those have their own actions and audit trail.
 */
export async function updateThesisMetadata(
  thesisId: string,
  input: EditThesisInput
): Promise<EditThesisResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not signed in" };

  const supabase = await createServerSupabaseClient();

  const { data: profile } = await supabase
    .from("users")
    .select("id, role")
    .eq("clerk_id", userId)
    .single();

  if (!profile || profile.role !== "admin") {
    return { success: false, error: "Not authorized" };
  }

  // ---- Validate -------------------------------------------------------
  const title = input.title.trim();
  const abstract = input.abstract.trim();
  const supervisor = input.supervisor_name.trim();
  const year = Number(input.year);
  const currentYear = new Date().getFullYear();

  if (title.length < 5) return { success: false, error: "Title is too short." };
  if (title.length > 500) return { success: false, error: "Title is too long (500 characters max)." };
  if (abstract.length < 50) return { success: false, error: "Abstract is too short." };
  if (!supervisor) return { success: false, error: "Supervisor is required." };
  if (!Number.isInteger(year) || year < 1990 || year > currentYear) {
    return { success: false, error: `Year must be between 1990 and ${currentYear}.` };
  }

  const keywords = input.keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  if (keywords.length > 15) return { success: false, error: "Please use 15 keywords or fewer." };

  // The programme must belong to the chosen department; degree_type is
  // always derived from the programme so the two can never disagree.
  const { data: programme } = await supabase
    .from("programmes")
    .select("id, degree_type, department_id")
    .eq("id", input.programme_id)
    .single();

  if (!programme || programme.department_id !== input.department_id) {
    return { success: false, error: "That programme does not belong to the selected department." };
  }

  // ---- Diff against the current record --------------------------------
  const { data: before } = await supabase
    .from("theses")
    .select("title, abstract, keywords, year, supervisor_name, department_id, programme_id, degree_type")
    .eq("id", thesisId)
    .single();

  if (!before) return { success: false, error: "Submission not found." };

  const next = {
    title,
    abstract,
    keywords,
    year,
    supervisor_name: supervisor,
    department_id: input.department_id,
    programme_id: input.programme_id,
    degree_type: programme.degree_type,
  };

  const changed: string[] = [];
  const beforeValues: Record<string, unknown> = {};
  const afterValues: Record<string, unknown> = {};
  for (const key of Object.keys(next) as (keyof typeof next)[]) {
    const a = JSON.stringify(before[key]);
    const b = JSON.stringify(next[key]);
    if (a !== b) {
      changed.push(key);
      beforeValues[key] = before[key];
      afterValues[key] = next[key];
    }
  }

  if (changed.length === 0) return { success: true, changed: [] };

  // ---- Write (RLS-scoped) ---------------------------------------------
  const { data: updated, error } = await supabase
    .from("theses")
    .update(next)
    .eq("id", thesisId)
    .select("id");

  // RLS can turn a forbidden UPDATE into a silent no-op, so confirm a row changed.
  if (error || !updated || updated.length === 0) {
    return { success: false, error: "Could not save your changes." };
  }

  // ---- Audit (service role only, never from the client) ---------------
  const service = createServiceRoleSupabaseClient();
  await service.from("audit_log").insert({
    actor_id: profile.id,
    action: "edited_thesis_metadata",
    target_table: "theses",
    target_id: thesisId,
    metadata: { changed, before: beforeValues, after: afterValues },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/theses/${thesisId}`);
  revalidatePath(`/theses/${thesisId}`);
  revalidatePath("/browse");

  return { success: true, changed };
}
