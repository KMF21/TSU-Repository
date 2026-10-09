import { NextRequest } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL, DEGREE_LABELS, INSTITUTION, OAI_HOST, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * OAI-PMH 2.0 data provider  →  https://repository.tsucpgs.com.ng/oai
 *
 * Lets aggregators (BASE, CORE, OpenAIRE and others) harvest TSU's theses as
 * Dublin Core. Google Scholar does NOT use OAI-PMH; it reads the citation_*
 * tags on each thesis page, which are handled in app/theses/[id]/page.tsx.
 *
 * PRIVACY RULE (do not weaken): only theses with status = 'published' AND
 * access_level = 'open' are ever returned. Restricted, pending and rejected
 * work is invisible here. The service-role client bypasses RLS, so these two
 * filters in `baseQuery()` are the access control for this endpoint.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BASE_URL = `${SITE_URL}/oai`;
const ID_PREFIX = `oai:${OAI_HOST}:`;
const PAGE_SIZE = 100;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// XML helpers
// ---------------------------------------------------------------------------

function esc(value: unknown): string {
  return String(value ?? "")
    // strip characters that are illegal in XML 1.0
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tag(name: string, value: unknown): string {
  const v = String(value ?? "").trim();
  return v ? `<${name}>${esc(v)}</${name}>` : "";
}

function utc(date: Date | string): string {
  return new Date(date).toISOString().replace(/\.\d{3}Z$/, "Z");
}

// ---------------------------------------------------------------------------
// OAI-PMH protocol plumbing
// ---------------------------------------------------------------------------

type OaiError = { code: string; message: string };
type Args = Record<string, string>;

const ROOT_OPEN =
  `<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/" ` +
  `xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ` +
  `xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/ http://www.openarchives.org/OAI/2.0/OAI-PMH.xsd">`;

function envelope(requestAttrs: Args | null, body: string): Response {
  const attrs = requestAttrs
    ? Object.entries(requestAttrs)
        .map(([k, v]) => ` ${k}="${esc(v)}"`)
        .join("")
    : "";
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n${ROOT_OPEN}` +
    `<responseDate>${utc(new Date())}</responseDate>` +
    `<request${attrs}>${esc(BASE_URL)}</request>` +
    body +
    `</OAI-PMH>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "text/xml; charset=UTF-8",
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
    },
  });
}

function errorResponse(errors: OaiError[], requestAttrs: Args | null): Response {
  const body = errors.map((e) => `<error code="${e.code}">${esc(e.message)}</error>`).join("");
  return envelope(requestAttrs, body);
}

const VERBS: Record<string, { required: string[]; optional: string[]; exclusive?: string }> = {
  Identify: { required: [], optional: [] },
  ListMetadataFormats: { required: [], optional: ["identifier"] },
  ListSets: { required: [], optional: [], exclusive: "resumptionToken" },
  GetRecord: { required: ["identifier", "metadataPrefix"], optional: [] },
  ListIdentifiers: {
    required: ["metadataPrefix"],
    optional: ["from", "until", "set"],
    exclusive: "resumptionToken",
  },
  ListRecords: {
    required: ["metadataPrefix"],
    optional: ["from", "until", "set"],
    exclusive: "resumptionToken",
  },
};

/** Parse query string (GET) or form body (POST) into single-valued args. */
async function readArgs(req: NextRequest): Promise<{ args: Args; repeated: boolean }> {
  let params: URLSearchParams;
  if (req.method === "POST") {
    const text = await req.text();
    params = new URLSearchParams(text);
  } else {
    params = req.nextUrl.searchParams;
  }

  const args: Args = {};
  let repeated = false;
  for (const key of Array.from(new Set(Array.from(params.keys())))) {
    const all = params.getAll(key);
    if (all.length > 1) repeated = true;
    args[key] = all[0];
  }
  return { args, repeated };
}

/** Returns badArgument errors, or an empty list if the argument set is legal. */
function validateArgs(verb: string, args: Args, repeated: boolean): OaiError[] {
  const spec = VERBS[verb];
  const errors: OaiError[] = [];
  if (repeated) errors.push({ code: "badArgument", message: "Repeated arguments are not allowed." });

  const supplied = Object.keys(args).filter((k) => k !== "verb");

  if (spec.exclusive && args[spec.exclusive] !== undefined) {
    if (supplied.length > 1) {
      errors.push({
        code: "badArgument",
        message: `${spec.exclusive} is an exclusive argument and cannot be combined with others.`,
      });
    }
    return errors;
  }

  const allowed = new Set([...spec.required, ...spec.optional, ...(spec.exclusive ? [spec.exclusive] : [])]);
  for (const k of supplied) {
    if (!allowed.has(k)) errors.push({ code: "badArgument", message: `Illegal argument: ${k}` });
  }
  for (const k of spec.required) {
    if (args[k] === undefined || args[k] === "") {
      errors.push({ code: "badArgument", message: `Missing required argument: ${k}` });
    }
  }
  return errors;
}

