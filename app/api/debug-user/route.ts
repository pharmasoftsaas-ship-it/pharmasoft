import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  console.log("USER:", user)
  console.log("USER ID TYPE:", typeof user?.id)
  console.log("USER ID VALUE:", user?.id)

  return Response.json({ type: typeof user?.id, value: user?.id })
}

