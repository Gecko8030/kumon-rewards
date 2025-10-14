-- Link a specific student with their auth user
-- Replace the email and UUID with your actual values

-- First, find your auth user ID by email
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'your-student-email@kumon.local';

-- Then, find your student record
SELECT id, email, name, auth_user_id, signup_completed
FROM students 
WHERE email = 'your-student-email@kumon.local';

-- Update the student record to link with auth user
-- Replace 'YOUR_AUTH_USER_ID' with the actual UUID from the first query
-- Replace 'YOUR_STUDENT_ID' with the actual UUID from the second query
UPDATE students 
SET 
    auth_user_id = 'YOUR_AUTH_USER_ID',
    signup_completed = true
WHERE id = 'YOUR_STUDENT_ID';

-- Verify the update
SELECT id, email, name, auth_user_id, signup_completed
FROM students 
WHERE email = 'your-student-email@kumon.local';
