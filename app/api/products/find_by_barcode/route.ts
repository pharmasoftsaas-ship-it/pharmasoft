import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFIFOBatch } from '@/lib/fifo'

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
    const barcode = searchParams.get('code')

    if (!barcode) {
      return NextResponse.json({ error: 'Barcode required' }, { status: 400 })
    }

    // Find product by barcode
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .eq('barcode', barcode)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get FIFO batch
    const batch = await getFIFOBatch(userData.tenant_id, product.id, 1)

    if (!batch) {
      return NextResponse.json(
        { error: 'No stock available', product },
        { status: 404 }
      )
    }

    return NextResponse.json({
      product,
      batch: {
        id: batch.batch_id,
        batch_no: batch.batch_no,
        available_qty: batch.available_qty,
        purchase_price: batch.purchase_price,
        sale_price: batch.sale_price,
        expiry_date: batch.expiry_date,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

