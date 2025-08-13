-- Fix admin authentication issues
-- Run this in your Supabase SQL Editor

-- First, let's check what admin tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%admin%';

-- Check if admin table exists and what's in it
SELECT COUNT(*) as admin_count FROM admin;

-- If admin table is empty or doesn't exist, let's fix it
-- Create admin table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin table
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Admins can read admin table" ON admin;
DROP POLICY IF EXISTS "Users can read own admin record" ON admin;

-- Create policy for users to read their own admin record
CREATE POLICY "Users can read own admin record" ON admin
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- Create policy for admins to read all admin records
CREATE POLICY "Admins can read admin table" ON admin
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- Insert your admin user if not already there
-- Replace 'YOUR_ADMIN_USER_ID' with your actual admin user's UUID
-- You can find this by running: SELECT auth.uid(); in the SQL editor
INSERT INTO admin (id) 
SELECT auth.uid() 
WHERE NOT EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid())
AND EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid());

-- Verify admin table structure and content
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'admin'
ORDER BY ordinal_position;

-- Check admin records
SELECT * FROM admin;

-- Test if current user can access admin table
SELECT EXISTS (
    SELECT 1 FROM admin WHERE admin.id = auth.uid()
) as is_admin;
