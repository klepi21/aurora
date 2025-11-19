# Supabase Setup Instructions

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: Aurora Football League (or your choice)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for MVP

## Step 2: Get API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - **KEEP THIS SECRET!**

## Step 3: Set Up Environment Variables

1. Copy `.env.local.example` to `.env.local` (if it doesn't exist)
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important**: Never commit `.env.local` to git! The service role key bypasses all security.

## Step 4: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `supabase/schema.sql`
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. Verify tables were created:
   - Go to **Table Editor**
   - You should see: `users`, `user_teams`, `players`

## Step 5: Verify Setup

1. Restart your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Check browser console for any Supabase connection errors

## Step 6: Test API Routes

You can test the API routes using curl or Postman:

### Test Save Team Name
```bash
curl -X POST http://localhost:3000/api/teams \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "erd1test...",
    "team_name": "My Team"
  }'
```

### Test Get Team
```bash
curl "http://localhost:3000/api/teams?wallet_address=erd1test..."
```

### Test Submit Team
```bash
curl -X POST http://localhost:3000/api/teams/submit \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "erd1test...",
    "team_name": "My Team",
    "players": [
      {"position": "GK", "nft_identifier": "FOOT-9e4e8c-001"},
      {"position": "DEF1", "nft_identifier": "FOOT-9e4e8c-002"},
      {"position": "DEF2", "nft_identifier": "FOOT-9e4e8c-003"},
      {"position": "ATT1", "nft_identifier": "FOOT-9e4e8c-004"},
      {"position": "ATT2", "nft_identifier": "FOOT-9e4e8c-005"}
    ]
  }'
```

### Test Leaderboard
```bash
curl "http://localhost:3000/api/leaderboard?limit=10"
```

## Security Notes

1. **Service Role Key**: Only use server-side (API routes). Never expose to client.
2. **Anon Key**: Safe to use client-side for reads (leaderboard).
3. **RLS Policies**: Currently allow public reads. Writes are restricted via API routes.
4. **Wallet Verification**: API routes should verify wallet address matches the request.

## Next Steps

1. Update frontend to call API routes after successful transactions
2. Load team data from database on page load
3. Update leaderboard to fetch from database
4. Create admin panel for updating player points (optional)

## Troubleshooting

### "Missing Supabase URL or Key"
- Check `.env.local` file exists
- Verify variable names match exactly
- Restart dev server after adding env vars

### "Relation does not exist"
- Run the SQL schema file in Supabase SQL Editor
- Check table names match exactly

### "Permission denied"
- Check RLS policies are set correctly
- Verify you're using service role key for writes
- Check API route is using `supabaseAdmin` not `supabase`

