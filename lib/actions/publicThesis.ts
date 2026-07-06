"use server";

import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

/**
 * Returns a signed download URL for a thesis — but only if the row is
 * actually visible to the current requester. We deliberately query
 * through the RLS-aware client first: if the thesis isn't visible (e.g.
 * it's restricted and the visitor isn't signed in), the select simply
 * returns nothing, and we never touch storage at all. Only after RLS
 * has confirmed visibility do we use the service role client to mint
 * the actual signed URL (storage access itself isn't RLS-gated the same
 * way table rows are, so this order matters).
 */
export async function getThesisFileUrl(thesisId: string): Promise<string | null> {
  const supabase = await createServerSupabaseClient();

  const { data: thesis } = await supabase
    .from("theses")
    .select("file_url, status, access_level")
    .eq("id", thesisId)
    .eq("status", "published")
    .single();

  if (!thesis?.file_url) return null;

  const serviceClient = createServiceRoleSupabaseClient();

  // Uses service role deliberately — this is a narrow, safe counter
  // increment, not a sensitive write, so bypassing RLS here is fine
  // (same pattern as the audit_log writes elsewhere in the app).
  await serviceClient.rpc("increment_download_count", { p_thesis_id: thesisId });

  const { data: signed } = await serviceClient.storage
    .from("theses")
    .createSignedUrl(thesis.file_url, 60 * 30); // 30-minute link

  return signed?.signedUrl ?? null;
}