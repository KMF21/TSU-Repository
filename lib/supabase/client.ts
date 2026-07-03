"use client";

import { createClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";

/**
 * Client-side Supabase hook, scoped to the signed-in Clerk user.
 * Same third-party auth pattern as the server client — see server.ts.
 *
 * Usage in a client component:
 *   const supabase = useSupabaseClient();
 *   const { data } = await supabase.from("theses").select("*");
 */
export function useSupabaseClient() {
  const { session } = useSession();

  return useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          fetch: async (url, options = {}) => {
            const clerkToken = await session?.getToken();
            const headers = new Headers(options?.headers);
            if (clerkToken) {
              headers.set("Authorization", `Bearer ${clerkToken}`);
            }
            return fetch(url, { ...options, headers });
          },
        },
      }
    );
  }, [session]);
}
