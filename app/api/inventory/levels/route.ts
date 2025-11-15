import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id, tenant_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const lowStock = searchParams.get('low_stock') === 'true'
    const nearExpiry = searchParams.get('near_expiry') === 'true'
    const productId = searchParams.get('product_id')

    // Build query
    let query = supabase
      .from('stock_batches')
      .select(`
        *,
        products (
          id,
          name,
          sku,
          barcode,
          critical_stock_level
        )
      `)
      .eq('tenant_id', userData.tenant_id)
      .gt('qty_on_hand', 0)

    if (productId) {
      query = query.eq('product_id', productId)
    }

    const { data: batches, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch inventory', details: error },
        { status: 500 }
      )
    }

    if (!batches) {
      return NextResponse.json({ data: [] })
    }

    // Get tenant expiry threshold
    const { data: tenant } = await supabase
      .from('tenants')
      .select('near_expiry_days')
      .eq('id', userData.tenant_id)
      .single()

    const expiryThreshold = tenant?.near_expiry_days || 30
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + expiryThreshold)

    // Filter results
    let filteredBatches = batches

    if (lowStock) {
      filteredBatches = filteredBatches.filter((batch: any) => {
        const totalStock = batches
          .filter((b: any) => b.product_id === batch.product_id)
          .reduce((sum: number, b: any) => sum + b.qty_on_hand, 0)
        return totalStock <= batch.products?.critical_stock_level || 0
      })
    }

    if (nearExpiry) {
      filteredBatches = filteredBatches.filter((batch: any) => {
        const batchExpiry = new Date(batch.expiry_date)
        return (
          batchExpiry <= expiryDate &&
          batchExpiry > new Date()
        )
      })
    }

    // Aggregate by product
    const productMap = new Map()
    filteredBatches.forEach((batch: any) => {
      const productId = batch.product_id
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          product_id: productId,
          product_name: batch.products?.name || 'Unknown',
          sku: batch.products?.sku || '',
          barcode: batch.products?.barcode || null,
          total_stock: 0,
          batches: [],
        })
      }

      const product = productMap.get(productId)
      product.total_stock += batch.qty_on_hand
      product.batches.push({
        batch_id: batch.id,
        batch_no: batch.batch_no,
        qty_on_hand: batch.qty_on_hand,
        purchase_price: batch.purchase_price,
        sale_price: batch.sale_price,
        expiry_date: batch.expiry_date,
      })
    })

    return NextResponse.json({
      data: Array.from(productMap.values()),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

