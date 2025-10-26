-- Complete authentication fix for both student and admin
-- Run this in your Supabase SQL Editor

-- Step 1: Check what we have in auth.users
SELECT 'Current auth.users:' as info;
SELECT id, email, created_at, email_confirmed_at
FROM auth.users 
WHERE email IN ('student@demo.com', 'admin@demo.com')
ORDER BY email;

-- Step 2: Check what we have in our tables
SELECT 'Students table:' as info;
SELECT id, email, name, auth_user_id, signup_completed
FROM students 
WHERE email IN ('student@demo.com', 'admin@demo.com');

SELECT 'Admin table:' as info;
SELECT id, email, name, created_at
FROM admin 
WHERE email IN ('student@demo.com', 'admin@demo.com');

-- Step 3: If demo accounts don't exist in auth.users, you need to create them
-- Go to Authentication > Users in your Supabase dashboard and create:
-- 1. student@demo.com with password: password123
-- 2. admin@demo.com with password: password123
-- Make sure to confirm their emails!

-- Step 4: After creating auth users, run this to set up the database records

-- Create demo student record
INSERT INTO students (id, email, name, kumon_dollars, auth_user_id, signup_completed)
SELECT 
    au.id,
    au.email,
    'Demo Student',
    100,
    au.id,
    true
FROM auth.users au
WHERE au.email = 'student@demo.com'
ON CONFLICT (email) DO UPDATE SET
    id = EXCLUDED.id,
    auth_user_id = EXCLUDED.auth_user_id,
    signup_completed = EXCLUDED.signup_completed;

-- Create demo admin record
INSERT INTO admin (id, email, name)
SELECT 
    au.id,
    au.email,
    'Demo Admin'
FROM auth.users au
WHERE au.email = 'admin@demo.com'
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name;

-- Step 5: Fix RLS policies to be more permissive for demo accounts
-- Drop existing policies
DROP POLICY IF EXISTS "Students can read own data" ON students;
DROP POLICY IF EXISTS "Students can update own data" ON students;
DROP POLICY IF EXISTS "Admins can read all students" ON students;
DROP POLICY IF EXISTS "Admins can create students" ON students;
DROP POLICY IF EXISTS "Admins can update all students" ON students;
DROP POLICY IF EXISTS "Admins can delete students" ON students;

-- Create more permissive policies
-- Students can read their own data
CREATE POLICY "Students can read own data" ON students
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- Students can update their own data
CREATE POLICY "Students can update own data" ON students
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Admins can read all students
CREATE POLICY "Admins can read all students" ON students
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- Admins can create students
CREATE POLICY "Admins can create students" ON students
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- Admins can update all students
CREATE POLICY "Admins can update all students" ON students
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- Admins can delete students
CREATE POLICY "Admins can delete students" ON students
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- Step 6: Fix admin table policies
DROP POLICY IF EXISTS "Users can read own admin record" ON admin;
DROP POLICY IF EXISTS "Admins can read admin table" ON admin;

CREATE POLICY "Users can read own admin record" ON admin
    FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Admins can read admin table" ON admin
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- Step 7: Verify everything is set up correctly
SELECT 'Final verification:' as info;

-- Check demo student
SELECT 
    'Demo Student' as account_type,
    EXISTS (SELECT 1 FROM auth.users WHERE email = 'student@demo.com') as in_auth_users,
    EXISTS (SELECT 1 FROM students WHERE email = 'student@demo.com') as in_students_table,
    EXISTS (SELECT 1 FROM students WHERE email = 'student@demo.com' AND signup_completed = true) as signup_completed
UNION ALL
-- Check demo admin
SELECT 
    'Demo Admin' as account_type,
    EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@demo.com') as in_auth_users,
    EXISTS (SELECT 1 FROM admin WHERE email = 'admin@demo.com') as in_admin_table,
    NULL as signup_completed;

-- Show all users in our tables
SELECT 'All students:' as info;
SELECT id, email, name, signup_completed FROM students ORDER BY email;

SELECT 'All admins:' as info;
SELECT id, email, name FROM admin ORDER BY email;

-- Test authentication for current user
SELECT 'Current user test:' as info;
SELECT 
    auth.uid() as current_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user_email,
    EXISTS (SELECT 1 FROM students WHERE id = auth.uid()) as is_student,
    EXISTS (SELECT 1 FROM admin WHERE id = auth.uid()) as is_admin;
