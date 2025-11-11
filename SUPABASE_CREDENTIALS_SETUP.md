# 🔑 Supabase Credentials Setup Complete

## ✅ Frontend Configuration (.env file)

The `.env` file has been created with your new Supabase credentials:

- **Project ID**: `hisjahzcvgzgzinshpja`
- **Project URL**: `https://hisjahzcvgzgzinshpja.supabase.co`
- **Anon Key**: Configured ✅

---

## 🔐 Edge Function Secrets Setup

You need to set these secrets in your Supabase Dashboard. The Edge Functions use these secrets for backend operations.

### Step 1: Go to Supabase Dashboard

1. Navigate to: https://supabase.com/dashboard/project/hisjahzcvgzgzinshpja
2. Go to: **Edge Functions** → **Settings** → **Secrets**
   - Direct link: https://supabase.com/dashboard/project/hisjahzcvgzgzinshpja/functions/secrets

### Step 2: Add/Update These Secrets

**Important**: Supabase automatically provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. You **DO NOT** need to add these as secrets (Supabase will show an error if you try).

You only need to add custom secrets:

#### 1. LOVABLE_API_KEY (Image Generation - Cursor User API Key)
```
key_ca69c88fa2fac20da31dcb8597c983989fe36929cc20e7fe58add8fc8efe1b70
```

**Note**: This is a Cursor User API Key. The code currently uses the Lovable AI Gateway endpoint (`https://ai.gateway.lovable.dev/v1/chat/completions`). If you encounter authentication or endpoint issues, the API endpoint may need to be updated to match Cursor's API.

#### 2. STRIPE_SECRET_KEY (Optional - if using Stripe payments)
```
sk_test_... (your Stripe secret key)
```

#### 3. STRIPE_WEBHOOK_SECRET (Optional - if using Stripe webhooks)
```
whsec_... (your Stripe webhook secret)
```

---

### ⚠️ Automatic Supabase Environment Variables

These are **automatically provided** by Supabase to Edge Functions - you don't need to add them:
- `SUPABASE_URL` = `https://hisjahzcvgzgzinshpja.supabase.co` ✅ Auto-provided
- `SUPABASE_ANON_KEY` = Your anon key ✅ Auto-provided
- `SUPABASE_SERVICE_ROLE_KEY` = Your service role key ✅ Auto-provided

---

## 📋 Quick Setup Checklist

- [x] Frontend `.env` file created
- [x] `SUPABASE_URL` - Automatically provided by Supabase ✅
- [x] `SUPABASE_ANON_KEY` - Automatically provided by Supabase ✅
- [x] `SUPABASE_SERVICE_ROLE_KEY` - Automatically provided by Supabase ✅
- [ ] `LOVABLE_API_KEY` secret set/updated in Edge Functions
- [ ] Database migrations applied (if needed)
- [ ] Edge Functions deployed

---

## 🚀 Next Steps

1. **Set Edge Function Secrets**: Follow Step 2 above in the Supabase Dashboard
2. **Apply Database Migrations**: Run the SQL files in `supabase/migrations/` if you haven't already
3. **Deploy Edge Functions**: Deploy your Edge Functions to Supabase
4. **Test the Application**: Start your dev server and test image generation

---

## 🔍 Verify Configuration

After setting up, you can verify:

1. **Frontend**: Check that `.env` file exists and has correct values
2. **Edge Functions**: In Supabase Dashboard → Edge Functions → Secrets, verify all secrets are set
3. **Test**: Try generating an image to verify the API key works

---

## 📝 Notes

- The `.env` file is for frontend (Vite) configuration
- Edge Function secrets are separate and stored in Supabase Dashboard
- Never commit `.env` file to git (it's already in `.gitignore`)
- Keep your service role key secret - never expose it in frontend code

