"use server";

import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB hard cap — the real safeguard
const RECOMMENDED_SIZE_BYTES = 15 * 1024 * 1024; // soft, advisory threshold only

export type SubmitThesisResult =
  | { success: true; thesisId: string }
  | { success: false; error: string };

export async function submitThesis(formData: FormData): Promise<SubmitThesisResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in to submit." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const abstract = String(formData.get("abstract") ?? "").trim();
  const keywordsRaw = String(formData.get("keywords") ?? "").trim();
  const departmentId = String(formData.get("department_id") ?? "");
  const programmeId = String(formData.get("programme_id") ?? "");
  const degreeType = String(formData.get("degree_type") ?? "");
  const year = Number(formData.get("year"));
  const supervisorName = String(formData.get("supervisor_name") ?? "").trim();
  const matricNumber = String(formData.get("matric_number") ?? "").trim();
  const file = formData.get("file") as File | null;

  // --- Validation ---
  if (!title || !abstract || !departmentId || !programmeId || !degreeType || !year || !supervisorName || !matricNumber) {
    return { success: false, error: "Please complete every required field before submitting." };
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
    .select("id, tenant_id")
    .eq("clerk_id", userId)
    .single();

  if (profileError || !profile) {
    return { success: false, error: "We couldn't verify your profile. Please try signing out and back in." };
  }

  // Capture matric number on the student's profile — it's identity data
  // tied to the person, not the individual submission, so it's saved
  // once here rather than duplicated on every thesis record.
  await supabase
    .from("users")
    .update({ matric_number: matricNumber })
    .eq("id", profile.id);

  // --- Upload directly to the permanent path — no staging/compression handoff ---
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
      author_id: profile.id,
      department_id: departmentId,
      programme_id: programmeId,
      degree_type: degreeType,
      year,
      supervisor_name: supervisorName,
      original_filename: file.name,
      file_size_bytes: file.size,
      file_url: filePath,
      status: "pending",
      access_level: "restricted",
    })
    .select("id")
    .single();

  if (insertError || !thesis) {
    return { success: false, error: "Could not save your submission. Please try again." };
  }

  return { success: true, thesisId: thesis.id };
}