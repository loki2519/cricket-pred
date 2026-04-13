-- ============================================================
-- AuctionOracle - Cricket Player Auction Prediction System
-- Complete Database Schema (works with existing tables)
-- Run this in Supabase SQL Editor
-- ============================================================

-- ✅ 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  role TEXT DEFAULT 'manager',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ✅ 2. PLAYERS TABLE (create only if not exists)
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  role TEXT,
  matches INT DEFAULT 0,
  runs INT DEFAULT 0,
  wickets INT DEFAULT 0,
  economy FLOAT DEFAULT 0.0,
  category TEXT DEFAULT 'C',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ✅ 3. TEAMS TABLE (create only if not exists)
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  budget BIGINT DEFAULT 100000000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ✅ 4. PURCHASES TABLE
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  price INT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ✅ 5. USER_TEAMS TABLE
CREATE TABLE IF NOT EXISTS user_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 🔧 ADD MISSING COLUMNS to existing players table (safe)
-- ============================================================

ALTER TABLE players ADD COLUMN IF NOT EXISTS strike_rate FLOAT DEFAULT 0.0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS price INT DEFAULT 0;

-- ============================================================
-- 🔒 ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow read players" ON players;
DROP POLICY IF EXISTS "Allow read teams" ON teams;
DROP POLICY IF EXISTS "Allow read purchases" ON purchases;
DROP POLICY IF EXISTS "Allow insert purchases" ON purchases;
DROP POLICY IF EXISTS "Allow read user_teams" ON user_teams;
DROP POLICY IF EXISTS "Allow insert user_teams" ON user_teams;

-- Recreate policies
CREATE POLICY "Allow read players" ON players FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read teams" ON teams FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read purchases" ON purchases FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert purchases" ON purchases FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow read user_teams" ON user_teams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow insert user_teams" ON user_teams FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 🧪 SAMPLE DATA
-- ============================================================

-- Sample Teams
INSERT INTO teams (name, budget) VALUES
  ('Mumbai Indians', 100000000),
  ('Chennai Super Kings', 100000000),
  ('Royal Challengers Bangalore', 100000000),
  ('Kolkata Knight Riders', 100000000)
ON CONFLICT DO NOTHING;

-- Sample Players (using all columns including newly added ones)
INSERT INTO players (name, role, matches, runs, wickets, economy, strike_rate, category, price) VALUES
  ('Virat Kohli',      'Batsman',     250, 7000, 4,   8.2, 140.5, 'A', 35000000),
  ('Rohit Sharma',     'Batsman',     235, 6500, 2,   8.5, 138.0, 'A', 32000000),
  ('Jasprit Bumrah',   'Bowler',      130, 400,  150, 6.5, 90.0,  'A', 30000000),
  ('Ravindra Jadeja',  'All-Rounder', 200, 2800, 130, 7.1, 120.0, 'B', 18000000),
  ('Hardik Pandya',    'All-Rounder', 150, 2200, 85,  8.3, 148.0, 'B', 15000000),
  ('Shubman Gill',     'Batsman',     85,  2900, 0,   8.0, 135.5, 'B', 13000000),
  ('Kuldeep Yadav',    'Bowler',      90,  350,  110, 7.2, 85.0,  'B', 12000000),
  ('Yashasvi Jaiswal', 'Batsman',     60,  1800, 0,   8.1, 162.0, 'C', 9000000),
  ('Rinku Singh',      'Batsman',     40,  900,  0,   9.0, 158.0, 'C', 8500000),
  ('Arshdeep Singh',   'Bowler',      55,  200,  70,  8.5, 78.0,  'C', 8000000)
ON CONFLICT DO NOTHING;
