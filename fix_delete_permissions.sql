-- Fix delete permissions for students table
-- Run this in your Supabase SQL Editor

-- First, let's check what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'students'
ORDER BY policyname;

-- Drop existing delete policies that might be blocking admin access
DROP POLICY IF EXISTS "Admins can delete students" ON students;

-- Create a new delete policy for admins
CREATE POLICY "Admins can delete students" ON students
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- Verify the new policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'students' AND cmd = 'DELETE'
ORDER BY policyname;

-- Test if admin can delete (this should work now)
-- Note: You'll need to run this as an authenticated admin user
SELECT EXISTS (
  SELECT 1 FROM admin WHERE admin.id = auth.uid()
) as can_delete_students;
