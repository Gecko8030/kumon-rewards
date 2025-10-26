-- Quick fix: Create demo admin account
-- Run this in your Supabase SQL Editor

-- Step 1: Check if demo admin exists in auth.users
SELECT 'Checking for demo admin in auth.users:' as info;
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'admin@demo.com';

-- Step 2: If demo admin doesn't exist, you need to create it manually
-- Go to Authentication > Users in your Supabase dashboard
-- Click "Add user" and create:
-- Email: admin@demo.com
-- Password: password123
-- Confirm email: Yes

-- Step 3: After creating the auth user, run this to add them to admin table
-- (Replace 'ADMIN_AUTH_ID' with the actual UUID from step 1)
INSERT INTO admin (id, email, name)
SELECT 
    au.id,
    au.email,
    'Demo Admin'
FROM auth.users au
WHERE au.email = 'admin@demo.com'
AND NOT EXISTS (SELECT 1 FROM admin WHERE admin.id = au.id)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name;

-- Step 4: Add current user to admin table (if not already there)
INSERT INTO admin (id, email, name) 
SELECT 
    auth.uid(),
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', au.email)
FROM auth.users au
WHERE au.id = auth.uid()
AND NOT EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid())
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name;

-- Step 5: Verify everything is set up
SELECT 'Verification:' as info;
SELECT 
    'Current user admin status:' as check_type,
    EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()) as result
UNION ALL
SELECT 
    'Demo admin status:' as check_type,
    EXISTS (SELECT 1 FROM admin WHERE admin.email = 'admin@demo.com') as result;

-- Show all admin users
SELECT 'All admin users:' as info;
SELECT id, email, name, created_at FROM admin ORDER BY created_at;
