-- Fix admin permissions for student management
-- Run this in your Supabase SQL Editor

-- First, let's check what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'students'
ORDER BY policyname;

-- Drop existing policies that might be blocking admin access
DROP POLICY IF EXISTS "Students can read own data" ON students;
DROP POLICY IF EXISTS "Students can update own data" ON students;
DROP POLICY IF EXISTS "Admins can read all students" ON students;
DROP POLICY IF EXISTS "Admins can update all students" ON students;
DROP POLICY IF EXISTS "Admins can create student records" ON students;
DROP POLICY IF EXISTS "Admins can manage all students" ON students;

-- Create new policies that allow admins to manage students
-- Policy for admins to read all students
CREATE POLICY "Admins can read all students" ON students
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- Policy for admins to insert new student records
CREATE POLICY "Admins can create students" ON students
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- Policy for admins to update all students
CREATE POLICY "Admins can update all students" ON students
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- Policy for admins to delete students
CREATE POLICY "Admins can delete students" ON students
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- Policy for students to read their own data (when they sign up)
CREATE POLICY "Students can read own data" ON students
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- Policy for students to update their own data
CREATE POLICY "Students can update own data" ON students
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Verify the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'students'
ORDER BY policyname;
