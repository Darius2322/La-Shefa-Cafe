import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY. Never import this file from a "use client" component —
// it uses the service role key, which must never reach the browser bundle.
// Requires SUPABASE_SERVICE_ROLE_KEY to be set as a (non-NEXT_PUBLIC) env var
// in the Vercel project settings — get it from Supabase Dashboard →
// Project Settings → API → service_role secret.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export function getSupabaseAdmin() {
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it in Vercel project env vars (server-only, not NEXT_PUBLIC_)."
    );
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
