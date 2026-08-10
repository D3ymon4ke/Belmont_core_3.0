import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wlqorxvcrfpmvvhxgjiy.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndscW9yeHZjcmZwbXZ2aHhnaml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDA4NTYsImV4cCI6MjEwMTc3Njg1Nn0.AOIrgkie7Y8PXBTF09j6BiR6yCFmV_ly0AbvF7iT-rk'

export function createClient() {
  return createBrowserClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  )
}
