import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Browser client configured to target the `assembleat` schema.
 * Sends `Accept-Profile: assembleat` on every request.
 *
 * Requires PostgREST to expose the schema:
 *   PGRST_DB_SCHEMAS=public,assembleat  (in docker-compose or Supabase dashboard)
 *
 * Falls back gracefully if the schema is not exposed — queries will return
 * empty results and the app continues with localStorage.
 */
export function createAssembleatClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: 'assembleat' } }
  );
}
