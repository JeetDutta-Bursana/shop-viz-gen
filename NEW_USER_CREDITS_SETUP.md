# New User Credits Setup

## Overview

All new user accounts automatically receive **5 free credits** when they sign up. This is handled by a database trigger that creates a profile with 5 credits whenever a new user is created.

---

## How It Works

### Database Trigger

When a new user signs up through Supabase Auth, a trigger automatically:

1. **Creates a profile** in the `profiles` table
2. **Sets credits to 5** for the new user
3. **Sets is_admin to FALSE** by default

### Trigger Function

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits, is_admin)
  VALUES (NEW.id, NEW.email, 5, FALSE)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;
```

### Trigger Setup

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## User Experience

### Regular Users

1. **Sign Up**: User creates an account
2. **Profile Created**: Database trigger automatically creates profile
3. **5 Credits Granted**: User receives 5 free credits
4. **Ready to Use**: User can immediately generate images

### Admin Users

1. **Sign Up**: Admin creates an account (via `/admin-auth`)
2. **Profile Created**: Database trigger creates profile with 5 credits
3. **Admin Status Set**: `is_admin` is set to `TRUE` via frontend
4. **Unlimited Credits**: Frontend shows "Unlimited" (credits remain at 5 in DB, but frontend displays -1/unlimited)
5. **No Credit Deduction**: Admin users never have credits deducted

---

## Database Schema

### Profiles Table

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  credits INTEGER DEFAULT 5,  -- Default is 5
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Default Values

- **credits**: `DEFAULT 5` (guaranteed by trigger)
- **is_admin**: `DEFAULT FALSE` (set to TRUE for admin users)

---

## Migration Files

### Latest Migration

**File**: `supabase/migrations/20250108000000_ensure_5_free_credits.sql`

This migration:
- ✅ Updates the `handle_new_user()` function
- ✅ Ensures the trigger is properly configured
- ✅ Sets default value for credits column to 5
- ✅ Updates existing users with NULL credits to 5

---

## Testing

### Test New User Signup

1. **Sign Up**: Create a new account via `/auth`
2. **Check Profile**: Verify profile was created in database
3. **Check Credits**: Verify credits = 5 in database
4. **Check Frontend**: Verify credits display as "5" in UI

### Test Admin User Signup

1. **Sign Up**: Create a new admin account via `/admin-auth`
2. **Check Profile**: Verify profile was created with credits = 5
3. **Check Admin Status**: Verify `is_admin = TRUE` in database
4. **Check Frontend**: Verify credits display as "Unlimited" in UI

---

## Troubleshooting

### Issue: New users don't get 5 credits

**Solution**: 
1. Check if the trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

2. Check if the function exists:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
   ```

3. Re-run the migration:
   ```sql
   -- Run the migration file: 20250108000000_ensure_5_free_credits.sql
   ```

### Issue: Existing users don't have credits

**Solution**: 
1. Update existing users with NULL credits:
   ```sql
   UPDATE public.profiles 
   SET credits = 5 
   WHERE credits IS NULL;
   ```

2. Or set all users without credits to 5:
   ```sql
   UPDATE public.profiles 
   SET credits = 5 
   WHERE credits IS NULL OR credits = 0;
   ```

### Issue: Admin users showing credits instead of unlimited

**Solution**: 
1. Verify `is_admin` field is set to `TRUE`:
   ```sql
   SELECT id, email, credits, is_admin 
   FROM public.profiles 
   WHERE email = 'admin@example.com';
   ```

2. Check frontend admin detection logic in `Dashboard.tsx` and `Admin.tsx`

---

## Summary

✅ **New users get 5 free credits automatically**
✅ **Trigger handles profile creation**
✅ **Default value ensures 5 credits**
✅ **Admin users get 5 credits initially (but show unlimited)**
✅ **Migration ensures proper setup**

All new user accounts will automatically receive 5 free credits when they sign up, allowing them to immediately start generating images without any additional setup.

