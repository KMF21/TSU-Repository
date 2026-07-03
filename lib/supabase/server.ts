import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

/**
 * Server-side Supabase client, scoped to the signed-in Clerk user.
 *
 * Uses Supabase's native third-party auth integration: the Clerk session
 * token is passed straight through as the Supabase access token on every
 * request, so RLS policies evaluate against the real, verified Clerk
 * identity (auth.jwt() ->> 'sub') — no custom JWT template required.
 *
 * Requires: Supabase Dashboard > Authentication > Sign In / Providers >
 * Third Party Auth > Clerk, configured with your Clerk instance domain.
 * See SETUP.md, step 1.
 */
export async function createServerSupabaseClient() {
  const { getToken } = await auth();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          const clerkToken = await getToken();
          const headers = new Headers(options?.headers);
          if (clerkToken) {
            headers.set("Authorization", `Bearer ${clerkToken}`);
          }
          return fetch(url, { ...options, headers });
        },
      },
    }
  );
}

/**
 * Service-role Supabase client. Bypasses RLS entirely.
 * Use ONLY in trusted server contexts: the Clerk webhook handler,
 * and system-level writes like audit_log entries.
 * Never import this into anything reachable from client code.
 */
export function createServiceRoleSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
