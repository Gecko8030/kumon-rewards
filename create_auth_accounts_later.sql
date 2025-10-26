-- Create auth accounts for students with stored passwords
-- Run this AFTER fixing the "User not allowed" error
-- This script will create auth accounts for students who have passwords stored

-- Step 1: Check which students need auth accounts
SELECT 'Students needing auth accounts:' as info;
SELECT 
    id,
    email,
    name,
    student_id,
    password,
    CASE 
        WHEN signup_completed THEN 'Already has auth account'
        WHEN password IS NOT NULL THEN 'Needs auth account'
        ELSE 'No password stored'
    END as status
FROM students 
WHERE password IS NOT NULL 
AND signup_completed = false
ORDER BY created_at;

-- Step 2: Create auth accounts for students with stored passwords
-- Note: This will only work after fixing the "User not allowed" error
-- You'll need to run this manually for each student or use the Supabase dashboard

-- Example for one student (replace with actual values):
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (
--     'student-uuid-here',
--     'student@kumon.local',
--     crypt('password123', gen_salt('bf')),
--     NOW(),
--     NOW(),
--     NOW()
-- );

-- Step 3: After creating auth accounts, update students table
-- UPDATE students 
-- SET 
--     auth_user_id = 'auth-user-uuid-here',
--     signup_completed = true
-- WHERE id = 'student-uuid-here';

-- Step 4: Verify auth account creation
SELECT 'Verification - students with auth accounts:' as info;
SELECT 
    s.id,
    s.email,
    s.name,
    s.signup_completed,
    au.id as auth_user_id,
    au.email_confirmed_at
FROM students s
LEFT JOIN auth.users au ON s.auth_user_id = au.id
WHERE s.password IS NOT NULL
ORDER BY s.created_at;

-- Step 5: Clean up - remove passwords after auth accounts are created
-- (Only run this after all auth accounts are created)
-- UPDATE students 
-- SET password = NULL 
-- WHERE signup_completed = true 
-- AND password IS NOT NULL;
