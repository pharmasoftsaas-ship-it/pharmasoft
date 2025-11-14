import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key'
  
  // Use valid URL format for preview mode
  const finalUrl = (url === 'your_supabase_project_url' || !url.startsWith('http')) 
    ? 'https://dummy.supabase.co' 
    : url
  
  return createBrowserClient<Database>(finalUrl, key)
}

