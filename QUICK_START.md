# Quick Start Guide

## Local Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Run Database Migrations**
   - Go to Supabase Dashboard → SQL Editor
   - Run migrations in order:
     - `supabase/migrations/001_initial_schema.sql`
     - `supabase/migrations/002_rls_policies.sql`
     - `supabase/migrations/003_functions.sql`

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Create First Tenant and User**
   
   Option A: Via SQL (recommended for testing)
   ```sql
   -- Create tenant
   INSERT INTO tenants (name, near_expiry_days) 
   VALUES ('My Pharmacy', 30) 
   RETURNING id;
   
   -- Note the tenant_id, then create user in Supabase Auth dashboard
   -- After creating auth user, link them:
   INSERT INTO users (id, tenant_id, email, name, role)
   VALUES (
     'user-uuid-from-auth',
     'tenant-uuid-from-above',
     'admin@pharmacy.com',
     'Admin User',
     'admin'
   );
   ```

   Option B: Via Supabase Dashboard
   - Create user in Authentication → Users
   - Manually insert into `users` table with tenant_id

6. **Test Barcode Scanner**
   - Go to Sales page
   - The hidden barcode input is auto-focused
   - Scan a barcode (or type + Enter) to add product to sale

## Key Features to Test

1. **Barcode Scanner**: Sales page → Scan barcode → Product auto-added
2. **FIFO Logic**: Create multiple batches with different expiry dates → Make sale → Earliest expiry batch used
3. **Expiry Thresholds**: Settings page → Change threshold → Verify notifications update
4. **RLS Isolation**: Create two tenants → Verify data isolation

## Common Issues

### RLS Blocking Queries
- Ensure user has `tenant_id` set in `users` table
- Check that `auth.tenant_id()` function is working

### Barcode Scanner Not Working
- Check browser console for errors
- Ensure product has barcode in database
- Verify hidden input is focused

### Edge Functions Not Running
- Check Supabase Dashboard → Edge Functions → Logs
- Verify cron job is configured correctly

