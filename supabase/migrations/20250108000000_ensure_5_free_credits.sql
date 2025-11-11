-- Ensure new users get 5 free credits on signup
-- This migration updates the handle_new_user function to guarantee 5 credits for all new users

-- Drop and recreate the function to ensure it's up to date
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert profile with 5 free credits for all new users
  -- Admin users will get 5 credits initially, but frontend will show unlimited (-1) if is_admin is true
  INSERT INTO public.profiles (id, email, credits, is_admin)
  VALUES (NEW.id, NEW.email, 5, FALSE)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update the default value for credits column to ensure it's 5
ALTER TABLE public.profiles 
  ALTER COLUMN credits SET DEFAULT 5;

-- For existing users who don't have a profile yet, this won't affect them
-- But if a profile exists without credits or with NULL credits, set to 5
-- Only update if credits is NULL (not if it's 0, to preserve existing user balances)
UPDATE public.profiles 
SET credits = 5 
WHERE credits IS NULL;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile with 5 free credits when a new user signs up';

