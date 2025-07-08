-- Get user IDs for demo users
-- Run this after creating the demo users in Authentication > Users

-- Get all auth users (you'll need to run this in the Supabase dashboard SQL editor)
SELECT 
  id,
  email,
  created_at
FROM auth.users 
WHERE email IN ('admin@demo.com', 'student@demo.com')
ORDER BY email;

-- After you get the IDs, run these INSERT statements with the actual UUIDs:

-- For admin user (replace UUID with actual admin user ID):
-- INSERT INTO admin (id, email, name) VALUES 
-- ('PASTE_ADMIN_USER_ID_HERE', 'admin@demo.com', 'Demo Admin');

-- For student user (replace UUID with actual student user ID):
-- INSERT INTO students (id, email, name, level, kumon_dollars) VALUES 
-- ('PASTE_STUDENT_USER_ID_HERE', 'student@demo.com', 'Demo Student', 'Level A', 100); 