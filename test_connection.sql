-- Test database connection and permissions
-- Run this in your Supabase SQL Editor

-- Test 1: Check if you can read from students table
SELECT COUNT(*) as student_count FROM students;

-- Test 2: Check if you can read from admin table
SELECT COUNT(*) as admin_count FROM admin;

-- Test 3: Check current user
SELECT auth.uid() as current_user_id;

-- Test 4: Check if current user is admin
SELECT EXISTS (
  SELECT 1 FROM admin WHERE admin.id = auth.uid()
) as is_admin;

-- Test 5: Check students table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'students'
ORDER BY ordinal_position;
