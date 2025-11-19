# Quick Database Setup

## Step 1: Get Service Role Key
1. Go to: https://supabase.com/dashboard/project/bdfayxxvhhznjwfcpxva/settings/api
2. Copy the `service_role` key (under "Project API keys")
3. Update `.env.local` and replace `your-service-role-key-here` with the actual key

## Step 2: Run SQL Schema
1. Go to: https://supabase.com/dashboard/project/bdfayxxvhhznjwfcpxva/sql/new
2. Copy the entire contents of `supabase/schema.sql`
3. Paste into the SQL Editor
4. Click "Run" (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

## Step 3: Verify Tables Created
1. Go to: https://supabase.com/dashboard/project/bdfayxxvhhznjwfcpxva/editor
2. You should see 3 tables:
   - `users`
   - `user_teams`
   - `players`

## Step 4: Test Connection
Restart your dev server:
```bash
npm run dev
```

Check browser console - should see no Supabase warnings.

