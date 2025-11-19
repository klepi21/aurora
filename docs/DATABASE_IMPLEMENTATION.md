# Database Implementation Plan

## Overview
We'll use **Supabase** (PostgreSQL) for storing:
1. User teams and team names
2. Player selections
3. Player points
4. Calculated user points

## Architecture

### Authentication Flow
Since we use wallet-based auth (not Supabase Auth), we'll:
1. **Client-side**: Use Supabase client with anon key for READ operations (leaderboard)
2. **Server-side**: Use Next.js API routes with service role key for WRITE operations
3. **Verification**: Verify wallet address in API routes before allowing writes

### Database Tables

#### 1. `users`
- `wallet_address` (PRIMARY KEY)
- `team_name`
- `submitted_at`
- `total_points` (calculated from players)
- `created_at`, `updated_at`

#### 2. `user_teams`
- `id` (UUID PRIMARY KEY)
- `wallet_address` (FK to users)
- `player_nft_identifier`
- `position` (GK, DEF1, DEF2, ATT1, ATT2)
- `created_at`, `updated_at`

#### 3. `players`
- `nft_identifier` (PRIMARY KEY)
- `name`
- `collection`
- `points`
- `created_at`, `updated_at`

## Implementation Steps

### Step 1: Install Supabase
```bash
npm install @supabase/supabase-js
```

### Step 2: Environment Variables
Add to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (server-side only)
```

### Step 3: Create Supabase Client Utilities
- `src/lib/supabase/client.ts` - Client-side reads
- `src/lib/supabase/server.ts` - Server-side writes

### Step 4: Create API Routes
- `src/app/api/teams/route.ts` - Save/update team name
- `src/app/api/teams/submit/route.ts` - Submit team with players
- `src/app/api/players/route.ts` - Update player points (admin)

### Step 5: Update Frontend
- Save team name to DB after successful transaction
- Save team submission with players
- Load team data from DB
- Calculate points from players table

## Security

### Row Level Security (RLS)
- Users can only INSERT/UPDATE their own records
- Anyone can READ (for leaderboard)
- Players table: READ for all, WRITE via API routes only

### API Route Verification
- Verify wallet address matches request
- Verify transaction signature if needed
- Use service role key server-side only

## Points Calculation

Points are calculated by:
1. Summing points from `players` table for each player in `user_teams`
2. Storing calculated total in `users.total_points`
3. Updating when player points change or team changes

