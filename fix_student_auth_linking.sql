-- Fix student authentication linking
-- Run this in your Supabase SQL Editor

-- First, let's see what's in the students table
SELECT id, email, name, kumon_dollars FROM students ORDER BY created_at DESC LIMIT 10;

-- Check if there are any students without proper auth linking
SELECT 
    s.id as student_id,
    s.email as student_email,
    s.name,
    au.id as auth_user_id,
    au.email as auth_email
FROM students s
LEFT JOIN auth.users au ON s.email = au.email
ORDER BY s.created_at DESC;

-- The issue is that students are created with random UUIDs instead of auth user IDs
-- We need to either:
-- 1. Update existing students to use auth user IDs, or
-- 2. Create a better signup flow

-- Option 1: Update existing students to link with auth users
-- (Only run this if you want to link existing students with their auth accounts)

-- First, let's see which students have matching auth users
SELECT 
    s.id as current_student_id,
    s.email,
    s.name,
    au.id as auth_user_id
FROM students s
INNER JOIN auth.users au ON s.email = au.email
WHERE s.id != au.id; -- Only show mismatched IDs

-- If you want to update the student records to use auth user IDs:
-- UPDATE students 
-- SET id = au.id
-- FROM auth.users au
-- WHERE students.email = au.email 
-- AND students.id != au.id;

-- Option 2: Create a better signup flow (recommended)
-- We'll modify the student creation to not create the student record until signup

-- Add a column to track if the student has completed signup
ALTER TABLE students ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);
ALTER TABLE students ADD COLUMN IF NOT EXISTS signup_completed BOOLEAN DEFAULT false;

-- Update existing students to mark them as completed if they have matching auth users
UPDATE students 
SET signup_completed = true, auth_user_id = au.id
FROM auth.users au
WHERE students.email = au.email;

-- Create a policy to allow students to complete their signup
DROP POLICY IF EXISTS "Students can complete signup" ON students;
CREATE POLICY "Students can complete signup" ON students
    FOR UPDATE TO authenticated
    USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    WITH CHECK (auth_user_id = auth.uid());

-- Allow students to read their own record after signup
DROP POLICY IF EXISTS "Students can read own data" ON students;
CREATE POLICY "Students can read own data" ON students
    FOR SELECT TO authenticated
    USING (auth_user_id = auth.uid() OR id = auth.uid());

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;
