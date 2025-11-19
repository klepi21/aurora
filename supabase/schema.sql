-- Aurora Football League Database Schema

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  wallet_address TEXT PRIMARY KEY,
  team_name TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_points ON users(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_users_submitted_at ON users(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_team_name ON users(team_name);

-- ============================================
-- 2. USER_TEAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  player_nft_identifier TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('GK', 'DEF1', 'DEF2', 'ATT1', 'ATT2')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet_address, position)
);

-- Indexes for user_teams
CREATE INDEX IF NOT EXISTS idx_user_teams_wallet ON user_teams(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_teams_player ON user_teams(player_nft_identifier);
CREATE INDEX IF NOT EXISTS idx_user_teams_position ON user_teams(position);

-- ============================================
-- 3. PLAYERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS players (
  nft_identifier TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  collection TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for players
CREATE INDEX IF NOT EXISTS idx_players_points ON players(points DESC);
CREATE INDEX IF NOT EXISTS idx_players_collection ON players(collection);
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Note: Since we're using wallet-based auth, we'll handle verification in API routes
-- For now, allow public reads and restrict writes via API routes with service role

-- Allow anyone to read users (for leaderboard)
CREATE POLICY "Anyone can read users"
ON users FOR SELECT
USING (true);

-- User teams table policies
-- Allow anyone to read teams (for public leaderboard)
CREATE POLICY "Anyone can read teams"
ON user_teams FOR SELECT
USING (true);

-- Players table policies
-- Allow anyone to read players
CREATE POLICY "Anyone can read players"
ON players FOR SELECT
USING (true);

-- Note: INSERT/UPDATE operations will be done via API routes using service role key
-- This ensures proper verification of wallet addresses before allowing writes

-- ============================================
-- 5. FUNCTIONS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_teams_updated_at BEFORE UPDATE ON user_teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

