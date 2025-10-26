-- Add password column to students table for deferred auth creation
-- Run this in your Supabase SQL Editor

-- Step 1: Add password column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);
ALTER TABLE students ADD COLUMN IF NOT EXISTS signup_completed BOOLEAN DEFAULT false;

-- Step 2: Update existing students to mark them as completed if they have matching auth users
UPDATE students 
SET signup_completed = true, auth_user_id = au.id
FROM auth.users au
WHERE students.email = au.email
AND students.auth_user_id IS NULL;

-- Step 3: Fix RLS policies to allow admin to insert students with passwords
DROP POLICY IF EXISTS "Admins can create students" ON students;

CREATE POLICY "Admins can create students" ON students
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- Step 4: Verify the changes
SELECT 'Students table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'students'
ORDER BY ordinal_position;

-- Step 5: Show current students and their auth status
SELECT 'Current students auth status:' as info;
SELECT 
    id,
    email,
    name,
    CASE 
        WHEN signup_completed THEN 'Auth account exists'
        WHEN password IS NOT NULL THEN 'Password stored, auth pending'
        ELSE 'No auth setup'
    END as auth_status,
    created_at
FROM students 
ORDER BY created_at DESC;
