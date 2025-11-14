import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

type Batch = Database['public']['Functions']['get_fifo_batch']['Returns'][0]

export async function getFIFOBatch(
  tenantId: string,
  productId: string,
  qty: number
): Promise<Batch | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('get_fifo_batch', {
    p_tenant_id: tenantId,
    p_product_id: productId,
    p_qty: qty,
  })

  if (error || !data || data.length === 0) {
    return null
  }

  return data[0]
}

export async function deductStock(
  batchId: string,
  qty: number
): Promise<boolean> {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('deduct_stock', {
    p_batch_id: batchId,
    p_qty: qty,
  })

  if (error || !data) {
    return false
  }

  return data
}

