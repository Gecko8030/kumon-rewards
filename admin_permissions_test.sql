-- Quick test for admin permissions
-- Run this in your Supabase SQL Editor

-- Test 1: Check if current user is admin
SELECT 'Admin status check:' as test_name;
SELECT 
    auth.uid() as user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as email,
    EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()) as is_admin;

-- Test 2: Check if we can read admin table
SELECT 'Admin table access check:' as test_name;
SELECT COUNT(*) as admin_count FROM admin;

-- Test 3: Check if we can read students table
SELECT 'Students table access check:' as test_name;
SELECT COUNT(*) as student_count FROM students;

-- Test 4: Check RLS policies
SELECT 'RLS policies check:' as test_name;
SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Read'
        WHEN cmd = 'INSERT' THEN 'Create'
        WHEN cmd = 'UPDATE' THEN 'Update'
        WHEN cmd = 'DELETE' THEN 'Delete'
        ELSE cmd
    END as permission_type
FROM pg_policies 
WHERE tablename IN ('admin', 'students')
ORDER BY tablename, cmd;

-- Test 5: Check auth settings (if accessible)
SELECT 'Auth settings check:' as test_name;
SELECT 
    'User creation test' as setting,
    CASE 
        WHEN EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()) 
        THEN 'Admin can create users'
        ELSE 'Not admin - cannot create users'
    END as status;

-- If any test fails, run the fix_user_not_allowed_error.sql script
