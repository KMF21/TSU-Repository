import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const alt = "Thesis — TSU Digital Research Repository";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Per-thesis share image. Reads with the public (anon) key, so it can only
 * ever see published + open theses; restricted work falls back to the
 * generic card and its title is never rendered.
 */
export default async function Image({ params }: { params: { id: string } }) {
  let title = "TSU Digital Research Repository";
  let line = "Taraba State University";

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("theses")
      .select("title, author_name, year, department:departments ( name )")
      .eq("id", params.id)
      .eq("status", "published")
      .eq("access_level", "open")
      .maybeSingle();

    if (data) {
      title = data.title.length > 150 ? data.title.slice(0, 147) + "…" : data.title;
      const dept = (Array.isArray(data.department) ? data.department[0] : data.department) as
        | { name: string }
        | null;
      line = `${data.author_name} · ${dept?.name ?? "Taraba State University"} · ${data.year}`;
    }
  } catch {
    /* fall back to the generic card */
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 80px",
          background: "linear-gradient(135deg, #0b1220 0%, #111a2e 55%, #16305c 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 5, color: "#8db6ec" }}>
          TSU DIGITAL RESEARCH REPOSITORY
        </div>
        <div style={{ display: "flex", fontSize: title.length > 90 ? 48 : 60, fontWeight: 700, lineHeight: 1.18 }}>
          {title}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", width: 140, height: 6, background: "#2563eb", borderRadius: 3 }} />
          <div style={{ display: "flex", fontSize: 30, color: "#a6b0c0", marginTop: 22 }}>{line}</div>
        </div>
      </div>
    ),
    size
  );
}
