# 🚀 Deploy Edge Function - Step by Step

## The CORS Error Means: Edge Function Not Deployed Yet

The error `Access to fetch at '.../functions/v1/generate-product-image' ... has been blocked by CORS policy` means the function doesn't exist or isn't deployed.

## Deploy via Supabase Dashboard (Easiest Method)

### Step 1: Go to Edge Functions
1. Visit: https://supabase.com/dashboard/project/hisjahzcvgzgzinshpja/functions
2. Or: Click **Edge Functions** in the left sidebar

### Step 2: Create New Function
1. Click **"Create a new function"** or **"New Function"** button
2. Function name: `generate-product-image` (exactly this name)
3. Click **"Create function"**

### Step 3: Copy Function Code
1. Open this file in your project: `supabase/functions/generate-product-image/index.ts`
2. Select ALL content (Ctrl+A)
3. Copy it (Ctrl+C)

### Step 4: Paste and Deploy
1. In the Supabase function editor, select all (Ctrl+A) and delete
2. Paste your copied code (Ctrl+V)
3. Click **"Deploy"** button (usually at the top right)

### Step 5: Verify
- The function should show as "Active" or "Deployed"
- Status should be green/active

---

## Alternative: Deploy via CLI (If Dashboard Doesn't Work)

If you want to use CLI:

1. **Login** (opens browser):
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

3. **Deploy**:
   ```bash
   npx supabase functions deploy generate-product-image
   ```

---

## After Deployment

✅ CORS error should be resolved
✅ Image generation should work
✅ Make sure `LOVABLE_API_KEY` is set in Edge Function secrets

---

## Quick Checklist

- [ ] Edge Function `generate-product-image` deployed
- [ ] Function shows as "Active" in dashboard
- [ ] `LOVABLE_API_KEY` secret is set
- [ ] Test image generation

