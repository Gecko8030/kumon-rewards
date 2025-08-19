-- Check and fix rewards table structure
-- Run this in your Supabase SQL Editor

-- First, let's see what columns actually exist in your rewards table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'rewards'
ORDER BY ordinal_position;

-- Check if the table exists and has data
SELECT COUNT(*) as reward_count FROM rewards;

-- If amazon_link column is missing, add it
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS amazon_link TEXT;

-- If description column is missing, add it
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS description TEXT;

-- If category column is missing, add it
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'toys';

-- If available column is missing, add it
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true;

-- If created_at column is missing, add it
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Verify the final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'rewards'
ORDER BY ordinal_position;

-- Check if there are any rewards in the table
SELECT * FROM rewards LIMIT 5;

-- If no rewards exist, let's create a sample reward
INSERT INTO rewards (name, cost, image_url, category, available, amazon_link)
SELECT 'Sample Reward', 100, null, 'toys', true, 'https://amazon.com/sample'
WHERE NOT EXISTS (SELECT 1 FROM rewards LIMIT 1);