type Granularity = "day" | "sec";

function parseOaiDate(value: string): { date: Date; granularity: Granularity } | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(`${value}T00:00:00Z`);
    if (isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) return null;
    return { date: d, granularity: "day" };
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)) {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return { date: d, granularity: "sec" };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Sets (one per degree type)
// ---------------------------------------------------------------------------

const SETS = Object.entries(DEGREE_LABELS)
  .filter(([key]) => key !== "other")
  .map(([key, label]) => ({ spec: key, name: `${label} theses and dissertations` }));

// ---------------------------------------------------------------------------
// Data access — the ONLY place records are read
// ---------------------------------------------------------------------------

const RECORD_SELECT = `
  id, title, abstract, keywords, year, degree_type, supervisor_name, published_at, updated_at,
  author_name,
  department:departments ( name )
`;

function baseQuery(opts: { count?: boolean } = {}) {
  const service = createServiceRoleSupabaseClient();
  return service
    .from("theses")
    .select(RECORD_SELECT, opts.count ? { count: "exact" } : undefined)
    // ---- the privacy gate: published AND open, nothing else ----
    .eq("status", "published")
    .eq("access_level", "open");
}

type ThesisRow = {
  id: string;
  title: string;
  abstract: string;
  keywords: string[] | null;
  year: number;
  degree_type: string;
  supervisor_name: string;
  published_at: string | null;
  updated_at: string;
  author_name: string;
  department: { name: string } | { name: string }[] | null;
};

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? v[0] ?? null : v;
}

// ---------------------------------------------------------------------------
// Record rendering
// ---------------------------------------------------------------------------

function typeUris(degree: string): string[] {
  const out = ["Thesis"];
  if (degree === "phd") out.push("info:eu-repo/semantics/doctoralThesis");
  else if (["msc", "ma", "med", "mphil"].includes(degree)) out.push("info:eu-repo/semantics/masterThesis");
  else if (degree === "bsc") out.push("info:eu-repo/semantics/bachelorThesis");
  return out;
}

function header(t: ThesisRow): string {
  return (
    `<header>` +
    `<identifier>${esc(ID_PREFIX + t.id)}</identifier>` +
    `<datestamp>${utc(t.updated_at)}</datestamp>` +
    (SETS.some((s) => s.spec === t.degree_type) ? `<setSpec>${esc(t.degree_type)}</setSpec>` : "") +
    `</header>`
  );
}

function dcMetadata(t: ThesisRow): string {
  const author = t.author_name;
  const dept = one(t.department)?.name;
  const pageUrl = `${SITE_URL}/theses/${t.id}`;
  const pdfUrl = `${pageUrl}/pdf`;

  const parts = [
    tag("dc:title", t.title),
    tag("dc:creator", author),
    tag("dc:contributor", t.supervisor_name),
    ...(t.keywords ?? []).map((k) => tag("dc:subject", k)),
    tag("dc:description", t.abstract),
    tag("dc:publisher", INSTITUTION),
    tag("dc:date", t.year),
    ...typeUris(t.degree_type).map((u) => tag("dc:type", u)),
    tag("dc:format", "application/pdf"),
    tag("dc:identifier", pageUrl),
    tag("dc:identifier", pdfUrl),
    tag("dc:source", dept ? `${dept}, ${INSTITUTION}` : INSTITUTION),
    tag("dc:language", "en"),
    tag("dc:rights", "info:eu-repo/semantics/openAccess"),
  ];

  return (
    `<oai_dc:dc xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" ` +
    `xmlns:dc="http://purl.org/dc/elements/1.1/" ` +
    `xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ` +
    `xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai_dc/ http://www.openarchives.org/OAI/2.0/oai_dc.xsd">` +
    parts.join("") +
    `</oai_dc:dc>`
  );
}

const record = (t: ThesisRow) => `<record>${header(t)}<metadata>${dcMetadata(t)}</metadata></record>`;

// ---------------------------------------------------------------------------
// Resumption tokens
// ---------------------------------------------------------------------------

type TokenState = {
  verb: string;
  prefix: string;
  from?: string;
  until?: string;
  set?: string;
  offset: number;
};

