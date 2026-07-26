import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
    // eslint-disable-next-line no-console
    console.warn(
        "[BK Store] Missing Supabase credentials. Copy .env.local.example to .env.local and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
}

/**
 * The single Supabase browser client used across the app.
 * Uses the anon key only (RLS-protected). The service_role key is NEVER
 * shipped to the client — it lives only in Edge Functions.
 */
export const supabase = createClient<Database>(
    supabaseUrl ?? "https://placeholder.supabase.co",
    supabaseAnonKey ?? "placeholder-anon-key",
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    },
);
