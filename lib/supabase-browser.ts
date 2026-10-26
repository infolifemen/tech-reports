import { createClient as createSupabaseClientCore } from '@supabase/supabase-js'

const authBlockFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  if (url.includes('/auth/v1/') || url.includes('/auth/v2/')) {
    return new Response(JSON.stringify({ external: { anonymous_users: false, phone: { enabled: false }, email: { enabled: false } }, disable_signup: true, mailer: { autoconfirm: true }, user: null }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  try { return await fetch(input, init) } catch (err) { console.warn('[FetchError]', url, err); return new Response(JSON.stringify({ error: 'Network error' }), { status: 503, headers: { 'Content-Type': 'application/json' } }) }
}

// Hardcoded — these are PUBLIC keys (not secrets), protected by RLS policies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tchdcqflcfuhsgqaquzn.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjaGRjcWZsY2Z1aHNncWFxdXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzODM4NDksImV4cCI6MjEwNjk1OTg0OX0.c0Z1ILIISm0zRcY79V8tbjUKY7bzQa17RFBanaAVFnU'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedClient: any = null

export function createClient() {
  if (cachedClient) return cachedClient

  // Fail fast: detect placeholder URL (indicates env not configured)
  if (supabaseUrl.includes('placeholder') || supabaseAnonKey === 'placeholder-key') {
    const err = '[Supabase] URL/Key не настроены! Проверьте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в build env.'
    console.error(err)
    throw new Error(err)
  }

  if (typeof window !== 'undefined' && (window as any).__DEBUG_SUPABASE__) {
    console.log('[Supabase] URL:', supabaseUrl)
    console.log('[Supabase] Key:', supabaseAnonKey.slice(0, 20) + '...')
  }

  cachedClient = createSupabaseClientCore(supabaseUrl, supabaseAnonKey, {
    global: { fetch: authBlockFetch },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    db: { schema: 'public' },
    realtime: { params: { eventsPerSecond: 0 } },
  })
  return cachedClient
}

export const createSupabaseClient = createClient
