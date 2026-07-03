import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

// Default tenant for this single-tenant deployment (TSU).
// Multi-tenant lookup by domain/slug can replace this once we onboard
// a second institution.
const TENANT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG ?? "tsu";

type ClerkUserEvent = {
  type: string;
  data: {
    id: string;
    email_addresses: { id: string; email_address: string }[];
    primary_email_address_id: string;
    first_name: string | null;
    last_name: string | null;
    public_metadata?: { matric_number?: string; role?: string };
  };
};

export async function POST(req: Request) {
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!signingSecret) {
    return NextResponse.json(
      { error: "Webhook signing secret not configured" },
      { status: 500 }
    );
  }

  // --- Verify the webhook signature (svix headers) before trusting the payload ---
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(signingSecret);

  let evt: ClerkUserEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // --- Only user.created / user.updated need to sync ---
  if (evt.type !== "user.created" && evt.type !== "user.updated") {
    return NextResponse.json({ received: true });
  }

  const { id, email_addresses, primary_email_address_id, first_name, last_name, public_metadata } =
    evt.data;

  const primaryEmail =
    email_addresses.find((e) => e.id === primary_email_address_id)?.email_address ??
    email_addresses[0]?.email_address;

  if (!primaryEmail) {
    return NextResponse.json({ error: "No email on Clerk user" }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();

  // Resolve tenant id from slug
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", TENANT_SLUG)
    .single();

  if (tenantError || !tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 500 });
  }

  const fullName = [first_name, last_name].filter(Boolean).join(" ") || primaryEmail;

  // Role is never trusted from the client — it's only ever set here from
  // Clerk's public_metadata, which only an admin can edit via the Clerk
  // dashboard or a protected server action. Defaults to "student".
  const role = public_metadata?.role === "admin" ? "admin" : "student";

  const { error: upsertError } = await supabase.from("users").upsert(
    {
      clerk_id: id,
      tenant_id: tenant.id,
      full_name: fullName,
      email: primaryEmail,
      role,
      matric_number: public_metadata?.matric_number ?? null,
    },
    { onConflict: "clerk_id" }
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
