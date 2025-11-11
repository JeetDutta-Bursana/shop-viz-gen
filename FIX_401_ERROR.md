# 🔧 Fix 401 Unauthorized Error

## Problem
The Edge Function is getting a `401 Unauthorized` error from the AI service:
```
AI generation error: 401 {"type": "unauthorized", "message": "","details":""}
```

## Possible Causes

### 1. API Key Not Set Correctly
The `LOVABLE_API_KEY` secret might not be set in Supabase Edge Function secrets.

**Check:**
1. Go to: https://supabase.com/dashboard/project/hisjahzcvgzgzinshpja/functions/secrets
2. Verify `LOVABLE_API_KEY` exists and has the value: `key_ca69c88fa2fac20da31dcb8597c983989fe36929cc20e7fe58add8fc8efe1b70`

### 2. Cursor API Key Not Compatible with Lovable Endpoint
The Cursor User API Key might not work with the Lovable AI Gateway endpoint (`https://ai.gateway.lovable.dev/v1/chat/completions`).

**Solution Options:**

#### Option A: Get a Lovable API Key
If you have a Lovable account:
1. Go to: https://lovable.dev/dashboard
2. Get your Lovable API key
3. Update the secret in Supabase

#### Option B: Update to Cursor API Endpoint (If Available)
If Cursor has its own API endpoint, we need to update the code to use it instead of Lovable's endpoint.

#### Option C: Use Different AI Service
We could modify the function to use:
- OpenAI DALL-E 3
- Stability AI
- Replicate
- Other image generation APIs

## Quick Fix Steps

1. **Verify API Key in Secrets:**
   - Go to Edge Functions → Secrets
   - Check `LOVABLE_API_KEY` is set correctly

2. **Test API Key:**
   - The key format `key_...` suggests it's a Cursor key
   - It might not work with Lovable's endpoint

3. **Next Steps:**
   - If you have a Lovable account, get a Lovable API key
   - Or we can update the code to use a different AI service
   - Or find the correct Cursor API endpoint

