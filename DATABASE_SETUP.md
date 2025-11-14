# Database Connection Setup Guide

## Option 1: Remote Supabase (Recommended for Quick Start)

### Step 1: Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - Project name: `pharmasoft` (or your preferred name)
   - Database password: (save this securely!)
   - Region: Choose closest to you
5. Wait for the project to be created (2-3 minutes)

### Step 2: Get Your Credentials
1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (under "Project API keys")

### Step 3: Update Environment Variables
1. Open `.env.local` in your project root
2. Replace the placeholder values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 4: Run Database Migrations
1. In Supabase Dashboard, go to **SQL Editor**
2. Run the migrations in order:
   - Copy and paste contents of `supabase/migrations/001_initial_schema.sql` → Run
   - Copy and paste contents of `supabase/migrations/002_rls_policies.sql` → Run
   - Copy and paste contents of `supabase/migrations/003_functions.sql` → Run

### Step 5: Create Your First Tenant and User
1. In SQL Editor, run:
   ```sql
   -- Create tenant
   INSERT INTO tenants (name, near_expiry_days) 
   VALUES ('My Pharmacy', 30) 
   RETURNING id;
   ```
   - **Note the tenant_id** from the result

2. Go to **Authentication** → **Users** → **Add User**
   - Email: `admin@pharmacy.com`
   - Password: (choose a secure password)
   - Auto Confirm User: ✅ (checked)
   - Click "Create User"
   - **Copy the User ID** (UUID)

3. Link the user to the tenant:
   ```sql
   INSERT INTO users (id, tenant_id, email, name, role)
   VALUES (
     'paste-user-uuid-here',
     'paste-tenant-id-here',
     'admin@pharmacy.com',
     'Admin User',
     'admin'
   );
   ```

### Step 6: Test the Connection
```bash
npm run dev
```
Visit `http://localhost:3000/login` and log in with your credentials.

---

## Option 2: Local Supabase (For Local Development)

### Step 1: Install Supabase CLI
```bash
# Using npm
npm install -g supabase

# Or using Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Step 2: Start Local Supabase
```bash
supabase start
```

This will:
- Start a local PostgreSQL database
- Start Supabase Studio (web interface)
- Display your local credentials

**Save the output!** It will show:
- API URL: `http://localhost:54321`
- anon key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Studio URL: `http://localhost:54323`

### Step 3: Update Environment Variables
1. Open `.env.local`
2. Update with local values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste-anon-key-from-output>
   ```

### Step 4: Run Migrations Locally
```bash
supabase db reset
```
This will automatically apply all migrations in `supabase/migrations/`

### Step 5: Create Your First Tenant and User
1. Open Supabase Studio: `http://localhost:54323`
2. Go to **SQL Editor** and run:
   ```sql
   -- Create tenant
   INSERT INTO tenants (name, near_expiry_days) 
   VALUES ('My Pharmacy', 30) 
   RETURNING id;
   ```

3. Go to **Authentication** → **Users** → **Add User**
   - Create a user and note the User ID

4. Link user to tenant (same as Option 1, Step 5)

---

## Verify Connection

After setting up, verify the connection works:

1. **Check environment variables are loaded:**
   ```bash
   npm run dev
   ```
   The app should start without database connection errors.

2. **Test login:**
   - Visit `http://localhost:3000/login`
   - Log in with your created user credentials

3. **Check browser console:**
   - Open DevTools (F12)
   - Look for any Supabase connection errors

---

## Troubleshooting

### "Invalid API key" error
- Verify your `.env.local` file has correct values
- Make sure there are no extra spaces or quotes
- Restart your dev server after changing `.env.local`

### "RLS policy violation" errors
- Ensure your user has a `tenant_id` set in the `users` table
- Check that migrations ran successfully

### Local Supabase not starting
- Make sure Docker is running (Supabase CLI uses Docker)
- Try: `supabase stop` then `supabase start`

### Can't connect to remote Supabase
- Check your internet connection
- Verify the project URL is correct
- Check if your IP needs to be whitelisted in Supabase dashboard

---

## Next Steps

Once connected:
- ✅ Database is ready
- ✅ Run migrations
- ✅ Create your first tenant and user
- ✅ Start building! 🚀

