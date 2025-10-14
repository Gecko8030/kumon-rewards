-- Fix existing students by linking them with their auth users
-- Run this in your Supabase SQL Editor

-- First, let's see what we have
SELECT 
    s.id as student_id,
    s.email as student_email,
    s.name,
    s.auth_user_id,
    s.signup_completed,
    au.id as auth_user_id,
    au.email as auth_email
FROM students s
LEFT JOIN auth.users au ON s.email = au.email
ORDER BY s.created_at DESC;

-- Update existing students to link with their auth users
UPDATE students 
SET 
    auth_user_id = au.id,
    signup_completed = true
FROM auth.users au
WHERE students.email = au.email 
AND students.auth_user_id IS NULL;

-- Verify the updates
SELECT 
    s.id as student_id,
    s.email as student_email,
    s.name,
    s.auth_user_id,
    s.signup_completed,
    au.id as auth_user_id,
    au.email as auth_email
FROM students s
LEFT JOIN auth.users au ON s.email = au.email
ORDER BY s.created_at DESC;

-- Also check if there are any students without matching auth users
SELECT 
    s.id as student_id,
    s.email as student_email,
    s.name,
    s.auth_user_id,
    s.signup_completed
FROM students s
LEFT JOIN auth.users au ON s.email = au.email
WHERE au.id IS NULL
ORDER BY s.created_at DESC;
