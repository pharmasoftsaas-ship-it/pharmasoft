-- Enable Row Level Security on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get tenant_id from users table
CREATE OR REPLACE FUNCTION tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can view users in their tenant" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can manage products in their tenant" ON products;
DROP POLICY IF EXISTS "Users can manage stock batches in their tenant" ON stock_batches;
DROP POLICY IF EXISTS "Users can manage purchases in their tenant" ON purchases;
DROP POLICY IF EXISTS "Users can manage purchase lines in their tenant" ON purchase_lines;
DROP POLICY IF EXISTS "Users can manage sales in their tenant" ON sales;
DROP POLICY IF EXISTS "Users can manage sale lines in their tenant" ON sale_lines;
DROP POLICY IF EXISTS "Users can manage accounting entries in their tenant" ON accounting_entries;
DROP POLICY IF EXISTS "Users can view audit logs in their tenant" ON audit_logs;
DROP POLICY IF EXISTS "Users can manage notifications in their tenant" ON notifications;

-- Tenants policies
CREATE POLICY "Users can view their own tenant"
  ON tenants FOR SELECT
  USING (id = tenant_id());

-- Users policies
CREATE POLICY "Users can view users in their tenant"
  ON users FOR SELECT
  USING (tenant_id = tenant_id());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (tenant_id = tenant_id() AND id = auth.uid());

-- Products policies
CREATE POLICY "Users can manage products in their tenant"
  ON products FOR ALL
  USING (tenant_id = tenant_id());

-- Stock batches policies
CREATE POLICY "Users can manage stock batches in their tenant"
  ON stock_batches FOR ALL
  USING (tenant_id = tenant_id());

-- Purchases policies
CREATE POLICY "Users can manage purchases in their tenant"
  ON purchases FOR ALL
  USING (tenant_id = tenant_id());

-- Purchase lines policies
CREATE POLICY "Users can manage purchase lines in their tenant"
  ON purchase_lines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.id = purchase_lines.purchase_id
      AND purchases.tenant_id = tenant_id()
    )
  );

-- Sales policies
CREATE POLICY "Users can manage sales in their tenant"
  ON sales FOR ALL
  USING (tenant_id = tenant_id());

-- Sale lines policies
CREATE POLICY "Users can manage sale lines in their tenant"
  ON sale_lines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_lines.sale_id
      AND sales.tenant_id = tenant_id()
    )
  );

-- Accounting entries policies
CREATE POLICY "Users can manage accounting entries in their tenant"
  ON accounting_entries FOR ALL
  USING (tenant_id = tenant_id());

-- Audit logs policies
CREATE POLICY "Users can view audit logs in their tenant"
  ON audit_logs FOR SELECT
  USING (tenant_id = tenant_id());

-- Notifications policies
CREATE POLICY "Users can manage notifications in their tenant"
  ON notifications FOR ALL
  USING (tenant_id = tenant_id());

