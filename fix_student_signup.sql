-- Fix student signup process
-- Run this in your Supabase SQL Editor

-- Check if student_id column exists in students table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'students' AND column_name = 'student_id'
    ) THEN
        -- Add student_id column if it doesn't exist
        ALTER TABLE students ADD COLUMN student_id text;
        RAISE NOTICE 'Added student_id column to students table';
    ELSE
        RAISE NOTICE 'student_id column already exists in students table';
    END IF;
END $$;

-- Make sure the students table allows null id initially (for signup process)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'students' AND column_name = 'id' AND is_nullable = 'NO'
    ) THEN
        -- Make id nullable temporarily for signup process
        ALTER TABLE students ALTER COLUMN id DROP NOT NULL;
        RAISE NOTICE 'Made id column nullable in students table for signup process';
    ELSE
        RAISE NOTICE 'id column is already nullable in students table';
    END IF;
END $$;

-- Update RLS policies to allow student signup
-- Allow students to update their own record during signup
DROP POLICY IF EXISTS "Students can update their own record" ON students;
CREATE POLICY "Students can update their own record" ON students
    FOR UPDATE USING (auth.uid() = id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Allow inserting student records (for admin creation)
DROP POLICY IF EXISTS "Allow student record creation" ON students;
CREATE POLICY "Allow student record creation" ON students
    FOR INSERT WITH CHECK (true);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'students'
ORDER BY ordinal_position;
