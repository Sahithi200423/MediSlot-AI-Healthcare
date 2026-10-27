import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ""

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

// Initialize Supabase browser client if keys provided, otherwise safe null
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null
