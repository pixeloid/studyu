import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Get a setting value from the database, with env var fallback.
 * For API keys: checks DB first, then falls back to environment variable.
 */
export async function getSetting<T = string>(key: string, envFallback?: string): Promise<T | null> {
  try {
    const { data } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', key)
      .single()

    if (data?.value !== undefined && data.value !== null && data.value !== '') {
      return data.value as T
    }
  } catch {
    // DB read failed, fall through to env fallback
  }

  if (envFallback && process.env[envFallback]) {
    return process.env[envFallback] as T
  }

  return null
}
