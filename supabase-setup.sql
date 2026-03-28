-- Run this in your Supabase Dashboard > SQL Editor > New Query

-- Create the table for storing weekly planner data
CREATE TABLE planner_weeks (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  week_id TEXT UNIQUE NOT NULL,
  checked_tasks JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (required by Supabase)
ALTER TABLE planner_weeks ENABLE ROW LEVEL SECURITY;

-- Allow anyone with the anon key to read and write
CREATE POLICY "Allow public access" ON planner_weeks
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime so changes sync across devices instantly
ALTER PUBLICATION supabase_realtime ADD TABLE planner_weeks;

-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON planner_weeks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
