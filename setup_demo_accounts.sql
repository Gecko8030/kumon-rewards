-- Setup demo accounts for testing
-- Run this in your Supabase SQL Editor

-- First, let's check if the demo accounts exist in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email IN ('student@demo.com', 'admin@demo.com')
ORDER BY email;

-- Check if they exist in our tables
SELECT 'students' as table_name, id, email, name, auth_user_id, signup_completed
FROM students 
WHERE email IN ('student@demo.com', 'admin@demo.com')
UNION ALL
SELECT 'admin' as table_name, id, email, name, NULL as auth_user_id, NULL as signup_completed
FROM admin 
WHERE email IN ('student@demo.com', 'admin@demo.com');

-- If the demo accounts don't exist in auth.users, you need to create them first
-- Go to Authentication > Users in your Supabase dashboard and create:
-- 1. student@demo.com with password: password123
-- 2. admin@demo.com with password: password123

-- After creating the auth users, run this to get their IDs:
-- SELECT id, email FROM auth.users WHERE email IN ('student@demo.com', 'admin@demo.com');

-- Then update the queries below with the actual UUIDs and run them:

-- Create demo student record (replace 'STUDENT_AUTH_ID' with actual UUID)
-- INSERT INTO students (id, email, name, kumon_dollars, auth_user_id, signup_completed)
-- VALUES ('STUDENT_AUTH_ID', 'student@demo.com', 'Demo Student', 100, 'STUDENT_AUTH_ID', true)
-- ON CONFLICT (email) DO UPDATE SET
--     auth_user_id = EXCLUDED.auth_user_id,
--     signup_completed = EXCLUDED.signup_completed;

-- Create demo admin record (replace 'ADMIN_AUTH_ID' with actual UUID)
-- INSERT INTO admin (id, email, name)
-- VALUES ('ADMIN_AUTH_ID', 'admin@demo.com', 'Demo Admin')
-- ON CONFLICT (email) DO UPDATE SET
--     id = EXCLUDED.id;

-- Alternative: If you want to create the demo accounts automatically
-- (This will only work if the auth users already exist)

-- Get the auth user IDs
WITH auth_users AS (
    SELECT id, email FROM auth.users WHERE email IN ('student@demo.com', 'admin@demo.com')
)
-- Insert/update student record
INSERT INTO students (id, email, name, kumon_dollars, auth_user_id, signup_completed)
SELECT 
    au.id,
    au.email,
    'Demo Student',
    100,
    au.id,
    true
FROM auth_users au
WHERE au.email = 'student@demo.com'
ON CONFLICT (email) DO UPDATE SET
    auth_user_id = EXCLUDED.auth_user_id,
    signup_completed = EXCLUDED.signup_completed;

-- Insert/update admin record
INSERT INTO admin (id, email, name)
SELECT 
    au.id,
    au.email,
    'Demo Admin'
FROM auth_users au
WHERE au.email = 'admin@demo.com'
ON CONFLICT (email) DO UPDATE SET
    id = EXCLUDED.id;

-- Verify the setup
SELECT 'students' as table_name, id, email, name, auth_user_id, signup_completed
FROM students 
WHERE email = 'student@demo.com'
UNION ALL
SELECT 'admin' as table_name, id, email, name, NULL as auth_user_id, NULL as signup_completed
FROM admin 
WHERE email = 'admin@demo.com';
