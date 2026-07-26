import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const DEFAULT_URL = "https://ljpneuttfgeektoabgnz.supabase.co";
const DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcG5ldXR0ZmdlZWt0b2FiZ256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MTkyMTcsImV4cCI6MjEwMDE5NTIxN30.NxFAGndnqq10nBLG6RrZM7ex8bbTyZNgIKPoycCbM0w";

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = (envUrl && typeof envUrl === "string" && envUrl.trim()) ? envUrl.trim() : DEFAULT_URL;
const supabaseAnonKey = (envKey && typeof envKey === "string" && envKey.trim()) ? envKey.trim() : DEFAULT_KEY;

export const supabase = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    },
);
