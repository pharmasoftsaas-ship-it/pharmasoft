-- Function to get FIFO batch for a product
CREATE OR REPLACE FUNCTION get_fifo_batch(
  p_tenant_id UUID,
  p_product_id UUID,
  p_qty INTEGER
)
RETURNS TABLE (
  batch_id UUID,
  batch_no TEXT,
  available_qty INTEGER,
  purchase_price DECIMAL(10, 2),
  sale_price DECIMAL(10, 2),
  expiry_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sb.id,
    sb.batch_no,
    sb.qty_on_hand,
    sb.purchase_price,
    sb.sale_price,
    sb.expiry_date
  FROM stock_batches sb
  WHERE sb.tenant_id = p_tenant_id
    AND sb.product_id = p_product_id
    AND sb.qty_on_hand > 0
  ORDER BY sb.expiry_date ASC, sb.created_at ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct stock from batch
CREATE OR REPLACE FUNCTION deduct_stock(
  p_batch_id UUID,
  p_qty INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_qty INTEGER;
BEGIN
  SELECT qty_on_hand INTO current_qty
  FROM stock_batches
  WHERE id = p_batch_id;
  
  IF current_qty < p_qty THEN
    RETURN FALSE;
  END IF;
  
  UPDATE stock_batches
  SET qty_on_hand = qty_on_hand - p_qty
  WHERE id = p_batch_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check expiring batches
CREATE OR REPLACE FUNCTION check_expiring_batches()
RETURNS VOID AS $$
DECLARE
  tenant_rec RECORD;
  batch_rec RECORD;
BEGIN
  FOR tenant_rec IN SELECT id, near_expiry_days FROM tenants LOOP
    FOR batch_rec IN
      SELECT 
        sb.id,
        sb.tenant_id,
        p.name as product_name,
        sb.batch_no,
        sb.expiry_date,
        sb.qty_on_hand
      FROM stock_batches sb
      JOIN products p ON p.id = sb.product_id
      WHERE sb.tenant_id = tenant_rec.id
        AND sb.qty_on_hand > 0
        AND sb.expiry_date <= (CURRENT_DATE + (tenant_rec.near_expiry_days || ' days')::INTERVAL)
        AND sb.expiry_date > CURRENT_DATE
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.tenant_id = sb.tenant_id
            AND n.type = 'expiry'
            AND n.message LIKE '%' || sb.batch_no || '%'
            AND n.status = 'unread'
            AND n.created_at > CURRENT_DATE - INTERVAL '1 day'
        )
    LOOP
      INSERT INTO notifications (tenant_id, type, message, status)
      VALUES (
        batch_rec.tenant_id,
        'expiry',
        format('Product %s (Batch: %s) expires on %s. Quantity: %s', 
          batch_rec.product_name,
          batch_rec.batch_no,
          batch_rec.expiry_date,
          batch_rec.qty_on_hand
        ),
        'unread'
      );
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

