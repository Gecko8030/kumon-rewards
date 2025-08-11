-- Fix RLS policies for student creation flow
-- Run this in your Supabase SQL Editor

-- First, let's check what admin table actually exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%admin%';

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Students can read own data" ON students;
DROP POLICY IF EXISTS "Students can update own data" ON students;
DROP POLICY IF EXISTS "Admins can read all students" ON students;
DROP POLICY IF EXISTS "Admins can update all students" ON students;

-- Create new policies that work with the student creation flow

-- Policy 1: Students can read their own data (after they're linked)
CREATE POLICY "Students can read own data" ON students
    FOR SELECT TO authenticated 
    USING (id = auth.uid());

-- Policy 2: Students can update their own data (for completing signup)
CREATE POLICY "Students can complete signup" ON students
    FOR UPDATE TO authenticated 
    USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    WITH CHECK (id = auth.uid());

-- Policy 3: Admins can read all students
CREATE POLICY "Admins can read all students" ON students
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM admins WHERE admins.id = auth.uid()
        ) OR 
        EXISTS (
            SELECT 1 FROM admin WHERE admin.id = auth.uid()
        )
    );

-- Policy 4: Admins can create student records
CREATE POLICY "Admins can create student records" ON students
    FOR INSERT TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins WHERE admins.id = auth.uid()
        ) OR 
        EXISTS (
            SELECT 1 FROM admin WHERE admin.id = auth.uid()
        )
    );

-- Policy 5: Admins can update all students (for managing dollars, etc.)
CREATE POLICY "Admins can manage all students" ON students
    FOR UPDATE TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM admins WHERE admins.id = auth.uid()
        ) OR 
        EXISTS (
            SELECT 1 FROM admin WHERE admin.id = auth.uid()
        )
    );

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'students'
ORDER BY policyname;
