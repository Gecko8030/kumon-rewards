-- Add grade field to students table
-- Run this in your Supabase SQL Editor

-- Add grade column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS grade text;

-- Update existing students with a default grade if they don't have one
UPDATE students SET grade = 'Grade 1' WHERE grade IS NULL;

-- Make grade column not null with a default value
ALTER TABLE students ALTER COLUMN grade SET DEFAULT 'Grade 1';
ALTER TABLE students ALTER COLUMN grade SET NOT NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'students' AND column_name = 'grade';
