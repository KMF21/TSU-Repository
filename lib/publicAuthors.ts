import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

/**
 * Resolves author display names for theses the caller has ALREADY been
 * allowed to see through RLS.
 *
 * Why this exists: the `users` table is (correctly) private under RLS, so an
 * embedded `author:users(...)` join comes back null for signed-out visitors.
 * That would leave public pages, and Googlebot, with no author name. The
 * author IDs passed in here always come from a theses query that RLS has
 * already filtered, and only `full_name` is returned, never email or matric.
 */
export async function getAuthorNames(authorIds: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(authorIds.filter(Boolean)));
  if (unique.length === 0) return {};

  const service = createServiceRoleSupabaseClient();
  const { data } = await service.from("users").select("id, full_name").in("id", unique);

  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.id] = row.full_name;
  return map;
}