function encodeToken(s: TokenState): string {
  return Buffer.from(JSON.stringify(s), "utf8").toString("base64url");
}

function decodeToken(token: string, verb: string): TokenState | null {
  try {
    const s = JSON.parse(Buffer.from(token, "base64url").toString("utf8")) as TokenState;
    if (
      s.verb !== verb ||
      s.prefix !== "oai_dc" ||
      !Number.isInteger(s.offset) ||
      s.offset < 0 ||
      (s.from !== undefined && !parseOaiDate(s.from)) ||
      (s.until !== undefined && !parseOaiDate(s.until))
    ) {
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Verb handlers
// ---------------------------------------------------------------------------

async function identify(attrs: Args): Promise<Response> {
  const { data: first } = await baseQuery()
    .order("updated_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(1);

  const row = (first ?? [])[0] as unknown as ThesisRow | undefined;
  const earliest = row ? utc(row.updated_at) : utc(new Date());
  const sample = ID_PREFIX + (row?.id ?? "00000000-0000-0000-0000-000000000000");

  const body =
    `<Identify>` +
    tag("repositoryName", SITE_NAME) +
    tag("baseURL", BASE_URL) +
    tag("protocolVersion", "2.0") +
    tag("adminEmail", ADMIN_EMAIL) +
    tag("earliestDatestamp", earliest) +
    tag("deletedRecord", "no") +
    tag("granularity", "YYYY-MM-DDThh:mm:ssZ") +
    `<description>` +
    `<oai-identifier xmlns="http://www.openarchives.org/OAI/2.0/oai-identifier" ` +
    `xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ` +
    `xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai-identifier http://www.openarchives.org/OAI/2.0/oai-identifier.xsd">` +
    tag("scheme", "oai") +
    tag("repositoryIdentifier", OAI_HOST) +
    tag("delimiter", ":") +
    tag("sampleIdentifier", sample) +
    `</oai-identifier>` +
    `</description>` +
    `</Identify>`;

  return envelope(attrs, body);
}

const FORMATS =
  `<metadataFormat>` +
  tag("metadataPrefix", "oai_dc") +
  tag("schema", "http://www.openarchives.org/OAI/2.0/oai_dc.xsd") +
  tag("metadataNamespace", "http://www.openarchives.org/OAI/2.0/oai_dc/") +
  `</metadataFormat>`;

function parseIdentifier(identifier: string): string | null {
  if (!identifier.startsWith(ID_PREFIX)) return null;
  const id = identifier.slice(ID_PREFIX.length);
  return UUID_RE.test(id) ? id.toLowerCase() : null;
}

async function listMetadataFormats(args: Args, attrs: Args): Promise<Response> {
  if (args.identifier !== undefined) {
    const id = parseIdentifier(args.identifier);
    if (!id) return errorResponse([{ code: "idDoesNotExist", message: "Unknown identifier." }], attrs);
    const { data } = await baseQuery().eq("id", id).limit(1);
    if (!data || data.length === 0) {
      return errorResponse([{ code: "idDoesNotExist", message: "Unknown identifier." }], attrs);
    }
  }
  return envelope(attrs, `<ListMetadataFormats>${FORMATS}</ListMetadataFormats>`);
}

function listSets(args: Args, attrs: Args): Response {
  if (args.resumptionToken !== undefined) {
    return errorResponse([{ code: "badResumptionToken", message: "This list is not paginated." }], attrs);
  }
  const body = SETS.map((s) => `<set>${tag("setSpec", s.spec)}${tag("setName", s.name)}</set>`).join("");
  return envelope(attrs, `<ListSets>${body}</ListSets>`);
}

async function getRecord(args: Args, attrs: Args): Promise<Response> {
  if (args.metadataPrefix !== "oai_dc") {
    return errorResponse(
      [{ code: "cannotDisseminateFormat", message: "Only oai_dc is supported." }],
      attrs
    );
  }
  const id = parseIdentifier(args.identifier);
  if (!id) return errorResponse([{ code: "idDoesNotExist", message: "Unknown identifier." }], attrs);

  const { data, error } = await baseQuery().eq("id", id).limit(1);
  if (error) return new Response("Service temporarily unavailable", { status: 503 });
  const row = (data ?? [])[0] as unknown as ThesisRow | undefined;
  if (!row) return errorResponse([{ code: "idDoesNotExist", message: "Unknown identifier." }], attrs);

  return envelope(attrs, `<GetRecord>${record(row)}</GetRecord>`);
}

async function listRecords(
  verb: "ListIdentifiers" | "ListRecords",
  args: Args,
  attrs: Args
): Promise<Response> {
  let state: TokenState;

  if (args.resumptionToken !== undefined) {
    const decoded = decodeToken(args.resumptionToken, verb);
    if (!decoded) {
      return errorResponse([{ code: "badResumptionToken", message: "Invalid or expired resumptionToken." }], attrs);
    }
    state = decoded;
  } else {
    if (args.metadataPrefix !== "oai_dc") {
      return errorResponse(
        [{ code: "cannotDisseminateFormat", message: "Only oai_dc is supported." }],
        attrs
      );
    }
    const errors: OaiError[] = [];
    const from = args.from !== undefined ? parseOaiDate(args.from) : null;
    const until = args.until !== undefined ? parseOaiDate(args.until) : null;
    if (args.from !== undefined && !from) errors.push({ code: "badArgument", message: "Invalid from date." });
    if (args.until !== undefined && !until) errors.push({ code: "badArgument", message: "Invalid until date." });
    if (from && until && from.granularity !== until.granularity) {
      errors.push({ code: "badArgument", message: "from and until must use the same granularity." });
    }
    if (from && until && from.date > until.date) {
      errors.push({ code: "badArgument", message: "from must not be later than until." });
    }
    if (errors.length) return errorResponse(errors, null);

    state = { verb, prefix: "oai_dc", from: args.from, until: args.until, set: args.set, offset: 0 };
  }

  // Unknown set → nothing matches (spec: noRecordsMatch / noSetHierarchy)
  if (state.set !== undefined && !SETS.some((s) => s.spec === state.set)) {
    return errorResponse([{ code: "noRecordsMatch", message: "No records match the request." }], attrs);
  }

  let query = baseQuery({ count: true });

  if (state.from) {
    const f = parseOaiDate(state.from)!;
    query = query.gte("updated_at", f.date.toISOString());
  }
  if (state.until) {
    const u = parseOaiDate(state.until)!;
    // until is inclusive of its whole second (or whole day) → use an exclusive upper bound
    const upper = new Date(u.date.getTime() + (u.granularity === "day" ? 86400000 : 1000));
    query = query.lt("updated_at", upper.toISOString());
  }
  if (state.set) query = query.eq("degree_type", state.set);

  const { data, count, error } = await query
    .order("updated_at", { ascending: true })
    .order("id", { ascending: true })
    .range(state.offset, state.offset + PAGE_SIZE - 1);

  if (error) return new Response("Service temporarily unavailable", { status: 503 });

  const rows = (data ?? []) as unknown as ThesisRow[];
  const total = count ?? rows.length;

  if (rows.length === 0) {
    return errorResponse([{ code: "noRecordsMatch", message: "No records match the request." }], attrs);
  }

  const nextOffset = state.offset + rows.length;
  let tokenXml = "";
  if (nextOffset < total) {
    tokenXml = `<resumptionToken completeListSize="${total}" cursor="${state.offset}">${esc(
      encodeToken({ ...state, offset: nextOffset })
    )}</resumptionToken>`;
  } else if (state.offset > 0) {
    // final page of a resumed list → empty token closes it per the spec
    tokenXml = `<resumptionToken completeListSize="${total}" cursor="${state.offset}"/>`;
  }

  const items =
    verb === "ListRecords" ? rows.map(record).join("") : rows.map(header).join("");

  return envelope(attrs, `<${verb}>${items}${tokenXml}</${verb}>`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function handle(req: NextRequest): Promise<Response> {
  const { args, repeated } = await readArgs(req);
  const verb = args.verb;

  if (!verb || !(verb in VERBS)) {
    return errorResponse([{ code: "badVerb", message: "Illegal or missing OAI verb." }], null);
  }

  const errors = validateArgs(verb, args, repeated);
  if (errors.length) return errorResponse(errors, null);

  // Echo the request's own arguments back on the <request> element.
  const attrs: Args = {};
  for (const [k, v] of Object.entries(args)) attrs[k] = v;

  try {
    switch (verb) {
      case "Identify":
        return await identify(attrs);
      case "ListMetadataFormats":
        return await listMetadataFormats(args, attrs);
      case "ListSets":
        return listSets(args, attrs);
      case "GetRecord":
        return await getRecord(args, attrs);
      case "ListIdentifiers":
      case "ListRecords":
        return await listRecords(verb, args, attrs);
    }
  } catch {
    return new Response("Service temporarily unavailable", { status: 503 });
  }
  return errorResponse([{ code: "badVerb", message: "Illegal OAI verb." }], null);
}

export const GET = handle;
export const POST = handle;
