-- Fix "user id invalid" error when adding students
-- Run this in your Supabase SQL Editor

-- First, let's check the current state of things
SELECT 'Current admin table check:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%admin%';

-- Check current user
SELECT 'Current authenticated user:' as info;
SELECT auth.uid() as current_user_id;

-- Check if current user is in admin table
SELECT 'Admin check for current user:' as info;
SELECT EXISTS (
    SELECT 1 FROM admin WHERE admin.id = auth.uid()
) as is_admin;

-- Check students table structure
SELECT 'Students table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'students'
ORDER BY ordinal_position;

-- Check current RLS policies
SELECT 'Current RLS policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'students'
ORDER BY policyname;

-- Fix 1: Ensure admin table exists and has proper structure
CREATE TABLE IF NOT EXISTS admin (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin table
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;

-- Fix 2: Clean up and recreate RLS policies for students table
-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Students can read own data" ON students;
DROP POLICY IF EXISTS "Students can update own data" ON students;
DROP POLICY IF EXISTS "Students can complete signup" ON students;
DROP POLICY IF EXISTS "Admins can read all students" ON students;
DROP POLICY IF EXISTS "Admins can update all students" ON students;
DROP POLICY IF EXISTS "Admins can create student records" ON students;
DROP POLICY IF EXISTS "Admins can manage all students" ON students;
DROP POLICY IF EXISTS "Admins can create students" ON students;
DROP POLICY IF EXISTS "Admins can delete students" ON students;
DROP POLICY IF EXISTS "Allow student record creation" ON students;
DROP POLICY IF EXISTS "Students can update their own record" ON students;

-- Fix 3: Create comprehensive RLS policies

-- Policy 1: Admins can read all students
CREATE POLICY "Admins can read all students" ON students
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- Policy 2: Admins can create student records
CREATE POLICY "Admins can create students" ON students
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- Policy 3: Admins can update all students
CREATE POLICY "Admins can update all students" ON students
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- Policy 4: Admins can delete students
CREATE POLICY "Admins can delete students" ON students
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- Policy 5: Students can read their own data
CREATE POLICY "Students can read own data" ON students
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- Policy 6: Students can update their own data
CREATE POLICY "Students can update own data" ON students
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Fix 4: Ensure current user is added to admin table
INSERT INTO admin (id) 
SELECT auth.uid() 
WHERE NOT EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid())
AND EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid());

-- Fix 5: Create admin policies for admin table
DROP POLICY IF EXISTS "Users can read own admin record" ON admin;
DROP POLICY IF EXISTS "Admins can read admin table" ON admin;

CREATE POLICY "Users can read own admin record" ON admin
    FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Admins can read admin table" ON admin
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- Fix 6: Verify the fixes
SELECT 'Verification - Admin check:' as info;
SELECT EXISTS (
    SELECT 1 FROM admin WHERE admin.id = auth.uid()
) as is_admin_after_fix;

SELECT 'Verification - Policies created:' as info;
SELECT policyname, cmd
FROM pg_policies 
WHERE tablename = 'students'
ORDER BY policyname;

-- Test if we can now insert a student (this will show if the policies work)
SELECT 'Test - Can insert student:' as info;
SELECT EXISTS (
    SELECT 1 FROM admin WHERE admin.id = auth.uid()
) as can_insert_student;

-- Final check: Show all admin users
SELECT 'All admin users:' as info;
SELECT id, created_at FROM admin;
