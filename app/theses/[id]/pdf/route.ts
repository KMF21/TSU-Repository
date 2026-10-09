import { NextRequest } from "next/server";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Stable, permanent PDF URL:  /theses/{id}/pdf
 *
 * Why this exists: Google Scholar, BASE and CORE need a PDF address that
 * never changes and lives on the same host as the abstract page. Supabase
 * signed URLs expire and point at another host, so they can't be indexed.
 *
 * Access control is unchanged: visibility is decided by RLS first.
 *  - open + published       -> served to anyone (this is what crawlers hit)
 *  - restricted + published -> served only to signed-in users (RLS)
 *  - anything else          -> 404, indistinguishable from "does not exist"
 *
 * The file is streamed through (never buffered) with Range support, so large
 * PDFs and in-browser viewers work. Downloads are only counted when the
 * request carries ?download=1, so crawler and viewer fetches do not inflate
 * the download counter.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient();

  const { data: thesis } = await supabase
    .from("theses")
    .select("id, title, file_url, access_level")
    .eq("id", params.id)
    .eq("status", "published")
    .maybeSingle();

  if (!thesis?.file_url) {
    return new Response("Not found", { status: 404 });
  }

  const service = createServiceRoleSupabaseClient();
  const { data: signed } = await service.storage
    .from("theses")
    .createSignedUrl(thesis.file_url, 120);

  if (!signed?.signedUrl) {
    return new Response("File unavailable", { status: 502 });
  }

  const range = req.headers.get("range");
  const upstream = await fetch(signed.signedUrl, {
    headers: range ? { range } : undefined,
    cache: "no-store",
  });

  if (!upstream.ok && upstream.status !== 206) {
    return new Response("File unavailable", { status: 502 });
  }

  const wantsDownload = req.nextUrl.searchParams.get("download") === "1";
  if (wantsDownload && req.method === "GET") {
    // Narrow, safe counter increment; same service-role pattern as before.
    await service.rpc("increment_download_count", { p_thesis_id: thesis.id });
  }

  const safeName =
    thesis.title
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "thesis";

  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set(
    "Content-Disposition",
    `${wantsDownload ? "attachment" : "inline"}; filename="${safeName}.pdf"`
  );
  headers.set("Accept-Ranges", "bytes");
  const len = upstream.headers.get("content-length");
  if (len) headers.set("Content-Length", len);
  const contentRange = upstream.headers.get("content-range");
  if (contentRange) headers.set("Content-Range", contentRange);

  if (wantsDownload) {
    // Must reach the function every time or the download counter undercounts.
    headers.set("Cache-Control", "private, no-store");
  } else if (thesis.access_level === "open") {
    headers.set("Cache-Control", "public, max-age=300, s-maxage=300");
  } else {
    headers.set("Cache-Control", "private, no-store");
  }
  if (thesis.access_level !== "open") {
    headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}
