import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private, signed-in areas. Restricted theses are also noindexed
        // per-page and are never listed in the sitemap or the OAI feed.
        disallow: ["/admin", "/dashboard", "/submit", "/sign-in", "/sign-up", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
