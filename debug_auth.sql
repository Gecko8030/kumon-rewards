-- Debug authentication issues
-- Run this in your Supabase SQL Editor

-- Check what auth users exist
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- Check what students exist
SELECT id, email, name, auth_user_id, signup_completed, created_at
FROM students 
ORDER BY created_at DESC;

-- Check what admins exist
SELECT id, email, name, created_at
FROM admin 
ORDER BY created_at DESC;

-- Check if there are any students with matching auth users
SELECT 
    s.id as student_id,
    s.email as student_email,
    s.name,
    s.auth_user_id,
    s.signup_completed,
    au.id as auth_user_id,
    au.email as auth_email,
    CASE 
        WHEN au.id IS NOT NULL THEN 'HAS_AUTH_USER'
        ELSE 'NO_AUTH_USER'
    END as status
FROM students s
LEFT JOIN auth.users au ON s.email = au.email
ORDER BY s.created_at DESC;

-- Check if there are any admins with matching auth users
SELECT 
    a.id as admin_id,
    a.email as admin_email,
    a.name,
    au.id as auth_user_id,
    au.email as auth_email,
    CASE 
        WHEN au.id IS NOT NULL THEN 'HAS_AUTH_USER'
        ELSE 'NO_AUTH_USER'
    END as status
FROM admin a
LEFT JOIN auth.users au ON a.email = au.email
ORDER BY a.created_at DESC;
