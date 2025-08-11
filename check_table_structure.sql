-- Check what columns actually exist in your students table
-- Run this in your Supabase SQL Editor first

-- Check students table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'students'
ORDER BY ordinal_position;

-- Check if admin table exists and what it's called
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%admin%';

-- Check what RLS policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'students'
ORDER BY policyname;
