import { currentUser } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * TEMPORARY verification screen — not a real dashboard.
 * Confirms three things work together:
 *   1. Clerk session exists
 *   2. The webhook synced this user into the Supabase `users` table
 *   3. RLS correctly returns exactly one row: this user's own record
 * Delete/replace once the real dashboard is built.
 */
export default async function DashboardPage() {
  const user = await currentUser();
  const supabase = await createServerSupabaseClient();

  const { data: profile, error } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user?.id ?? "")
    .single();

  return (
    <main className="p-8 space-y-4">
      <h1 className="text-xl font-semibold">Auth wiring check</h1>
      <div>
        <p>Clerk session user id: {user?.id ?? "none"}</p>
        <p>Clerk email: {user?.primaryEmailAddress?.emailAddress ?? "none"}</p>
      </div>
      <div>
        <p className="font-medium">Supabase `users` row (via RLS):</p>
        {error && <p className="text-red-600">Error: {error.message}</p>}
        {profile && (
          <pre className="bg-gray-100 p-4 rounded text-sm">
            {JSON.stringify(profile, null, 2)}
          </pre>
        )}
        {!profile && !error && <p>No row found — webhook sync may not have run yet.</p>}
      </div>
    </main>
  );
}
