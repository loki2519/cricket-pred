-- ============================================================
-- AuctionOracle - FINAL COMPLETE DATABASE SCHEMA (v3)
-- Includes: stumps, catches columns for Wicketkeeper Batsman
-- Run this in Supabase SQL Editor.
-- ============================================================

-- 1. CREATE TEAMS TABLE
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  budget BIGINT DEFAULT 100000000, -- ₹10 Crore
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE PLAYERS TABLE
--    role: 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicketkeeper Batsman'
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT,              -- Batsman / Bowler / All-Rounder / Wicketkeeper Batsman
  matches INT DEFAULT 0,
  runs INT DEFAULT 0,
  wickets INT DEFAULT 0,
  economy FLOAT DEFAULT 0.0,
  strike_rate FLOAT DEFAULT 0.0,
  stumps INT DEFAULT 0,   -- Wicketkeeper Batsman: stumpings
  catches INT DEFAULT 0,  -- Wicketkeeper Batsman: catches
  category TEXT DEFAULT 'C',   -- A / B / C (auto-calculated by app)
  price INT DEFAULT 0,         -- Auction Price (base / sold price in ₹)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2b. Safe migration: add columns if table already exists
ALTER TABLE players ADD COLUMN IF NOT EXISTS stumps INT DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS catches INT DEFAULT 0;

-- 3. CREATE PURCHASES TABLE (With CASCADE DELETE)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  price INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREATE USER_TEAMS MAPPING (With CASCADE DELETE)
CREATE TABLE IF NOT EXISTS user_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;

-- 6. POLICIES (authenticated users have full access)
DROP POLICY IF EXISTS "public_read_teams" ON teams;
CREATE POLICY "public_read_teams" ON teams FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "public_read_players" ON players;
CREATE POLICY "public_read_players" ON players FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "public_read_purchases" ON purchases;
CREATE POLICY "public_read_purchases" ON purchases FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "public_read_user_teams" ON user_teams;
CREATE POLICY "public_read_user_teams" ON user_teams FOR ALL USING (auth.role() = 'authenticated');

-- 7. SAMPLE TEAMS
INSERT INTO teams (name, budget) VALUES
  ('Mumbai Indians', 100000000),
  ('Chennai Super Kings', 100000000),
  ('Royal Challengers Bangalore', 100000000),
  ('Kolkata Knight Riders', 100000000)
ON CONFLICT DO NOTHING;
