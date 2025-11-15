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
    const period = searchParams.get('period') || 'daily'

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'daily':
        startDate = new Date(now)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'weekly':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case 'monthly':
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
        break
      default:
        startDate = new Date(now)
        startDate.setHours(0, 0, 0, 0)
    }

    // Get sales
    const { data: sales } = await supabase
      .from('sales')
      .select('id, total_amount, created_at')
      .eq('tenant_id', userData.tenant_id)
      .gte('created_at', startDate.toISOString())

    const totalSales = sales?.length || 0
    const revenue = sales?.reduce((sum, s) => sum + s.total_amount, 0) || 0

    // Get sale lines for units sold and profit calculation
    const saleIds = sales?.map(s => s.id) || []
    let unitsSold = 0
    let totalCost = 0

    if (saleIds.length > 0) {
      const { data: saleLines } = await supabase
        .from('sale_lines')
        .select('qty, unit_price, batch_id')
        .in('sale_id', saleIds)

      unitsSold = saleLines?.reduce((sum, sl) => sum + sl.qty, 0) || 0

      // Calculate profit (revenue - cost)
      if (saleLines) {
        for (const line of saleLines) {
          const { data: batch } = await supabase
            .from('stock_batches')
            .select('purchase_price')
            .eq('id', line.batch_id)
            .single()

          if (batch) {
            totalCost += line.qty * batch.purchase_price
          }
        }
      }
    }

    const profit = revenue - totalCost

    // Get top products
    const { data: topProductsData } = await supabase
      .from('sale_lines')
      .select('product_id, qty')
      .in('sale_id', saleIds)

    const productSales = new Map<string, number>()
    topProductsData?.forEach(line => {
      const current = productSales.get(line.product_id) || 0
      productSales.set(line.product_id, current + line.qty)
    })

    const topProductsArray = Array.from(productSales.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    const topProducts = await Promise.all(
      topProductsArray.map(async ([productId, qty]) => {
        const { data: product } = await supabase
          .from('products')
          .select('name')
          .eq('id', productId)
          .single()

        return {
          name: product?.name || 'Unknown',
          qty,
        }
      })
    )

    // Inventory valuation
    const { data: batches } = await supabase
      .from('stock_batches')
      .select('qty_on_hand, purchase_price')
      .eq('tenant_id', userData.tenant_id)
      .gt('qty_on_hand', 0)

    const inventoryValuation =
      batches?.reduce((sum, b) => sum + b.qty_on_hand * b.purchase_price, 0) || 0

    // Expiring items
    const { data: tenant } = await supabase
      .from('tenants')
      .select('near_expiry_days')
      .eq('id', userData.tenant_id)
      .single()

    const expiryThreshold = tenant?.near_expiry_days || 30
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + expiryThreshold)

    const { count: expiringItems } = await supabase
      .from('stock_batches')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', userData.tenant_id)
      .gt('qty_on_hand', 0)
      .lte('expiry_date', expiryDate.toISOString().split('T')[0])
      .gt('expiry_date', new Date().toISOString().split('T')[0])

    return NextResponse.json({
      total_sales: totalSales,
      revenue,
      profit,
      units_sold: unitsSold,
      top_products: topProducts,
      inventory_valuation: inventoryValuation,
      expiring_items: expiringItems || 0,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

