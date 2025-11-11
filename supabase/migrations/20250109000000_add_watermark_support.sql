-- Add watermark support to track free credits and watermarked images

-- Add free_credits_remaining to profiles (tracks how many free credits user has left)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS free_credits_remaining INTEGER DEFAULT 5;

-- Update existing profiles to have 5 free credits if not set
UPDATE public.profiles 
SET free_credits_remaining = 5 
WHERE free_credits_remaining IS NULL;

-- Add is_free_credit flag to generations table to track if image was generated with free credits
ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS is_free_credit BOOLEAN DEFAULT false;

-- Update handle_new_user function to set free_credits_remaining
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits, free_credits_remaining)
  VALUES (NEW.id, NEW.email, 5, 5);
  RETURN NEW;
END;
$$;

-- Add index on is_free_credit for faster queries
CREATE INDEX IF NOT EXISTS idx_generations_is_free_credit ON public.generations(is_free_credit);
CREATE INDEX IF NOT EXISTS idx_generations_user_id_is_free_credit ON public.generations(user_id, is_free_credit);

