-- Fix 406 Not Acceptable Error for Profiles Table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/hisjahzcvgzgzinshpja/sql/new

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate SELECT policy (this is what's causing 406 error)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Verify UPDATE policy exists
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Verify INSERT policy exists
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Success message
SELECT 'RLS policies recreated successfully!' as status;

