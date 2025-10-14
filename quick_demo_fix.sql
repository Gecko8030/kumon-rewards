-- Quick fix for demo accounts
-- Run these queries one by one in your Supabase SQL Editor

-- Step 1: Check if demo auth users exist
SELECT id, email, created_at 
FROM auth.users 
WHERE email IN ('student@demo.com', 'admin@demo.com');

-- Step 2: If no results above, you need to create the auth users first
-- Go to Authentication > Users in Supabase dashboard and create:
-- - student@demo.com with password: password123
-- - admin@demo.com with password: password123

-- Step 3: After creating auth users, get their IDs
SELECT id, email FROM auth.users WHERE email IN ('student@demo.com', 'admin@demo.com');

-- Step 4: Create demo student record (replace the UUID with actual student auth ID)
INSERT INTO students (id, email, name, kumon_dollars, auth_user_id, signup_completed)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'student@demo.com'),
    'student@demo.com', 
    'Demo Student', 
    100, 
    (SELECT id FROM auth.users WHERE email = 'student@demo.com'), 
    true
)
ON CONFLICT (email) DO UPDATE SET
    auth_user_id = EXCLUDED.auth_user_id,
    signup_completed = EXCLUDED.signup_completed;

-- Step 5: Create demo admin record (replace the UUID with actual admin auth ID)
INSERT INTO admin (id, email, name)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'admin@demo.com'),
    'admin@demo.com', 
    'Demo Admin'
)
ON CONFLICT (email) DO UPDATE SET
    id = EXCLUDED.id;

-- Step 6: Verify everything is set up correctly
SELECT 'student' as type, id, email, name, auth_user_id, signup_completed
FROM students WHERE email = 'student@demo.com'
UNION ALL
SELECT 'admin' as type, id, email, name, NULL as auth_user_id, NULL as signup_completed
FROM admin WHERE email = 'admin@demo.com';
