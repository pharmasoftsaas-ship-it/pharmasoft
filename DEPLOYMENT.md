# Deployment Guide

## Prerequisites

1. Supabase account and project
2. Netlify account
3. Node.js 18+ installed locally

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key

### 1.2 Run Database Migrations

1. Open Supabase Dashboard → SQL Editor
2. Run migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_functions.sql`

### 1.3 Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy Edge Functions
supabase functions deploy expiry-check
```

### 1.4 Set Up Cron Job

1. Go to Supabase Dashboard → Database → Cron Jobs
2. Create a new cron job:
   - **Name**: `expiry-check-daily`
   - **Schedule**: `0 9 * * *` (9 AM daily)
   - **Function**: `expiry-check`
   - **Enabled**: Yes

Alternatively, use pg_cron extension:

```sql
SELECT cron.schedule(
  'expiry-check-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/expiry-check',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) AS request_id;
  $$
);
```

## Step 2: Environment Variables

### 2.1 Local Development

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2.2 Netlify

1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 3: Netlify Deployment

### 3.1 Connect Repository

1. Go to Netlify Dashboard
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository

### 3.2 Configure Build Settings

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: 18

### 3.3 Deploy

Netlify will automatically deploy on every push to your main branch.

## Step 4: Post-Deployment

### 4.1 Update Supabase Auth Settings

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Netlify URL to:
   - Site URL
   - Redirect URLs

### 4.2 Create First Tenant and User

You'll need to create a tenant and user manually or via Supabase SQL:

```sql
-- Create tenant
INSERT INTO tenants (name, near_expiry_days) 
VALUES ('My Pharmacy', 30) 
RETURNING id;

-- Create user in Supabase Auth (via dashboard or API)
-- Then link to tenant:
INSERT INTO users (id, tenant_id, email, name, role)
VALUES (
  'user-uuid-from-auth',
  'tenant-uuid-from-above',
  'admin@pharmacy.com',
  'Admin User',
  'admin'
);
```

## Step 5: Testing

1. Test barcode scanner on sales page
2. Verify FIFO logic works correctly
3. Test expiry notifications
4. Verify RLS policies (try accessing data from different tenant)

## Troubleshooting

### RLS Issues

If RLS is blocking queries, ensure:
1. User's `tenant_id` is set correctly in `users` table
2. JWT contains `user_metadata.tenant_id` (set via trigger or manually)

### Barcode Scanner Not Working

1. Ensure hidden input is focused
2. Check browser console for errors
3. Verify product barcode exists in database

### Edge Functions Not Running

1. Check function logs in Supabase Dashboard
2. Verify service role key is set correctly
3. Check cron job configuration

