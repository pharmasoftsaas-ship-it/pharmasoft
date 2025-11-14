import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { near_expiry_days } = body

    if (!near_expiry_days || near_expiry_days < 1 || near_expiry_days > 180) {
      return NextResponse.json(
        { error: 'near_expiry_days must be between 1 and 180' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('tenants')
      .update({ near_expiry_days })
      .eq('id', userData.tenant_id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update settings', details: updateError },
        { status: 500 }
      )
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      tenant_id: userData.tenant_id,
      user_id: user.id,
      action: 'update',
      entity: 'tenant_settings',
      payload: { near_expiry_days },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

