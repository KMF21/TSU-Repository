import type { MetadataRoute } from "next";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

// Rebuilt at most once an hour; new publications show up shortly after approval.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/browse`, changeFrequency: "daily", priority: 0.8 },
  ];

  try {
    const service = createServiceRoleSupabaseClient();
    // PRIVACY RULE: published AND open only. Restricted work must never be listed.
    const { data } = await service
      .from("theses")
      .select("id, updated_at")
      .eq("status", "published")
      .eq("access_level", "open")
      .order("updated_at", { ascending: false })
      .limit(45000); // sitemap protocol cap is 50,000 URLs per file

    for (const t of data ?? []) {
      entries.push({
        url: `${SITE_URL}/theses/${t.id}`,
        lastModified: new Date(t.updated_at),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  } catch {
    // If the database is unreachable at build/revalidate time, still serve the static entries.
  }

  return entries;
}
