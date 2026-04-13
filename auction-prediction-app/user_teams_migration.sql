-- Table to track which user selected which team
-- Run this in your Supabase SQL Editor → New Query

CREATE TABLE IF NOT EXISTS user_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE, -- one team per user
  team_id UUID REFERENCES teams(id) UNIQUE,        -- one user per team
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
