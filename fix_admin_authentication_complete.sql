-- Fix admin authentication and session expired error
-- Run this in your Supabase SQL Editor

-- Step 1: Check current state
SELECT 'Current admin table check:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%admin%';

-- Check if admin table has email column
SELECT 'Admin table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'admin'
ORDER BY ordinal_position;

-- Check current authenticated user
SELECT 'Current authenticated user:' as info;
SELECT auth.uid() as current_user_id, 
       (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user_email;

-- Check if current user is in admin table
SELECT 'Admin check for current user:' as info;
SELECT EXISTS (
    SELECT 1 FROM admin WHERE admin.id = auth.uid()
) as is_admin;

-- Step 2: Fix admin table structure
-- Add email and name columns if they don't exist
ALTER TABLE admin ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE admin ADD COLUMN IF NOT EXISTS name TEXT;

-- Step 3: Update admin table with current user's info
-- This will add the current authenticated user to the admin table
INSERT INTO admin (id, email, name) 
SELECT 
    auth.uid(),
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', au.email)
FROM auth.users au
WHERE au.id = auth.uid()
AND NOT EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid())
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name;

-- Step 4: Create demo admin account if needed
-- First check if demo admin exists in auth.users
SELECT 'Demo admin check:' as info;
SELECT id, email FROM auth.users WHERE email = 'admin@demo.com';

-- If demo admin exists in auth.users, add to admin table
INSERT INTO admin (id, email, name)
SELECT 
    au.id,
    au.email,
    'Demo Admin'
FROM auth.users au
WHERE au.email = 'admin@demo.com'
AND NOT EXISTS (SELECT 1 FROM admin WHERE admin.id = au.id)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name;

-- Step 5: Fix RLS policies for admin table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own admin record" ON admin;
DROP POLICY IF EXISTS "Admins can read admin table" ON admin;

-- Create new policies
CREATE POLICY "Users can read own admin record" ON admin
    FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Admins can read admin table" ON admin
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- Step 6: Verify the fix
SELECT 'Verification - Admin check:' as info;
SELECT EXISTS (
    SELECT 1 FROM admin WHERE admin.id = auth.uid()
) as is_admin_after_fix;

SELECT 'Verification - Admin table contents:' as info;
SELECT id, email, name, created_at FROM admin ORDER BY created_at;

-- Step 7: Test authentication flow
-- This should return true if everything is working
SELECT 'Test - Can authenticate as admin:' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()) 
        THEN 'SUCCESS: User is properly set up as admin'
        ELSE 'ERROR: User is not in admin table'
    END as auth_status;

-- Step 8: Check if demo accounts are properly set up
SELECT 'Demo accounts status:' as info;
SELECT 
    'student@demo.com' as email,
    EXISTS (SELECT 1 FROM students WHERE email = 'student@demo.com') as in_students,
    EXISTS (SELECT 1 FROM auth.users WHERE email = 'student@demo.com') as in_auth_users
UNION ALL
SELECT 
    'admin@demo.com' as email,
    EXISTS (SELECT 1 FROM admin WHERE email = 'admin@demo.com') as in_admin,
    EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@demo.com') as in_auth_users;
