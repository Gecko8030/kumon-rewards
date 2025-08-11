-- Fix for amazon_link column missing error
-- Run this in your Supabase SQL Editor

-- Add amazon_link field to rewards table
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS amazon_link text;

-- Update the rewards table to make description optional since we're using amazon_link
ALTER TABLE rewards ALTER COLUMN description DROP NOT NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rewards' AND column_name = 'amazon_link';
