-- Migration: Add points_at_creation to user_teams table
-- This tracks each player's points when added to a team, so we only count points gained after team creation

-- Add column to user_teams table
ALTER TABLE user_teams 
ADD COLUMN IF NOT EXISTS points_at_creation INTEGER DEFAULT 0;

-- Update existing records: set points_at_creation to current player points
-- This ensures existing teams don't get retroactive points
UPDATE user_teams ut
SET points_at_creation = COALESCE(
  (SELECT points FROM players WHERE nft_identifier = ut.player_nft_identifier),
  0
)
WHERE points_at_creation IS NULL OR points_at_creation = 0;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_teams_points_at_creation 
ON user_teams(points_at_creation);

