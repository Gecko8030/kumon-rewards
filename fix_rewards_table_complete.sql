-- Complete fix for rewards table - run this in Supabase SQL Editor

-- First, let's check if the rewards table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'rewards'
) as rewards_table_exists;

-- If rewards table doesn't exist, create it completely
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    cost INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    category TEXT DEFAULT 'toys',
    available BOOLEAN DEFAULT true,
    amazon_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on rewards table
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Anyone can read rewards" ON rewards;
DROP POLICY IF EXISTS "Admins can manage rewards" ON rewards;

-- Create policy for anyone to read rewards
CREATE POLICY "Anyone can read rewards" ON rewards
    FOR SELECT TO authenticated
    USING (true);

-- Create policy for admins to manage rewards
CREATE POLICY "Admins can manage rewards" ON rewards
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- If no rewards exist, create some sample rewards
INSERT INTO rewards (name, description, cost, image_url, category, available, amazon_link)
SELECT 'Sample Toy', 'A fun sample toy for testing', 50, null, 'toys', true, 'https://amazon.com/sample-toy'
WHERE NOT EXISTS (SELECT 1 FROM rewards LIMIT 1);

INSERT INTO rewards (name, description, cost, image_url, category, available, amazon_link)
SELECT 'Sample Book', 'An educational book for testing', 75, null, 'books', true, 'https://amazon.com/sample-book'
WHERE NOT EXISTS (SELECT 1 FROM rewards WHERE name = 'Sample Book');

INSERT INTO rewards (name, description, cost, image_url, category, available, amazon_link)
SELECT 'Sample Game', 'A fun game for testing', 100, null, 'games', true, 'https://amazon.com/sample-game'
WHERE NOT EXISTS (SELECT 1 FROM rewards WHERE name = 'Sample Game');

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'rewards'
ORDER BY ordinal_position;

-- Check the rewards data
SELECT * FROM rewards ORDER BY name;

-- Test a simple query to make sure it works
SELECT COUNT(*) as total_rewards FROM rewards;
