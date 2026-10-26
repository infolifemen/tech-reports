import { createClient as createSupabaseClientCore } from '@supabase/supabase-js'

const authBlockFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  if (url.includes('/auth/v1/') || url.includes('/auth/v2/')) {
    return new Response(JSON.stringify({ external: { anonymous_users: false, phone: { enabled: false }, email: { enabled: false } }, disable_signup: true, mailer: { autoconfirm: true }, user: null }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  try { return await fetch(input, init) } catch (err) { console.warn('[FetchError]', url, err); return new Response(JSON.stringify({ error: 'Network error' }), { status: 503, headers: { 'Content-Type': 'application/json' } }) }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let cachedClient: any = null

export function createClient() {
  if (cachedClient) return cachedClient
  const url = supabaseUrl || 'https://placeholder.supabase.co'
  const key = supabaseAnonKey || 'placeholder-key'
  cachedClient = createSupabaseClientCore(url, key, {
    global: { fetch: authBlockFetch },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    db: { schema: 'public' },
    realtime: { params: { eventsPerSecond: 0 } },
  })
  return cachedClient
}

export const createSupabaseClient = createClient
