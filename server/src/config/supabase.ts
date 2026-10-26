import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { config } from "./env.js"

let supabaseClient: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient

  if (config.supabaseUrl && config.supabaseServiceRoleKey) {
    try {
      supabaseClient = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
      return supabaseClient
    } catch (err) {
      console.warn("⚠️ Failed to initialize Supabase Admin client:", err)
      return null
    }
  }
  return null
}

export function isSupabaseConfigured(): boolean {
  return Boolean(config.supabaseUrl && (config.supabaseAnonKey || config.supabaseServiceRoleKey))
}
