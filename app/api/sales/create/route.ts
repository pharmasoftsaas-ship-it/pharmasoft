import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFIFOBatch, deductStock } from '@/lib/fifo'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    const { items } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 })
    }

    // Validate and process items with FIFO
    const saleLines: any[] = []
    let totalAmount = 0

    for (const item of items) {
      const { product_id, qty, unit_price } = item

      // Get FIFO batch
      const batch = await getFIFOBatch(userData.tenant_id, product_id, qty)

      if (!batch) {
        return NextResponse.json(
          { error: `No stock available for product ${product_id}` },
          { status: 400 }
        )
      }

      if (batch.available_qty < qty) {
        return NextResponse.json(
          { error: `Insufficient stock. Available: ${batch.available_qty}, Requested: ${qty}` },
          { status: 400 }
        )
      }

      // Deduct stock
      const deducted = await deductStock(batch.batch_id, qty)
      if (!deducted) {
        return NextResponse.json(
          { error: 'Failed to deduct stock' },
          { status: 500 }
        )
      }

      const lineTotal = qty * unit_price
      totalAmount += lineTotal

      saleLines.push({
        product_id,
        batch_id: batch.batch_id,
        qty,
        unit_price,
        line_total: lineTotal,
      })
    }

    // Create sale
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        tenant_id: userData.tenant_id,
        user_id: userId,
        total_amount: totalAmount,
      })
      .select()
      .single()

    if (saleError || !sale) {
      return NextResponse.json(
        { error: 'Failed to create sale', details: saleError },
        { status: 500 }
      )
    }

    // Create sale lines
    const saleLinesData = saleLines.map(line => ({
      ...line,
      sale_id: sale.id,
    }))

    const { error: linesError } = await supabase
      .from('sale_lines')
      .insert(saleLinesData)

    if (linesError) {
      return NextResponse.json(
        { error: 'Failed to create sale lines', details: linesError },
        { status: 500 }
      )
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      tenant_id: userData.tenant_id,
      user_id: user.id,
      action: 'create',
      entity: 'sale',
      entity_id: sale.id,
      payload: { total_amount: totalAmount, items_count: saleLines.length },
    })

    return NextResponse.json({ success: true, sale_id: sale.id })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

