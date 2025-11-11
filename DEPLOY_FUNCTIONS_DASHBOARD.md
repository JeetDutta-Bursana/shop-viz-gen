# 🚀 Deploy Edge Functions via Supabase Dashboard

Since CLI requires browser login, here's how to deploy via the Dashboard:

## Method 1: Deploy via Supabase Dashboard (Easiest)

### Step 1: Go to Edge Functions
1. Visit: https://supabase.com/dashboard/project/hisjahzcvgzgzinshpja/functions
2. Or: Click **Edge Functions** in the left sidebar

### Step 2: Create/Deploy `generate-product-image` Function

1. Click **"Create a new function"** or **"New Function"**
2. Name it: `generate-product-image`
3. Copy the entire contents of: `supabase/functions/generate-product-image/index.ts`
4. Paste into the function editor
5. Click **"Deploy"** or **"Save"**

### Step 3: Verify Deployment
- The function should appear in the functions list
- Status should show as "Active" or "Deployed"

---

## Method 2: Use Supabase CLI (After Manual Login)

If you prefer CLI (after you manually login in browser):

1. **Login** (opens browser - you'll need to do this once):
   ```bash
   npx supabase login
   ```
   - Press Enter when prompted
   - Complete login in browser
   - Return to terminal

2. **Link project**:
   ```bash
   npx supabase link --project-ref hisjahzcvgzgzinshpja
   ```

3. **Deploy functions**:
   ```bash
   npx supabase functions deploy generate-product-image
   npx supabase functions deploy create-payment
   npx supabase functions deploy add-watermark
   ```

---

## Quick Fix for 406 Error

Run this SQL in Supabase SQL Editor:

```sql
-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Recreate SELECT policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);
```

---

## After Deployment

1. ✅ CORS error should be resolved
2. ✅ Image generation should work
3. ✅ Make sure `LOVABLE_API_KEY` is set in Edge Function secrets

