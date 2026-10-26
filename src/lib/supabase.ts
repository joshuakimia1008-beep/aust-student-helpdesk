import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const backendMode = import.meta.env.VITE_BACKEND_MODE ?? "demo";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseMode = backendMode === "supabase";

if (isSupabaseMode && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error(
    "Supabase mode is on, but VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. Check your .env.local file.",
  );
}

export const supabase: SupabaseClient | null =
  isSupabaseMode && supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      })
    : null;
