# Step-by-Step Authentication Fix

## The Problem
The authentication system is now checking if users exist in the database tables, but the demo accounts might not be properly set up.

## Solution Steps

### Step 1: Create Demo Accounts in Supabase Auth
1. Go to your Supabase project dashboard
2. Click on "Authentication" in the left sidebar
3. Click on "Users" tab
4. Click "Add user" button
5. Create these two accounts:

**Student Account:**
- Email: `student@demo.com`
- Password: `password123`
- Confirm email: ✅ (check this box)

**Admin Account:**
- Email: `admin@demo.com`
- Password: `password123`
- Confirm email: ✅ (check this box)

### Step 2: Run Database Fix Script
1. Go to "SQL Editor" in your Supabase dashboard
2. Copy and paste the contents of `complete_auth_fix.sql`
3. Click "Run" to execute the script

This script will:
- Check if demo accounts exist
- Create database records for the demo accounts
- Fix RLS policies
- Verify everything is working

### Step 3: Test Login
1. Go to your app's login page
2. Try logging in with:
   - **Student**: `student@demo.com` / `password123`
   - **Admin**: `admin@demo.com` / `password123`

### Step 4: If Still Having Issues
The app now has a fallback that should work for demo accounts even if the database setup isn't perfect. Check the browser console for any error messages.

## Alternative: Create Your Own Admin Account
If you want to use your own email as admin:
1. Create a user in Supabase Auth with your email
2. Run this SQL in the SQL Editor:
```sql
INSERT INTO admin (id, email, name) 
SELECT 
    auth.uid(),
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', au.email)
FROM auth.users au
WHERE au.id = auth.uid()
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name;
```

## Debugging
If you're still having issues:
1. Open browser console (F12)
2. Look for error messages
3. Check if you see "Demo admin detected" or "Demo student detected" messages
4. The app should now work even without perfect database setup

The authentication system is now more robust and should handle demo accounts properly.
