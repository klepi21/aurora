# Supabase Database Setup Guide

## Why Supabase?

✅ **PostgreSQL** - Structured, reliable database perfect for relational data
✅ **Built-in REST API** - No need to build backend endpoints
✅ **Row Level Security (RLS)** - Secure permissions at database level
✅ **Free Tier** - 500MB database, 2GB bandwidth, perfect for MVP
✅ **Easy Integration** - Simple client library for Next.js
✅ **TypeScript Support** - Auto-generated types

## Database Schema

### 1. `users` Table
Stores user/team information

```sql
CREATE TABLE users (
  wallet_address TEXT PRIMARY KEY,
  team_name TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_users_points ON users(total_points DESC);
CREATE INDEX idx_users_submitted_at ON users(submitted_at DESC);
```

### 2. `user_teams` Table
Stores which players each user has selected

```sql
CREATE TABLE user_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  player_nft_identifier TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('GK', 'DEF1', 'DEF2', 'ATT1', 'ATT2')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet_address, position)
);

-- Indexes
CREATE INDEX idx_user_teams_wallet ON user_teams(wallet_address);
CREATE INDEX idx_user_teams_player ON user_teams(player_nft_identifier);
```

### 3. `players` Table
Stores all NFT players and their points

```sql
CREATE TABLE players (
  nft_identifier TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  collection TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for leaderboard queries
CREATE INDEX idx_players_points ON players(points DESC);
CREATE INDEX idx_players_collection ON players(collection);
```

## Row Level Security (RLS) Policies

### Users Table
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can INSERT their own record
CREATE POLICY "Users can insert their own record"
ON users FOR INSERT
WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

-- Users can UPDATE their own record
CREATE POLICY "Users can update their own record"
ON users FOR UPDATE
USING (auth.jwt() ->> 'wallet_address' = wallet_address);

-- Anyone can READ (for leaderboard)
CREATE POLICY "Anyone can read users"
ON users FOR SELECT
USING (true);
```

### User Teams Table
```sql
ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;

-- Users can INSERT their own team
CREATE POLICY "Users can insert their own team"
ON user_teams FOR INSERT
WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

-- Users can UPDATE their own team
CREATE POLICY "Users can update their own team"
ON user_teams FOR UPDATE
USING (auth.jwt() ->> 'wallet_address' = wallet_address);

-- Users can DELETE their own team
CREATE POLICY "Users can delete their own team"
ON user_teams FOR DELETE
USING (auth.jwt() ->> 'wallet_address' = wallet_address);

-- Anyone can READ (for public leaderboard)
CREATE POLICY "Anyone can read teams"
ON user_teams FOR SELECT
USING (true);
```

### Players Table
```sql
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Only service role can INSERT/UPDATE (admin operations)
-- For now, we'll allow reads for everyone
CREATE POLICY "Anyone can read players"
ON players FOR SELECT
USING (true);

-- Note: INSERT/UPDATE will be done via service role or API route
```

## Authentication Approach

Since we're using wallet-based auth (not Supabase Auth), we'll:

1. **Use API Routes** - Create Next.js API routes that verify wallet signatures
2. **Service Role Key** - Use Supabase service role key server-side only
3. **Client Key** - Use anon key for public reads (leaderboard)

## Next Steps

1. Install Supabase client
2. Set up environment variables
3. Create API utilities
4. Create API routes for write operations
5. Update frontend to use database

