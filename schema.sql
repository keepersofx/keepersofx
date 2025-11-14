-- Keepers of X - Database Schema
-- Cloudflare D1 (SQLite)

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    handle TEXT NOT NULL UNIQUE,
    join_date TEXT NOT NULL,
    followers INTEGER DEFAULT 0,
    location TEXT,
    profile_image TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT DEFAULT NULL
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_join_date ON profiles(join_date);
CREATE INDEX IF NOT EXISTS idx_handle ON profiles(handle);
CREATE INDEX IF NOT EXISTS idx_followers ON profiles(followers DESC);
CREATE INDEX IF NOT EXISTS idx_created_at ON profiles(created_at DESC);

-- Optional: Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_profile_timestamp 
AFTER UPDATE ON profiles
BEGIN
    UPDATE profiles SET updated_at = datetime('now') WHERE id = NEW.id;
END;