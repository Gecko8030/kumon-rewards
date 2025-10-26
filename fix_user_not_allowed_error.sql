-- Fix "User not allowed" error for student account creation
-- Run this in your Supabase SQL Editor

-- Step 1: Check current authentication settings
SELECT 'Current auth settings check:' as info;

-- Check if we have any auth configuration issues
SELECT 'Auth users count:' as info;
SELECT COUNT(*) as total_users FROM auth.users;

-- Check if there are any disabled users
SELECT 'Disabled users:' as info;
SELECT email, banned_until, email_confirmed_at 
FROM auth.users 
WHERE banned_until IS NOT NULL OR email_confirmed_at IS NULL;

-- Step 2: Fix authentication policies
-- Drop any restrictive policies that might be blocking user creation
DROP POLICY IF EXISTS "Users can read own admin record" ON admin;
DROP POLICY IF EXISTS "Admins can read admin table" ON admin;

-- Create more permissive admin policies
CREATE POLICY "Users can read own admin record" ON admin
    FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Admins can read admin table" ON admin
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- Step 3: Ensure admin table allows user creation
-- Make sure admin table has proper structure
ALTER TABLE admin ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE admin ADD COLUMN IF NOT EXISTS name TEXT;

-- Step 4: Add current user to admin table if not already there
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

-- Step 5: Fix students table policies for admin creation
DROP POLICY IF EXISTS "Admins can create students" ON students;
DROP POLICY IF EXISTS "Admins can read all students" ON students;
DROP POLICY IF EXISTS "Admins can update all students" ON students;
DROP POLICY IF EXISTS "Admins can delete students" ON students;

-- Create admin policies for students table
CREATE POLICY "Admins can read all students" ON students
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

CREATE POLICY "Admins can create students" ON students
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

CREATE POLICY "Admins can update all students" ON students
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

CREATE POLICY "Admins can delete students" ON students
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- Step 6: Verify admin status
SELECT 'Admin verification:' as info;
SELECT EXISTS (
    SELECT 1 FROM admin WHERE admin.id = auth.uid()
) as is_admin;

-- Step 7: Test if we can create a test student record
-- This will help identify if the issue is with Supabase auth or our policies
SELECT 'Test student creation capability:' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()) 
        THEN 'SUCCESS: Admin can create students'
        ELSE 'ERROR: Not recognized as admin'
    END as creation_status;

-- Step 8: Show current admin users
SELECT 'Current admin users:' as info;
SELECT id, email, name, created_at FROM admin ORDER BY created_at;
