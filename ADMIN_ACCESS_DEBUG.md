# Admin Access Debug Guide

## Issue: Admin Access Being Denied

If you're experiencing "Access denied. Admin privileges required" errors, here's how to debug and fix it.

---

## Debugging Steps

### 1. Check Browser Console

Open your browser's developer console (F12) and look for these log messages:

```
Checking admin access for: [your-email]
Admin emails list: ["admin@bursana.ai", "admin@example.com"]
Has admin access by email: true/false
Profile data: {...}
Is admin by field: true/false
Final admin access result: true/false
```

### 2. Verify Your Email

The system checks admin access in two ways:

1. **Email List Check**: Your email must match one of these:
   - `admin@bursana.ai`
   - `admin@example.com`

2. **Database Field Check**: The `profiles.is_admin` field must be `true`

### 3. Check Your Email Format

Make sure your email is:
- **Lowercase**: The system converts emails to lowercase for comparison
- **Exact Match**: Must match exactly (case-insensitive)
- **No Extra Spaces**: Trimmed before comparison

---

## Common Issues and Solutions

### Issue 1: Email Not in Admin List

**Problem**: Your email doesn't match the hardcoded admin emails.

**Solution**: Add your email to the `ADMIN_EMAILS` list in:
- `src/pages/Admin.tsx` (line 33-36)
- `src/pages/AdminAuth.tsx` (line 28-31)
- `src/pages/Dashboard.tsx` (line 57-59)
- `src/pages/Auth.tsx` (line 70-72)
- `src/pages/Index.tsx` (line 23-25)
- `src/pages/Pricing.tsx` (line 60-62)
- `supabase/functions/generate-product-image/index.ts` (line 30-33)

**Example**:
```typescript
const ADMIN_EMAILS = [
  "admin@bursana.ai",
  "admin@example.com",
  "your-email@example.com", // Add your email here
];
```

### Issue 2: `is_admin` Field Doesn't Exist

**Problem**: The `profiles.is_admin` field doesn't exist in your database.

**Solution**: Add the `is_admin` field to your `profiles` table:

```sql
-- Run this in your Supabase SQL editor
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Grant admin access to a specific user
UPDATE profiles 
SET is_admin = TRUE 
WHERE email = 'your-email@example.com';
```

### Issue 3: `is_admin` Field is NULL or FALSE

**Problem**: The `is_admin` field exists but is `NULL` or `FALSE`.

**Solution**: Update the field to `TRUE`:

```sql
-- Grant admin access to a specific user
UPDATE profiles 
SET is_admin = TRUE 
WHERE email = 'your-email@example.com';
```

### Issue 4: Profile Doesn't Exist

**Problem**: The user's profile doesn't exist in the `profiles` table.

**Solution**: Create a profile for the user:

```sql
-- Create profile if it doesn't exist
INSERT INTO profiles (id, email, is_admin)
VALUES (
  'user-uuid-here',
  'your-email@example.com',
  TRUE
)
ON CONFLICT (id) 
DO UPDATE SET is_admin = TRUE;
```

---

## Quick Fix: Add Your Email to Admin List

The quickest way to grant admin access is to add your email to the `ADMIN_EMAILS` list:

1. **Open** `src/pages/Admin.tsx`
2. **Find** the `ADMIN_EMAILS` array (around line 33)
3. **Add** your email:
   ```typescript
   const ADMIN_EMAILS = [
     "admin@bursana.ai",
     "admin@example.com",
     "your-email@example.com", // Add your email here
   ];
   ```
4. **Repeat** for all files that have `ADMIN_EMAILS` (see list above)
5. **Restart** your development server

---

## Database Fix: Set `is_admin` Field

For a more permanent solution, set the `is_admin` field in the database:

1. **Open** Supabase Dashboard
2. **Go to** SQL Editor
3. **Run** this query (replace with your email):
   ```sql
   UPDATE profiles 
   SET is_admin = TRUE 
   WHERE email = 'your-email@example.com';
   ```
4. **Verify** the update:
   ```sql
   SELECT email, is_admin 
   FROM profiles 
   WHERE email = 'your-email@example.com';
   ```

---

## Testing Admin Access

After making changes, test admin access:

1. **Sign Out** from your account
2. **Sign In** again with your admin email
3. **Navigate** to `/admin` or `/admin-auth`
4. **Check** browser console for debug logs
5. **Verify** you see "Welcome, Admin!" message

---

## Debug Logs Explained

When you access the admin page, you should see these console logs:

```
Checking admin access for: your-email@example.com
Admin emails list: ["admin@bursana.ai", "admin@example.com"]
Has admin access by email: true/false
Profile query error (this is OK if is_admin field doesn't exist): {...}
Profile data: {email: "...", is_admin: true/false}
Is admin by field: true/false
Final admin access result: true/false
```

**What to look for**:
- ✅ `Has admin access by email: true` → Email is in admin list
- ✅ `Is admin by field: true` → Database field is set correctly
- ✅ `Final admin access result: true` → Admin access granted
- ❌ `Has admin access by email: false` → Email not in admin list
- ❌ `Is admin by field: false` → Database field is FALSE or NULL
- ❌ `Final admin access result: false` → Admin access denied

---

## Best Practice: Use Database Field

Instead of hardcoding emails, use the `is_admin` field in the database:

1. **Add** the field to your `profiles` table
2. **Set** `is_admin = TRUE` for admin users
3. **Remove** hardcoded email checks (optional, for cleaner code)

This way, you can manage admin access from the database without code changes.

---

## Summary

**Quick Fix**: Add your email to `ADMIN_EMAILS` in all relevant files.

**Permanent Fix**: Set `is_admin = TRUE` in the database for your user.

**Debug**: Check browser console logs to see exactly why access is being denied.

---

## Need Help?

If you're still having issues:

1. Check browser console for error messages
2. Verify your email matches exactly (case-insensitive)
3. Check if `is_admin` field exists and is set to `TRUE`
4. Make sure your profile exists in the `profiles` table
5. Try signing out and signing in again

The debug logs will tell you exactly what's happening and why access is being denied.

