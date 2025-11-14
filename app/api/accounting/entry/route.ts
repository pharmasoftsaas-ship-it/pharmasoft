import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Type assertion: user.id is string (UUID), users.id is also string (UUID)
    const userId: string = user.id

    const { data: userData } = await supabase
      .from('users')
      .select('id, tenant_id')
      .eq('id', userId)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { type, category, amount, note } = body

    if (!type || !category || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid entry data' }, { status: 400 })
    }

    if (type !== 'income' && type !== 'expense') {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const { data: entry, error: entryError } = await supabase
      .from('accounting_entries')
      .insert({
        tenant_id: userData.tenant_id,
        type,
        category,
        amount,
        note: note || null,
      })
      .select()
      .single()

    if (entryError || !entry) {
      return NextResponse.json(
        { error: 'Failed to create entry', details: entryError },
        { status: 500 }
      )
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      tenant_id: userData.tenant_id,
      user_id: userId,
      action: 'create',
      entity: 'accounting_entry',
      entity_id: entry.id,
      payload: { type, category, amount },
    })

    return NextResponse.json({ success: true, entry_id: entry.id })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

