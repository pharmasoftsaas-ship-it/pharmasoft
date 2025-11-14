# PharmaSoft - Pharmacy SaaS

A production-ready multi-tenant SaaS for pharmacy management built with Next.js, Supabase, and Netlify.

## Features

- 🏥 Multi-tenant architecture with strict data isolation
- 📦 Batch-level inventory tracking with expiry management
- 📊 Sales management with barcode scanner support
- 🛒 Purchase management
- 📈 Automated reports (daily/weekly/monthly)
- 💰 Basic accounting module
- 🔔 Expiry alerts with tenant-configurable thresholds
- 📄 PDF and CSV exports

## Tech Stack

- **Frontend**: Next.js 14 (TypeScript), Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Deployment**: Netlify (Frontend), Supabase (Backend)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Run database migrations:
```bash
# Apply migrations in Supabase dashboard SQL editor
# See supabase/migrations/ directory
```

4. Deploy Supabase Edge Functions:
```bash
# See supabase/functions/ directory
```

5. Run development server:
```bash
npm run dev
```

## Deployment

### Netlify
1. Connect your repository
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables

### Supabase
1. Deploy Edge Functions via Supabase CLI
2. Set up cron jobs in Supabase dashboard

## License

MIT

