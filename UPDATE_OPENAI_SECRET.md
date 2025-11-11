# 🔑 Update to OpenAI API Key

## Step 1: Update Edge Function Secret

1. **Go to Edge Function Secrets:**
   - Visit: https://supabase.com/dashboard/project/hisjahzcvgzgzinshpja/functions/secrets

2. **Update the Secret:**
   - Find `LOVABLE_API_KEY` (if it exists)
   - Either update it or create a new secret named: `OPENAI_API_KEY`
   - Set the value to: `YOUR_OPENAI_API_KEY_HERE` (replace with your actual OpenAI API key)
   - Click "Save"

## Step 2: Deploy Updated Function

1. **Go to Edge Function Code:**
   - Visit: https://supabase.com/dashboard/project/hisjahzcvgzgzinshpja/functions/generate-product-image/code

2. **Update the Code:**
   - The code has been updated in your local file
   - Copy the entire contents of: `supabase/functions/generate-product-image/index.ts`
   - Paste into the Supabase editor
   - Click "Deploy updates"

## What Changed

- ✅ Changed from Lovable API to OpenAI DALL-E 3
- ✅ Updated API endpoint to `https://api.openai.com/v1/images/generations`
- ✅ Updated secret name from `LOVABLE_API_KEY` to `OPENAI_API_KEY`
- ✅ Updated response parsing for OpenAI format

## After Deployment

- ✅ Test image generation
- ✅ Should work with OpenAI DALL-E 3

