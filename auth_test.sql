-- Quick authentication test
-- Run this in your Supabase SQL Editor to see what's happening

-- Check if demo accounts exist in auth.users
SELECT 'Auth users check:' as info;
SELECT 
    email,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
        ELSE 'Not confirmed'
    END as email_status,
    created_at
FROM auth.users 
WHERE email IN ('student@demo.com', 'admin@demo.com')
ORDER BY email;

-- Check if they exist in our tables
SELECT 'Database tables check:' as info;
SELECT 
    'students' as table_name,
    email,
    CASE 
        WHEN signup_completed THEN 'Completed'
        ELSE 'Not completed'
    END as status
FROM students 
WHERE email IN ('student@demo.com', 'admin@demo.com')
UNION ALL
SELECT 
    'admin' as table_name,
    email,
    'Admin' as status
FROM admin 
WHERE email IN ('student@demo.com', 'admin@demo.com');

-- Check current user
SELECT 'Current user check:' as info;
SELECT 
    auth.uid() as user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as email,
    CASE 
        WHEN EXISTS (SELECT 1 FROM students WHERE id = auth.uid()) THEN 'Student'
        WHEN EXISTS (SELECT 1 FROM admin WHERE id = auth.uid()) THEN 'Admin'
        ELSE 'Not found in tables'
    END as user_type;

-- If demo accounts don't exist, here's what to do:
-- 1. Go to Authentication > Users in Supabase dashboard
-- 2. Click "Add user"
-- 3. Create student@demo.com with password password123
-- 4. Create admin@demo.com with password password123
-- 5. Make sure to confirm their emails!
-- 6. Then run the complete_auth_fix.sql script
