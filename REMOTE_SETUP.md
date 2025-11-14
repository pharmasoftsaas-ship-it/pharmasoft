# Remote Supabase Setup - Quick Guide

## Step 1: Create Supabase Project

1. Go to **[https://supabase.com](https://supabase.com)** and sign up/login
2. Click **"New Project"**
3. Fill in:
   - **Name**: `pharmasoft` (or any name you prefer)
   - **Database Password**: ⚠️ **Save this password securely!** You'll need it later
   - **Region**: Choose the closest region to you
4. Click **"Create new project"** and wait 2-3 minutes

## Step 2: Get Your Credentials

Once your project is ready:

1. In your Supabase dashboard, click **Settings** (gear icon) → **API**
2. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co` ← Copy this
   - **Project API keys** section:
     - **anon public** key ← Copy this (starts with `eyJhbG...`)

## Step 3: Update .env.local

Open `.env.local` in your project and replace the values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Replace:**
- `https://xxxxx.supabase.co` with your actual Project URL
- `eyJhbG...` with your actual anon public key

## Step 4: Run Database Migrations

1. In Supabase Dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**

### Migration 1: Initial Schema
1. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
2. Paste into SQL Editor
3. Click **"Run"** (or press Ctrl+Enter)
4. ✅ You should see "Success. No rows returned"

### Migration 2: RLS Policies
1. Click **"New query"** again
2. Copy the entire contents of `supabase/migrations/002_rls_policies.sql`
3. Paste and click **"Run"**
4. ✅ Should see "Success. No rows returned"

### Migration 3: Functions
1. Click **"New query"** again
2. Copy the entire contents of `supabase/migrations/003_functions.sql`
3. Paste and click **"Run"**
4. ✅ Should see "Success. No rows returned"

## Step 5: Create Your First Tenant

In SQL Editor, run this query:

```sql
INSERT INTO tenants (name, near_expiry_days) 
VALUES ('My Pharmacy', 30) 
RETURNING id, name;
```

**⚠️ IMPORTANT:** Copy the `id` (UUID) from the result - you'll need it in the next step!

Example result:
```
id: 123e4567-e89b-12d3-a456-426614174000
name: My Pharmacy
```

## Step 6: Create Your First User

### 6a. Create Auth User
1. Go to **Authentication** → **Users** (left sidebar)
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - **Email**: `admin@pharmacy.com` (or your email)
   - **Password**: Choose a secure password
   - ✅ Check **"Auto Confirm User"**
4. Click **"Create user"**
5. **⚠️ IMPORTANT:** Copy the **User ID** (UUID) - you'll see it in the user list

### 6b. Link User to Tenant
Go back to **SQL Editor** and run (replace the UUIDs with your actual values):

```sql
INSERT INTO users (id, tenant_id, email, name, role)
VALUES (
  'PASTE-USER-UUID-HERE',           -- From Step 6a
  'PASTE-TENANT-ID-HERE',           -- From Step 5
  'admin@pharmacy.com',              -- Same email as Step 6a
  'Admin User',
  'admin'
);
```

**Example:**
```sql
INSERT INTO users (id, tenant_id, email, name, role)
VALUES (
  '123e4567-e89b-12d3-a456-426614174001',
  '123e4567-e89b-12d3-a456-426614174000',
  'admin@pharmacy.com',
  'Admin User',
  'admin'
);
```

## Step 7: Test the Connection

1. Make sure your `.env.local` is updated with correct credentials
2. Start your dev server:
   ```bash
   npm run dev
   ```
3. Open **http://localhost:3000/login**
4. Log in with:
   - Email: `admin@pharmacy.com` (or the email you used)
   - Password: The password you set in Step 6a

## ✅ Success Checklist

- [ ] Supabase project created
- [ ] Credentials copied to `.env.local`
- [ ] All 3 migrations run successfully
- [ ] Tenant created and ID saved
- [ ] Auth user created and ID saved
- [ ] User linked to tenant in database
- [ ] Can log in at http://localhost:3000/login

## 🐛 Troubleshooting

### "Invalid API key" error
- Double-check `.env.local` has correct values (no extra spaces)
- Restart dev server: Stop (Ctrl+C) and run `npm run dev` again

### "RLS policy violation" when logging in
- Make sure you ran Step 6b (linking user to tenant)
- Verify the user ID and tenant ID are correct in the `users` table

### Can't see tables after migrations
- Go to **Table Editor** in Supabase dashboard
- You should see: `tenants`, `users`, `products`, `stock_batches`, etc.

### Login page shows error
- Check browser console (F12) for errors
- Verify `.env.local` file exists and has correct values
- Make sure you restarted the dev server after updating `.env.local`

---

**Need help?** Check the main `DATABASE_SETUP.md` file for more detailed troubleshooting.

