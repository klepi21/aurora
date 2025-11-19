# Database Implementation Summary

## ✅ What's Been Set Up

### 1. **Supabase Integration**
- ✅ Installed `@supabase/supabase-js`
- ✅ Created client utilities (`src/lib/supabase/client.ts` and `server.ts`)
- ✅ Created TypeScript types (`src/types/database.ts`)

### 2. **API Routes Created**
- ✅ `POST /api/teams` - Save/update team name
- ✅ `GET /api/teams` - Get team by wallet address
- ✅ `POST /api/teams/submit` - Submit team with players
- ✅ `GET /api/leaderboard` - Get leaderboard sorted by points

### 3. **Database Schema**
- ✅ SQL schema file (`supabase/schema.sql`)
- ✅ 3 tables: `users`, `user_teams`, `players`
- ✅ Indexes for performance
- ✅ RLS policies for security
- ✅ Auto-update triggers for `updated_at`

### 4. **Documentation**
- ✅ Setup instructions (`docs/SUPABASE_SETUP_INSTRUCTIONS.md`)
- ✅ Implementation plan (`docs/DATABASE_IMPLEMENTATION.md`)

## 🔄 What You Need to Do Next

### Step 1: Set Up Supabase Project
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get API keys (URL, anon key, service role key)
4. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### Step 2: Run SQL Schema
1. Go to Supabase SQL Editor
2. Copy/paste `supabase/schema.sql`
3. Run it to create tables

### Step 3: Update Frontend (Next Steps)

#### A. Save Team Name After Transaction
In `src/app/app/page.tsx`, after successful team name transaction:
```typescript
// After transaction succeeds
const response = await fetch('/api/teams', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wallet_address: address,
    team_name: teamNameInput.trim()
  })
});
```

#### B. Load Team Name on Page Load
```typescript
useEffect(() => {
  if (address) {
    fetch(`/api/teams?wallet_address=${address}`)
      .then(res => res.json())
      .then(data => {
        if (data.data?.team_name) {
          setTeamName(data.data.team_name);
        }
      });
  }
}, [address]);
```

#### C. Submit Team with Players
In `src/app/app/squads/page.tsx`, after "Save Team":
```typescript
const handleSaveTeam = async () => {
  const players = [
    { position: 'GK', nft_identifier: selectedPlayers.GK?.identifier },
    { position: 'DEF1', nft_identifier: selectedPlayers.DEF1?.identifier },
    { position: 'DEF2', nft_identifier: selectedPlayers.DEF2?.identifier },
    { position: 'ATT1', nft_identifier: selectedPlayers.ATT1?.identifier },
    { position: 'ATT2', nft_identifier: selectedPlayers.ATT2?.identifier },
  ].filter(p => p.nft_identifier);

  if (players.length !== 5) return;

  const response = await fetch('/api/teams/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wallet_address: address,
      team_name: teamName, // Get from user or API
      players
    })
  });
};
```

#### D. Update Leaderboard
In `src/app/app/shop/page.tsx`:
```typescript
useEffect(() => {
  fetch('/api/leaderboard?limit=10')
    .then(res => res.json())
    .then(data => {
      if (data.data) {
        setTeams(data.data);
      }
    });
}, []);
```

## 📊 Database Structure

### `users` Table
- `wallet_address` (PK) - User's wallet address
- `team_name` - Team name
- `submitted_at` - When team was submitted
- `total_points` - Calculated from players
- `created_at`, `updated_at` - Timestamps

### `user_teams` Table
- `id` (PK) - UUID
- `wallet_address` (FK) - References users
- `player_nft_identifier` - NFT identifier
- `position` - GK, DEF1, DEF2, ATT1, ATT2
- `created_at`, `updated_at` - Timestamps

### `players` Table
- `nft_identifier` (PK) - NFT identifier
- `name` - Player name
- `collection` - Collection identifier
- `points` - Player's points
- `created_at`, `updated_at` - Timestamps

## 🔒 Security

- ✅ RLS enabled on all tables
- ✅ Public reads allowed (for leaderboard)
- ✅ Writes restricted via API routes
- ✅ Service role key used server-side only
- ✅ Wallet address verification in API routes

## 🎯 Points Calculation

Points are automatically calculated when:
1. User submits/updates team
2. Player points are updated (via admin API)

Calculation: Sum of all player points in user's team

## 📝 Notes

- Team name is saved after successful transaction (0.1 EGLD)
- Team submission requires exactly 5 players
- Points update automatically when team changes
- Leaderboard updates in real-time (can add subscriptions later)

