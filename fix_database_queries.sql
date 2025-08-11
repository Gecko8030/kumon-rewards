-- Fix database schema issues
-- Run this in your Supabase SQL Editor

-- First, let's check what columns exist in the students table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

-- Check if we need to add the name column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'name'
    ) THEN
        -- Add name column if it doesn't exist
        ALTER TABLE students ADD COLUMN name text;
        RAISE NOTICE 'Added name column to students table';
    ELSE
        RAISE NOTICE 'Name column already exists in students table';
    END IF;
END $$;

-- Check what columns exist in the goals table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'goals' 
ORDER BY ordinal_position;

-- Make sure goal_url column exists in goals table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'goals' AND column_name = 'goal_url'
    ) THEN
        -- Add goal_url column if it doesn't exist
        ALTER TABLE goals ADD COLUMN goal_url text;
        RAISE NOTICE 'Added goal_url column to goals table';
    ELSE
        RAISE NOTICE 'goal_url column already exists in goals table';
    END IF;
END $$;

-- Check what columns exist in the rewards table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rewards' 
ORDER BY ordinal_position;

-- Make sure amazon_link column exists in rewards table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rewards' AND column_name = 'amazon_link'
    ) THEN
        -- Add amazon_link column if it doesn't exist
        ALTER TABLE rewards ADD COLUMN amazon_link text;
        RAISE NOTICE 'Added amazon_link column to rewards table';
    ELSE
        RAISE NOTICE 'amazon_link column already exists in rewards table';
    END IF;
END $$;
