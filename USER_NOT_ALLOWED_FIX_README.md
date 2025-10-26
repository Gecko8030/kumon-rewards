# Fix for "User not allowed" Error

## Problem
When trying to create a student account, you get the error:
> "Account creation error: User not allowed"

## Root Cause
This error occurs because:
1. Supabase's authentication settings may be restricting user creation
2. The admin user may not have proper permissions to create users
3. Row Level Security (RLS) policies may be blocking the operation

## Solution

### Step 1: Run Database Fix Script
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `fix_user_not_allowed_error.sql`
4. Run the script

This script will:
- Check current authentication settings
- Fix RLS policies for admin operations
- Ensure your user is properly set up as admin
- Verify admin permissions

### Step 2: Check Supabase Authentication Settings
1. Go to Authentication → Settings in your Supabase dashboard
2. Check these settings:
   - **Enable email confirmations**: Should be ON
   - **Enable signup**: Should be ON
   - **Enable email change**: Should be ON
3. If any are OFF, turn them ON

### Step 3: Verify Admin Permissions
Run this query in SQL Editor to check if you're recognized as admin:
```sql
SELECT EXISTS (
    SELECT 1 FROM admin WHERE admin.id = auth.uid()
) as is_admin;
```

If this returns `false`, run the fix script again.

### Step 4: Alternative - Manual User Creation
If the admin creation still doesn't work, you can create users manually:

1. Go to Authentication → Users in Supabase dashboard
2. Click "Add user"
3. Create the student account manually:
   - Email: `studentid@kumon.local`
   - Password: `[password from form]`
   - Confirm email: Yes
4. Then add them to the students table:
```sql
INSERT INTO students (id, email, name, kumon_dollars, grade)
VALUES (
    '[user_id_from_auth]',
    'studentid@kumon.local',
    '[student_name]',
    0,
    '[grade]'
);
```

### Step 5: Test Student Creation
After applying the fix:
1. Try creating a student account through the admin dashboard
2. The error should be resolved
3. Check that the student appears in the student list

## Debugging
If you're still having issues:
1. Check the browser console for detailed error messages
2. Look for "User not allowed" or permission errors
3. Verify your admin status with the SQL query above
4. Check Supabase logs for authentication errors

## Files Modified
- `fix_user_not_allowed_error.sql` - Database fix script
- `src/pages/AdminDashboard.tsx` - Improved error handling

The error messages now provide specific guidance on which script to run.
