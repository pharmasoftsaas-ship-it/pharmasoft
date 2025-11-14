-- Seed Data for Demo Purposes
-- NOTE: Replace 'YOUR-TENANT-ID-HERE' and 'YOUR-USER-ID-HERE' with your actual IDs
-- You can find these by running:
-- SELECT id FROM tenants LIMIT 1;
-- SELECT id FROM users LIMIT 1;

-- Set variables (replace with your actual IDs)
DO $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  -- Purchase variables
  purchase1_id UUID;
  purchase2_id UUID;
  purchase3_id UUID;
  par_product_id UUID;
  ibu_product_id UUID;
  amo_product_id UUID;
  par_batch_id UUID;
  ibu_batch_id UUID;
  amo_batch_id UUID;
  -- Sale variables
  sale1_id UUID;
  sale2_id UUID;
  sale3_id UUID;
  sale4_id UUID;
  sale5_id UUID;
  asp_batch_id UUID;
  vit_batch_id UUID;
  par_price DECIMAL;
  ibu_price DECIMAL;
  amo_price DECIMAL;
  asp_price DECIMAL;
  vit_price DECIMAL;
BEGIN
  -- Get the first tenant and user
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  SELECT id INTO v_user_id FROM users LIMIT 1;
  
  -- If no tenant/user exists, this will fail gracefully
  IF v_tenant_id IS NULL OR v_user_id IS NULL THEN
    RAISE EXCEPTION 'Please create a tenant and user first before running seed data';
  END IF;

  -- Insert Products
  INSERT INTO products (tenant_id, sku, name, brand, barcode, critical_stock_level) VALUES
  (v_tenant_id, 'PAR-001', 'Paracetamol 500mg', 'Generic', '1234567890123', 50),
  (v_tenant_id, 'IBU-001', 'Ibuprofen 400mg', 'Generic', '1234567890124', 30),
  (v_tenant_id, 'AMO-001', 'Amoxicillin 250mg', 'Generic', '1234567890125', 20),
  (v_tenant_id, 'ASP-001', 'Aspirin 100mg', 'Generic', '1234567890126', 100),
  (v_tenant_id, 'VIT-D3', 'Vitamin D3 1000IU', 'Generic', '1234567890127', 40),
  (v_tenant_id, 'MET-001', 'Metformin 500mg', 'Generic', '1234567890128', 25),
  (v_tenant_id, 'OMEP-001', 'Omeprazole 20mg', 'Generic', '1234567890129', 35),
  (v_tenant_id, 'ATOR-001', 'Atorvastatin 10mg', 'Generic', '1234567890130', 20),
  (v_tenant_id, 'LEVO-001', 'Levofloxacin 500mg', 'Generic', '1234567890131', 15),
  (v_tenant_id, 'CET-001', 'Cetirizine 10mg', 'Generic', '1234567890132', 45)
  ON CONFLICT DO NOTHING;

  -- Insert Stock Batches (with various expiry dates)
  INSERT INTO stock_batches (tenant_id, product_id, batch_no, qty_on_hand, purchase_price, sale_price, expiry_date)
  SELECT 
    v_tenant_id,
    p.id,
    'BATCH-' || p.sku || '-001',
    CASE 
      WHEN p.sku = 'PAR-001' THEN 150
      WHEN p.sku = 'IBU-001' THEN 80
      WHEN p.sku = 'AMO-001' THEN 45
      WHEN p.sku = 'ASP-001' THEN 200
      WHEN p.sku = 'VIT-D3' THEN 60
      WHEN p.sku = 'MET-001' THEN 30
      WHEN p.sku = 'OMEP-001' THEN 70
      WHEN p.sku = 'ATOR-001' THEN 40
      WHEN p.sku = 'LEVO-001' THEN 25
      WHEN p.sku = 'CET-001' THEN 90
      ELSE 50
    END,
    CASE 
      WHEN p.sku = 'PAR-001' THEN 2.50
      WHEN p.sku = 'IBU-001' THEN 3.00
      WHEN p.sku = 'AMO-001' THEN 5.50
      WHEN p.sku = 'ASP-001' THEN 1.50
      WHEN p.sku = 'VIT-D3' THEN 4.00
      WHEN p.sku = 'MET-001' THEN 2.00
      WHEN p.sku = 'OMEP-001' THEN 3.50
      WHEN p.sku = 'ATOR-001' THEN 6.00
      WHEN p.sku = 'LEVO-001' THEN 8.00
      WHEN p.sku = 'CET-001' THEN 2.25
      ELSE 3.00
    END,
    CASE 
      WHEN p.sku = 'PAR-001' THEN 4.50
      WHEN p.sku = 'IBU-001' THEN 5.50
      WHEN p.sku = 'AMO-001' THEN 9.00
      WHEN p.sku = 'ASP-001' THEN 3.00
      WHEN p.sku = 'VIT-D3' THEN 7.50
      WHEN p.sku = 'MET-001' THEN 4.00
      WHEN p.sku = 'OMEP-001' THEN 6.50
      WHEN p.sku = 'ATOR-001' THEN 11.00
      WHEN p.sku = 'LEVO-001' THEN 15.00
      WHEN p.sku = 'CET-001' THEN 4.50
      ELSE 5.00
    END,
    CASE 
      WHEN p.sku = 'PAR-001' THEN CURRENT_DATE + INTERVAL '180 days'
      WHEN p.sku = 'IBU-001' THEN CURRENT_DATE + INTERVAL '120 days'
      WHEN p.sku = 'AMO-001' THEN CURRENT_DATE + INTERVAL '90 days'  -- Expiring soon
      WHEN p.sku = 'ASP-001' THEN CURRENT_DATE + INTERVAL '365 days'
      WHEN p.sku = 'VIT-D3' THEN CURRENT_DATE + INTERVAL '60 days'   -- Expiring soon
      WHEN p.sku = 'MET-001' THEN CURRENT_DATE + INTERVAL '45 days'  -- Expiring soon
      WHEN p.sku = 'OMEP-001' THEN CURRENT_DATE + INTERVAL '150 days'
      WHEN p.sku = 'ATOR-001' THEN CURRENT_DATE + INTERVAL '200 days'
      WHEN p.sku = 'LEVO-001' THEN CURRENT_DATE + INTERVAL '30 days'  -- Expiring soon
      WHEN p.sku = 'CET-001' THEN CURRENT_DATE + INTERVAL '100 days'
      ELSE CURRENT_DATE + INTERVAL '180 days'
    END
  FROM products p
  WHERE p.tenant_id = v_tenant_id
  ON CONFLICT DO NOTHING;

  -- Insert additional batches for some products (to test FIFO)
  INSERT INTO stock_batches (tenant_id, product_id, batch_no, qty_on_hand, purchase_price, sale_price, expiry_date)
  SELECT 
    v_tenant_id,
    p.id,
    'BATCH-' || p.sku || '-002',
    50,
    CASE p.sku
      WHEN 'PAR-001' THEN 2.75
      WHEN 'IBU-001' THEN 3.25
      WHEN 'AMO-001' THEN 6.00
      ELSE 3.00
    END,
    CASE p.sku
      WHEN 'PAR-001' THEN 5.00
      WHEN 'IBU-001' THEN 6.00
      WHEN 'AMO-001' THEN 9.50
      ELSE 5.50
    END,
    CURRENT_DATE + INTERVAL '240 days'  -- Later expiry
  FROM products p
  WHERE p.tenant_id = v_tenant_id 
    AND p.sku IN ('PAR-001', 'IBU-001', 'AMO-001')
  ON CONFLICT DO NOTHING;

  -- Insert Sample Purchases and Purchase Lines
  -- Create purchases
  INSERT INTO purchases (tenant_id, supplier_name, total_amount, created_at)
  VALUES (v_tenant_id, 'MedSupply Co.', 1250.00, CURRENT_DATE - INTERVAL '15 days')
  RETURNING id INTO purchase1_id;
  
  INSERT INTO purchases (tenant_id, supplier_name, total_amount, created_at)
  VALUES (v_tenant_id, 'Pharma Distributors', 890.50, CURRENT_DATE - INTERVAL '8 days')
  RETURNING id INTO purchase2_id;
  
  INSERT INTO purchases (tenant_id, supplier_name, total_amount, created_at)
  VALUES (v_tenant_id, 'Health Products Ltd.', 675.25, CURRENT_DATE - INTERVAL '3 days')
  RETURNING id INTO purchase3_id;

  -- Get product and batch IDs
  SELECT id INTO par_product_id FROM products WHERE tenant_id = v_tenant_id AND sku = 'PAR-001';
  SELECT id INTO ibu_product_id FROM products WHERE tenant_id = v_tenant_id AND sku = 'IBU-001';
  SELECT id INTO amo_product_id FROM products WHERE tenant_id = v_tenant_id AND sku = 'AMO-001';
  
  SELECT id INTO par_batch_id FROM stock_batches WHERE tenant_id = v_tenant_id AND product_id = par_product_id LIMIT 1;
  SELECT id INTO ibu_batch_id FROM stock_batches WHERE tenant_id = v_tenant_id AND product_id = ibu_product_id LIMIT 1;
  SELECT id INTO amo_batch_id FROM stock_batches WHERE tenant_id = v_tenant_id AND product_id = amo_product_id LIMIT 1;

  -- Insert purchase lines
  IF purchase1_id IS NOT NULL AND par_batch_id IS NOT NULL THEN
    INSERT INTO purchase_lines (purchase_id, product_id, batch_id, qty, purchase_price)
    SELECT purchase1_id, par_product_id, par_batch_id, 100, purchase_price
    FROM stock_batches WHERE id = par_batch_id;
    
    INSERT INTO purchase_lines (purchase_id, product_id, batch_id, qty, purchase_price)
    SELECT purchase1_id, ibu_product_id, ibu_batch_id, 50, purchase_price
    FROM stock_batches WHERE id = ibu_batch_id;
  END IF;

  IF purchase2_id IS NOT NULL AND amo_batch_id IS NOT NULL THEN
    INSERT INTO purchase_lines (purchase_id, product_id, batch_id, qty, purchase_price)
    SELECT purchase2_id, amo_product_id, amo_batch_id, 30, purchase_price
    FROM stock_batches WHERE id = amo_batch_id;
  END IF;

  -- Insert Sample Sales and Sale Lines
  -- Create sales
  INSERT INTO sales (tenant_id, user_id, total_amount, created_at)
  VALUES (v_tenant_id, v_user_id, 45.50, CURRENT_DATE - INTERVAL '5 days')
  RETURNING id INTO sale1_id;
  
  INSERT INTO sales (tenant_id, user_id, total_amount, created_at)
  VALUES (v_tenant_id, v_user_id, 78.00, CURRENT_DATE - INTERVAL '3 days')
  RETURNING id INTO sale2_id;
  
  INSERT INTO sales (tenant_id, user_id, total_amount, created_at)
  VALUES (v_tenant_id, v_user_id, 125.75, CURRENT_DATE - INTERVAL '1 day')
  RETURNING id INTO sale3_id;
  
  INSERT INTO sales (tenant_id, user_id, total_amount, created_at)
  VALUES (v_tenant_id, v_user_id, 92.25, CURRENT_DATE - INTERVAL '12 hours')
  RETURNING id INTO sale4_id;
  
  INSERT INTO sales (tenant_id, user_id, total_amount, created_at)
  VALUES (v_tenant_id, v_user_id, 156.50, CURRENT_DATE - INTERVAL '2 hours')
  RETURNING id INTO sale5_id;

  -- Get batch IDs (FIFO - earliest expiry first) - reusing par_batch_id, ibu_batch_id, amo_batch_id
  SELECT sb.id, sb.sale_price INTO par_batch_id, par_price
  FROM stock_batches sb
  JOIN products p ON p.id = sb.product_id
  WHERE p.tenant_id = v_tenant_id AND p.sku = 'PAR-001' AND sb.qty_on_hand > 0
  ORDER BY sb.expiry_date, sb.created_at LIMIT 1;
  
  SELECT sb.id, sb.sale_price INTO ibu_batch_id, ibu_price
  FROM stock_batches sb
  JOIN products p ON p.id = sb.product_id
  WHERE p.tenant_id = v_tenant_id AND p.sku = 'IBU-001' AND sb.qty_on_hand > 0
  ORDER BY sb.expiry_date, sb.created_at LIMIT 1;
  
  SELECT sb.id, sb.sale_price INTO amo_batch_id, amo_price
  FROM stock_batches sb
  JOIN products p ON p.id = sb.product_id
  WHERE p.tenant_id = v_tenant_id AND p.sku = 'AMO-001' AND sb.qty_on_hand > 0
  ORDER BY sb.expiry_date, sb.created_at LIMIT 1;
  
  SELECT sb.id, sb.sale_price INTO asp_batch_id, asp_price
  FROM stock_batches sb
  JOIN products p ON p.id = sb.product_id
  WHERE p.tenant_id = v_tenant_id AND p.sku = 'ASP-001' AND sb.qty_on_hand > 0
  ORDER BY sb.expiry_date, sb.created_at LIMIT 1;
  
  SELECT sb.id, sb.sale_price INTO vit_batch_id, vit_price
  FROM stock_batches sb
  JOIN products p ON p.id = sb.product_id
  WHERE p.tenant_id = v_tenant_id AND p.sku = 'VIT-D3' AND sb.qty_on_hand > 0
  ORDER BY sb.expiry_date, sb.created_at LIMIT 1;

  -- Insert sale lines and update stock
  IF sale1_id IS NOT NULL AND par_batch_id IS NOT NULL THEN
    INSERT INTO sale_lines (sale_id, product_id, batch_id, qty, unit_price, line_total)
    SELECT sale1_id, product_id, par_batch_id, 5, par_price, par_price * 5
    FROM stock_batches WHERE id = par_batch_id;
    
    UPDATE stock_batches SET qty_on_hand = qty_on_hand - 5 WHERE id = par_batch_id;
  END IF;

  IF sale2_id IS NOT NULL AND ibu_batch_id IS NOT NULL AND amo_batch_id IS NOT NULL THEN
    INSERT INTO sale_lines (sale_id, product_id, batch_id, qty, unit_price, line_total)
    SELECT sale2_id, product_id, ibu_batch_id, 3, ibu_price, ibu_price * 3
    FROM stock_batches WHERE id = ibu_batch_id;
    
    INSERT INTO sale_lines (sale_id, product_id, batch_id, qty, unit_price, line_total)
    SELECT sale2_id, product_id, amo_batch_id, 2, amo_price, amo_price * 2
    FROM stock_batches WHERE id = amo_batch_id;
    
    UPDATE stock_batches SET qty_on_hand = qty_on_hand - 3 WHERE id = ibu_batch_id;
    UPDATE stock_batches SET qty_on_hand = qty_on_hand - 2 WHERE id = amo_batch_id;
  END IF;

  IF sale3_id IS NOT NULL AND par_batch_id IS NOT NULL AND asp_batch_id IS NOT NULL AND vit_batch_id IS NOT NULL THEN
    INSERT INTO sale_lines (sale_id, product_id, batch_id, qty, unit_price, line_total)
    SELECT sale3_id, product_id, par_batch_id, 4, par_price, par_price * 4
    FROM stock_batches WHERE id = par_batch_id;
    
    INSERT INTO sale_lines (sale_id, product_id, batch_id, qty, unit_price, line_total)
    SELECT sale3_id, product_id, asp_batch_id, 6, asp_price, asp_price * 6
    FROM stock_batches WHERE id = asp_batch_id;
    
    INSERT INTO sale_lines (sale_id, product_id, batch_id, qty, unit_price, line_total)
    SELECT sale3_id, product_id, vit_batch_id, 3, vit_price, vit_price * 3
    FROM stock_batches WHERE id = vit_batch_id;
    
    UPDATE stock_batches SET qty_on_hand = qty_on_hand - 4 WHERE id = par_batch_id;
    UPDATE stock_batches SET qty_on_hand = qty_on_hand - 6 WHERE id = asp_batch_id;
    UPDATE stock_batches SET qty_on_hand = qty_on_hand - 3 WHERE id = vit_batch_id;
  END IF;

  -- Insert Accounting Entries
  INSERT INTO accounting_entries (tenant_id, type, category, amount, note, created_at)
  VALUES
  (v_tenant_id, 'income', 'Sales', 2847.50, 'Daily sales revenue', CURRENT_DATE),
  (v_tenant_id, 'expense', 'Rent', 1200.00, 'Monthly pharmacy rent', CURRENT_DATE - INTERVAL '5 days'),
  (v_tenant_id, 'expense', 'Utilities', 350.00, 'Electricity and water', CURRENT_DATE - INTERVAL '3 days'),
  (v_tenant_id, 'expense', 'Staff Salary', 2500.00, 'Monthly staff salaries', CURRENT_DATE - INTERVAL '1 day'),
  (v_tenant_id, 'income', 'Consultation', 450.00, 'Doctor consultation fees', CURRENT_DATE - INTERVAL '2 days')
  ON CONFLICT DO NOTHING;

  -- Insert Sample Notifications (for expiring products)
  INSERT INTO notifications (tenant_id, type, message, status, created_at)
  VALUES
  (v_tenant_id, 'expiry', 'Product Amoxicillin 250mg (Batch: BATCH-AMO-001-001) expires on ' || (CURRENT_DATE + INTERVAL '90 days')::text || '. Quantity: 45', 'unread', CURRENT_DATE - INTERVAL '2 days'),
  (v_tenant_id, 'expiry', 'Product Vitamin D3 1000IU (Batch: BATCH-VIT-D3-001) expires on ' || (CURRENT_DATE + INTERVAL '60 days')::text || '. Quantity: 60', 'unread', CURRENT_DATE - INTERVAL '1 day'),
  (v_tenant_id, 'expiry', 'Product Metformin 500mg (Batch: BATCH-MET-001-001) expires on ' || (CURRENT_DATE + INTERVAL '45 days')::text || '. Quantity: 30', 'unread', CURRENT_DATE)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seed data inserted successfully for tenant: %', v_tenant_id;
END $$;

