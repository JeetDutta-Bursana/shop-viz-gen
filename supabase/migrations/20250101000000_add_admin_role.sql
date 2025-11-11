-- Add is_admin column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = TRUE;

-- Update existing admin emails to be admins (optional - uncomment if needed)
-- UPDATE public.profiles SET is_admin = TRUE WHERE email IN ('admin@bursana.ai', 'admin@example.com');

