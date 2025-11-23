-- Migration: Fix points calculation for existing teams
-- This fixes the issue where existing teams lost their points after migration
-- Strategy: Set points_at_creation to 0 for all existing teams so they keep their current totals

-- First, ensure points_at_creation column exists
ALTER TABLE user_teams 
ADD COLUMN IF NOT EXISTS points_at_creation INTEGER DEFAULT 0;

-- For existing teams created before this migration: set points_at_creation to 0
-- This way: current_points - 0 = current_points, so they keep all their current points
-- Only NEW teams created after this will have points_at_creation set correctly
UPDATE user_teams ut
SET points_at_creation = 0
WHERE points_at_creation IS NULL 
   OR points_at_creation = (SELECT points FROM players WHERE nft_identifier = ut.player_nft_identifier);

-- Now recalculate all user points based on current player points (since points_at_creation = 0)
-- This restores their original totals
UPDATE users u
SET total_points = COALESCE((
  SELECT SUM(COALESCE(p.points, 0))
  FROM user_teams ut
  JOIN players p ON p.nft_identifier = ut.player_nft_identifier
  WHERE ut.wallet_address = u.wallet_address
), 0)
WHERE EXISTS (
  SELECT 1 FROM user_teams WHERE wallet_address = u.wallet_address
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_teams_points_at_creation 
ON user_teams(points_at_creation);

