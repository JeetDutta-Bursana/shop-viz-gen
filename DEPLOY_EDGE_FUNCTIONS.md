# 🚀 Deploy Edge Functions to Supabase

## Issue: CORS Error - Edge Function Not Deployed

The error `Access to fetch at '.../functions/v1/generate-product-image' ... has been blocked by CORS policy` means your Edge Functions are not deployed yet.

## Solution: Deploy Edge Functions

### Option 1: Using Supabase Dashboard (Easiest)

1. **Go to Edge Functions:**
   - Visit: https://supabase.com/dashboard/project/hisjahzcvgzgzinshpja/functions
   - Or: **Edge Functions** in the left sidebar

2. **Deploy via Dashboard:**
   - Click **"Create a new function"** or **"Deploy function"**
   - You'll need to upload the function code

### Option 2: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```
   - This will open a browser for authentication

3. **Link your project:**
   ```bash
   supabase link --project-ref hisjahzcvgzgzinshpja
   ```
   - You may need to enter your database password

4. **Deploy the Edge Functions:**
   ```bash
   supabase functions deploy generate-product-image
   supabase functions deploy create-payment
   supabase functions deploy add-watermark
   ```

5. **Verify deployment:**
   - Go to: https://supabase.com/dashboard/project/hisjahzcvgzgzinshpja/functions
   - You should see all deployed functions listed

---

## Fix 406 Error: RLS Policy Issue

The 406 "Not Acceptable" error when fetching profiles suggests an RLS policy issue.

### Check RLS Policies:

1. **Go to Table Editor:**
   - Visit: https://supabase.com/dashboard/project/hisjahzcvgzgzinshpja/editor
   - Click on `profiles` table

2. **Check RLS Policies:**
   - Go to **Authentication** → **Policies** in left sidebar
   - Or: **Table Editor** → `profiles` → **Policies** tab

3. **Verify these policies exist:**
   - "Users can view own profile" (SELECT)
   - "Users can update own profile" (UPDATE)
   - "Users can insert own profile" (INSERT)

4. **If policies are missing, run this SQL:**

```sql
-- Recreate RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

---

## Quick Checklist

- [ ] Supabase CLI installed
- [ ] Logged in to Supabase CLI
- [ ] Project linked (`supabase link`)
- [ ] Edge Functions deployed
- [ ] RLS policies verified/created
- [ ] Test image generation

---

## After Deployment

Once Edge Functions are deployed:
1. The CORS error should be resolved
2. Image generation should work
3. Make sure `LOVABLE_API_KEY` is set in Edge Function secrets

