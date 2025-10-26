# Fix for Admin Authentication Error

## Problem
When trying to log in as an admin, you get the error:
> "Authentication Required - Your session has expired or you don't have proper access."

## Root Cause
The issue occurs because:
1. You can successfully authenticate with Supabase (login works)
2. But your user account is not in the `admin` table in the database
3. The app checks both `students` and `admin` tables to determine user type
4. If you're not in either table, it shows the authentication error

## Solution

### Option 1: Quick Fix (Recommended)
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `quick_admin_fix.sql`
4. Run the script

This will:
- Check if demo admin exists
- Add your current user to the admin table
- Add demo admin to the admin table (if it exists)
- Verify everything is working

### Option 2: Complete Fix
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `fix_admin_authentication_complete.sql`
4. Run the script

This provides more comprehensive fixes and debugging information.

### Option 3: Manual Setup
If you prefer to set up manually:

1. **Create Demo Admin Account** (if needed):
   - Go to Authentication > Users in Supabase dashboard
   - Click "Add user"
   - Email: `admin@demo.com`
   - Password: `password123`
   - Confirm email: Yes

2. **Add Users to Admin Table**:
   ```sql
   -- Add your current user
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
   
   -- Add demo admin (if exists)
   INSERT INTO admin (id, email, name)
   SELECT 
       au.id,
       au.email,
       'Demo Admin'
   FROM auth.users au
   WHERE au.email = 'admin@demo.com'
   ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       name = EXCLUDED.name;
   ```

## Testing
After applying the fix:
1. Try logging in with `admin@demo.com` / `password123`
2. Or log in with your own admin account
3. You should now be able to access the admin dashboard
4. Check the browser console for authentication logs

## Files Modified
- `fix_admin_authentication_complete.sql` - Comprehensive database fix
- `quick_admin_fix.sql` - Quick fix script
- `src/contexts/AuthContext.tsx` - Better error logging
- `src/components/ProtectedRoute.tsx` - Improved error messages

## Debugging
If you still have issues:
1. Check the browser console for error messages
2. Look for "User not found in students or admin table" errors
3. Verify your user exists in the `admin` table:
   ```sql
   SELECT * FROM admin WHERE id = auth.uid();
   ```

The error messages now provide specific guidance on which script to run.
