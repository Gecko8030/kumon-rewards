-- Mark signup as completed for existing students
-- Run this in your Supabase SQL Editor

-- First, let's see the current status
SELECT id, email, name, auth_user_id, signup_completed
FROM students 
WHERE auth_user_id = 'ef041adc-94c0-460d-9d06-8aae07ac7d9e'
OR id = 'ef041adc-94c0-460d-9d06-8aae07ac7d9e';

-- Update the student record to mark signup as completed
UPDATE students 
SET 
    signup_completed = true,
    auth_user_id = 'ef041adc-94c0-460d-9d06-8aae07ac7d9e'
WHERE id = 'ef041adc-94c0-460d-9d06-8aae07ac7d9e'
OR email = 'student@demo.com';

-- Verify the update
SELECT id, email, name, auth_user_id, signup_completed
FROM students 
WHERE auth_user_id = 'ef041adc-94c0-460d-9d06-8aae07ac7d9e'
OR id = 'ef041adc-94c0-460d-9d06-8aae07ac7d9e'
OR email = 'student@demo.com';
