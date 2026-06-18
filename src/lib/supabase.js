import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  document.body.innerHTML = '<div style="font-family:sans-serif;padding:2rem;color:#c00">Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.</div>'
  throw new Error('Supabase env vars not set')
}

export const supabase = createClient(url, key)
