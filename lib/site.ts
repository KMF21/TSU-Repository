/**
 * Single source of truth for the public identity of the repository.
 * Used by metadata, the sitemap, robots.txt, Google Scholar tags and the
 * OAI-PMH endpoint, so a domain change is a one-line edit (or one env var).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://repository.tsucpgs.com.ng"
).replace(/\/+$/, "");

export const SITE_NAME = "TSU Digital Research Repository";
export const INSTITUTION = "Taraba State University";
export const ADMIN_EMAIL = "tsupgs@tsuniversity.edu.ng";

/** Host used inside OAI identifiers: oai:<OAI_HOST>:<thesis-uuid> */
export const OAI_HOST = new URL(SITE_URL).host;

export const DEGREE_LABELS: Record<string, string> = {
  bsc: "B.Sc.",
  msc: "M.Sc.",
  ma: "M.A.",
  med: "M.Ed.",
  pgd: "PGD",
  mphil: "M.Phil.",
  phd: "Ph.D.",
  other: "Other",
};
