"use server";

import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ActionResult = { success: true } | { success: false; error: string };

async function requireAdminProfile(): Promise<
  | { success: true; profile: { id: string; role: string; tenant_id: string } }
  | { success: false; error: string }
> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not signed in" };

  const supabase = await createServerSupabaseClient();
  const { data: profile, error } = await supabase
    .from("users")
    .select("id, role, tenant_id")
    .eq("clerk_id", userId)
    .single();

  if (error || !profile || profile.role !== "admin") {
    return { success: false, error: "Not authorized" };
  }
  return { success: true, profile };
}

export async function approveThesis(thesisId: string): Promise<ActionResult> {
  const check = await requireAdminProfile();
  if (!check.success) return { success: false, error: check.error };

  const supabase = await createServerSupabaseClient();
  const serviceClient = createServiceRoleSupabaseClient();

  const { error } = await supabase
    .from("theses")
    .update({
      status: "published",
      reviewed_at: new Date().toISOString(),
      reviewed_by: check.profile.id,
      published_at: new Date().toISOString(),
    })
    .eq("id", thesisId);

  if (error) return { success: false, error: "Could not approve submission." };

  // Audit log write happens server-side only, via service role —
  // clients are never permitted to insert audit entries directly.
  await serviceClient.from("audit_log").insert({
    actor_id: check.profile.id,
    action: "approved_thesis",
    target_table: "theses",
    target_id: thesisId,
    metadata: {},
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function rejectThesis(thesisId: string, reason: string): Promise<ActionResult> {
  const check = await requireAdminProfile();
  if (!check.success) return { success: false, error: check.error };

  if (!reason.trim()) {
    return { success: false, error: "Please provide a reason for rejection." };
  }

  const supabase = await createServerSupabaseClient();
  const serviceClient = createServiceRoleSupabaseClient();

  const { error } = await supabase
    .from("theses")
    .update({
      status: "rejected",
      rejection_reason: reason.trim(),
      reviewed_at: new Date().toISOString(),
      reviewed_by: check.profile.id,
    })
    .eq("id", thesisId);

  if (error) return { success: false, error: "Could not reject submission." };

  await serviceClient.from("audit_log").insert({
    actor_id: check.profile.id,
    action: "rejected_thesis",
    target_table: "theses",
    target_id: thesisId,
    metadata: { reason: reason.trim() },
  });

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Generates a short-lived signed URL so an admin can preview the PDF.
 * Reads directly from theses.file_url — there is no separate staging
 * path now that compression has been dropped from the submission flow.
 */
export async function getThesisPreviewUrl(thesisId: string): Promise<string | null> {
  const check = await requireAdminProfile();
  if (!check.success) return null;

  const serviceClient = createServiceRoleSupabaseClient();
  const { data: thesis } = await serviceClient
    .from("theses")
    .select("file_url")
    .eq("id", thesisId)
    .single();

  if (!thesis?.file_url) return null;

  const { data: signed } = await serviceClient.storage
    .from("theses")
    .createSignedUrl(thesis.file_url, 60 * 10); // 10-minute link

  return signed?.signedUrl ?? null;
}