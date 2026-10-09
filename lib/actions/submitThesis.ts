"use server";

import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB hard cap — the real safeguard

export type SubmitThesisResult =
  | { success: true; thesisId: string }
  | { success: false; error: string };

/**
 * Two ways in:
 *
 *  - "self"      A student submits their own work. The author name defaults to
 *                their account name but can be corrected to match the title
 *                page. Their matric number is saved to their profile so the
 *                form is pre-filled next time.
 *
 *  - "on_behalf" An admin or depositor uploads someone else's work. The author
 *                name and matric number are typed in and belong to the AUTHOR.
 *                Nothing is written to the uploader's own profile. Whether the
 *                caller may do this is decided here, from the database, never
 *                from anything the browser sends.
 */
export async function submitThesis(formData: FormData): Promise<SubmitThesisResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in to submit." };
  }

  const onBehalf = String(formData.get("on_behalf") ?? "") === "1";

  const title = String(formData.get("title") ?? "").trim();
  const abstract = String(formData.get("abstract") ?? "").trim();
  const keywordsRaw = String(formData.get("keywords") ?? "").trim();
  const departmentId = String(formData.get("department_id") ?? "");
  const programmeId = String(formData.get("programme_id") ?? "");
  const degreeType = String(formData.get("degree_type") ?? "");
  const year = Number(formData.get("year"));
  const supervisorName = String(formData.get("supervisor_name") ?? "").trim();
  const authorNameInput = String(formData.get("author_name") ?? "").trim();
  const matricNumber = String(formData.get("matric_number") ?? "").trim();
  const file = formData.get("file") as File | null;

  // --- Validation ---
  if (!title || !abstract || !departmentId || !programmeId || !degreeType || !year || !supervisorName || !matricNumber) {
    return { success: false, error: "Please complete every required field before submitting." };
  }
  if (onBehalf && !authorNameInput) {
    return { success: false, error: "Please enter the author's full name." };
  }
  if (!file || file.size === 0) {
    return { success: false, error: "Please attach your thesis as a PDF." };
  }
  if (file.type !== "application/pdf") {
    return { success: false, error: "Only PDF files are accepted. Please convert your document and try again." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      error: "File exceeds the 50MB limit. Please compress your PDF using a free tool such as smallpdf.com or ilovepdf.com and try again.",
    };
  }

  const keywords = keywordsRaw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const supabase = await createServerSupabaseClient();

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, tenant_id, role, full_name")
    .eq("clerk_id", userId)
    .single();

  if (profileError || !profile) {
    return { success: false, error: "We couldn't verify your profile. Please try signing out and back in." };
  }

  if (onBehalf && profile.role !== "admin" && profile.role !== "depositor") {
    return { success: false, error: "You are not authorized to upload on behalf of others." };
  }

  const authorName = onBehalf ? authorNameInput : authorNameInput || profile.full_name;

  // A student's own matric number is identity data tied to the person, so it
  // is remembered on their profile. For uploads on behalf it belongs to
  // someone else and must never touch the uploader's profile.
  if (!onBehalf) {
    await supabase.from("users").update({ matric_number: matricNumber }).eq("id", profile.id);
  }

  // --- Upload directly to the permanent path ---
  const serviceClient = createServiceRoleSupabaseClient();
  const filePath = `theses/${profile.tenant_id}/${randomUUID()}.pdf`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await serviceClient.storage
    .from("theses")
    .upload(filePath, arrayBuffer, { contentType: "application/pdf" });

  if (uploadError) {
    return { success: false, error: "File upload failed. Please try again." };
  }

  const { data: thesis, error: insertError } = await supabase
    .from("theses")
    .insert({
      tenant_id: profile.tenant_id,
      title,
      abstract,
      keywords,
      author_id: profile.id, // the uploading account (owner)
      author_name: authorName, // the real author, as published
      submitted_on_behalf: onBehalf,
      department_id: departmentId,
      programme_id: programmeId,
      degree_type: degreeType,
      year,
      supervisor_name: supervisorName,
      original_filename: file.name,
      file_size_bytes: file.size,
      file_url: filePath,
      status: "pending",
      access_level: "open",
    })
    .select("id")
    .single();

  if (insertError || !thesis) {
    // Don't leave an orphaned PDF behind if the record could not be saved.
    await serviceClient.storage.from("theses").remove([filePath]);
    return { success: false, error: "Could not save your submission. Please try again." };
  }

  // The author's matric number lives in a private, RLS-protected table.
  const { error: privateError } = await supabase
    .from("thesis_author_private")
    .insert({ thesis_id: thesis.id, matric_number: matricNumber });

  if (privateError) {
    // The thesis is saved and can be reviewed; admins can add the matric
    // number when editing. Surface it in logs rather than failing the upload.
    console.error("thesis_author_private insert failed:", privateError.message);
  }

  if (onBehalf) {
    await serviceClient.from("audit_log").insert({
      actor_id: profile.id,
      action: "uploaded_on_behalf",
      target_table: "theses",
      target_id: thesis.id,
      metadata: { author_name: authorName },
    });
  }

  return { success: true, thesisId: thesis.id };
}
