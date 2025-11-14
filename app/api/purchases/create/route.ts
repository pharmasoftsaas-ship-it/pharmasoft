import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const { supplier_name, items } = body

    if (!supplier_name || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid purchase data' }, { status: 400 })
    }

    // Calculate total amount
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.qty * item.purchase_price,
      0
    )

    // Create purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        tenant_id: userData.tenant_id,
        supplier_name,
        total_amount: totalAmount,
      })
      .select()
      .single()

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { error: 'Failed to create purchase', details: purchaseError },
        { status: 500 }
      )
    }

    // Create stock batches and purchase lines
    const purchaseLines: any[] = []

    for (const item of items) {
      const {
        product_id,
        batch_no,
        qty,
        purchase_price,
        sale_price,
        expiry_date,
      } = item

      // Check if batch exists
      const { data: existingBatch } = await supabase
        .from('stock_batches')
        .select('id, qty_on_hand')
        .eq('tenant_id', userData.tenant_id)
        .eq('product_id', product_id)
        .eq('batch_no', batch_no)
        .single()

      let batchId: string

      if (existingBatch) {
        // Update existing batch
        const { data: updatedBatch, error: updateError } = await supabase
          .from('stock_batches')
          .update({
            qty_on_hand: existingBatch.qty_on_hand + qty,
            purchase_price,
            sale_price,
            expiry_date,
          })
          .eq('id', existingBatch.id)
          .select()
          .single()

        if (updateError || !updatedBatch) {
          return NextResponse.json(
            { error: 'Failed to update batch', details: updateError },
            { status: 500 }
          )
        }

        batchId = updatedBatch.id
      } else {
        // Create new batch
        const { data: newBatch, error: batchError } = await supabase
          .from('stock_batches')
          .insert({
            tenant_id: userData.tenant_id,
            product_id,
            batch_no,
            qty_on_hand: qty,
            purchase_price,
            sale_price,
            expiry_date,
          })
          .select()
          .single()

        if (batchError || !newBatch) {
          return NextResponse.json(
            { error: 'Failed to create batch', details: batchError },
            { status: 500 }
          )
        }

        batchId = newBatch.id
      }

      purchaseLines.push({
        purchase_id: purchase.id,
        product_id,
        batch_id: batchId,
        qty,
        purchase_price,
      })
    }

    // Create purchase lines
    const { error: linesError } = await supabase
      .from('purchase_lines')
      .insert(purchaseLines)

    if (linesError) {
      return NextResponse.json(
        { error: 'Failed to create purchase lines', details: linesError },
        { status: 500 }
      )
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      tenant_id: userData.tenant_id,
      user_id: userId,
      action: 'create',
      entity: 'purchase',
      entity_id: purchase.id,
      payload: { supplier_name, total_amount: totalAmount, items_count: items.length },
    })

    return NextResponse.json({ success: true, purchase_id: purchase.id })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

