-- Migration: Add Referral System
-- Adds referral tracking fields to users table

-- Add referral columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by TEXT REFERENCES users(wallet_address),
ADD COLUMN IF NOT EXISTS refpoints INTEGER DEFAULT 0;

-- Create index on referral_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- Create index on referred_by for counting referrals
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);

-- Create index on refpoints for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_users_refpoints ON users(refpoints DESC);

-- Function to generate a unique referral code
-- This will be called when a user is created if they don't have a code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excludes confusing chars like 0, O, I, 1
  code TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure unique referral code
CREATE OR REPLACE FUNCTION ensure_unique_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
BEGIN
  -- If referral_code is NULL or empty, generate one
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    LOOP
      new_code := generate_referral_code();
      -- Check if code already exists
      IF NOT EXISTS (SELECT 1 FROM users WHERE referral_code = new_code) THEN
        NEW.referral_code := new_code;
        EXIT;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code on insert
CREATE TRIGGER ensure_referral_code_on_insert
BEFORE INSERT ON users
FOR EACH ROW
WHEN (NEW.referral_code IS NULL OR NEW.referral_code = '')
EXECUTE FUNCTION ensure_unique_referral_code();

-- Function to award refpoints when a referral is made
CREATE OR REPLACE FUNCTION award_referral_points()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a new user with a referrer, award 1 refpoint to the referrer
  IF NEW.referred_by IS NOT NULL AND (OLD IS NULL OR OLD.referred_by IS NULL) THEN
    UPDATE users 
    SET refpoints = COALESCE(refpoints, 0) + 1
    WHERE wallet_address = NEW.referred_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to award refpoints on user creation with referrer
CREATE TRIGGER award_referral_points_on_insert
AFTER INSERT ON users
FOR EACH ROW
WHEN (NEW.referred_by IS NOT NULL)
EXECUTE FUNCTION award_referral_points();

