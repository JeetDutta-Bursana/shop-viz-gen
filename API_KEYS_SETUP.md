# API Keys & Environment Variables Setup Guide

This document provides a complete guide to setting up all required API keys and connections for the AI Product Image Generator application.

---

## 📋 Table of Contents

1. [Frontend Environment Variables](#frontend-environment-variables)
2. [Supabase Edge Function Secrets](#supabase-edge-function-secrets)
3. [Razorpay Configuration](#razorpay-configuration)
4. [Lovable AI Gateway API Key](#lovable-ai-gateway-api-key)
5. [Setup Instructions](#setup-instructions)

---

## 1. Frontend Environment Variables

These variables are used by the Vite frontend application.

### Location: `.env` file in the root directory

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

### How to Get Supabase Keys:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project** (or create a new one)
3. **Navigate to**: Settings → API
4. **Copy the following**:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **anon/public key** → Use as `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## 2. Supabase Edge Function Secrets

These secrets are configured in Supabase Dashboard and are automatically available to Edge Functions via `Deno.env.get()`.

### Location: Supabase Dashboard → Edge Functions → Secrets

Required secrets:

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
LOVABLE_API_KEY
```

### How to Set Up:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Navigate to**: Edge Functions → Settings (or use `supabase secrets set`)
4. **Add each secret**:

#### 2.1 Supabase Secrets

- **SUPABASE_URL**: Same as `VITE_SUPABASE_URL` (from Settings → API)
- **SUPABASE_ANON_KEY**: Same as `VITE_SUPABASE_PUBLISHABLE_KEY` (anon/public key)
- **SUPABASE_SERVICE_ROLE_KEY**: From Settings → API → **service_role key** (⚠️ Keep this secret!)

**⚠️ Important**: The service_role key bypasses Row Level Security. Never expose it to the frontend!

---

## 3. Razorpay Configuration

### 3.1 Razorpay API Keys

#### RAZORPAY_KEY_ID

**How to Get**:
1. **Go to Razorpay Dashboard**: https://dashboard.razorpay.com
2. **Navigate to**: Settings → API Keys
3. **For Test Mode**: Click "Generate Test Key"
4. **For Live Mode**: Complete KYC first, then "Generate Live Key"
5. **Copy the "Key ID"** (starts with `rzp_test_` for test mode or `rzp_live_` for production)
6. **Set as Edge Function secret**: `RAZORPAY_KEY_ID`

#### RAZORPAY_KEY_SECRET

**How to Get**:
1. **Same location as above**: Settings → API Keys
2. **Copy the "Key Secret"** (shown only once - save it!)
3. **Set as Edge Function secret**: `RAZORPAY_KEY_SECRET`

#### RAZORPAY_WEBHOOK_SECRET

**How to Get**:
1. **Go to Razorpay Dashboard**: https://dashboard.razorpay.com
2. **Navigate to**: Settings → Webhooks
3. **Click "Create Webhook"**
4. **Endpoint URL**: `https://your-project-id.supabase.co/functions/v1/razorpay-webhook`
5. **Select event**: `payment.captured`
6. **After creating, copy the "Webhook Secret"**
7. **Set as Edge Function secret**: `RAZORPAY_WEBHOOK_SECRET`

### 3.2 Razorpay Pricing

**✅ Already Configured in Code**

The pricing is already set in `src/pages/Pricing.tsx`:
- **Single Image**: ₹10 (1 credit)
- **10-Pack**: ₹79 (10 credits)
- **Pro Plan**: ₹499/mo (unlimited)

**No Price IDs needed** - Prices are configured directly in code (₹10, ₹79, ₹499)

---

## 4. Lovable AI Gateway API Key

### LOVABLE_API_KEY

**How to Get**:
1. **Go to Lovable Dashboard**: https://lovable.dev
2. **Navigate to**: Project Settings → API Keys (or check your Lovable project dashboard)
3. **Generate/Copy API Key**
4. **Set as Edge Function secret**: `LOVABLE_API_KEY`

**Note**: If you're using a Lovable project, the API key might be available in your project settings. If not available, you may need to:
- Contact Lovable support
- Check if there's an alternative AI service you can use
- Use a different AI image generation API (OpenAI DALL-E, Stability AI, etc.)

**Alternative**: If Lovable API is not accessible, you can modify the `generate-product-image` function to use:
- **OpenAI DALL-E 3**: Requires `OPENAI_API_KEY`
- **Stability AI**: Requires `STABILITY_API_KEY`
- **Replicate**: Requires `REPLICATE_API_TOKEN`

---

## 5. Setup Instructions

### Step-by-Step Setup:

#### Step 1: Create Frontend `.env` file

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
   ```

#### Step 2: Configure Supabase Edge Function Secrets

**Option A: Using Supabase Dashboard**
1. Go to: Supabase Dashboard → Edge Functions → Settings
2. Add each secret one by one

**Option B: Using Supabase CLI**
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Set secrets
supabase secrets set SUPABASE_URL=https://your-project-id.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your-anon-key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set RAZORPAY_KEY_ID=rzp_test_your_key_id
supabase secrets set RAZORPAY_KEY_SECRET=your_razorpay_secret
supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
supabase secrets set LOVABLE_API_KEY=your_lovable_api_key
```

#### Step 3: Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy generate-product-image
supabase functions deploy create-payment
supabase functions deploy razorpay-webhook
```

#### Step 4: Set Up Razorpay Webhook

1. In Razorpay Dashboard → Webhooks
2. Create webhook: `https://your-project-id.supabase.co/functions/v1/razorpay-webhook`
3. Select event: `payment.captured`
4. Copy the webhook secret and add to Supabase secrets

#### Step 5: Razorpay Pricing

1. ✅ Already configured in code (₹10, ₹79, ₹499)
2. No Price IDs needed - prices are set directly in `src/pages/Pricing.tsx`

#### Step 6: Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Test authentication
3. Test image upload
4. Test image generation (requires credits)
5. Test payment flow (use Razorpay test mode)

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** to git
2. **Never expose `SUPABASE_SERVICE_ROLE_KEY`** to frontend
3. **Use environment-specific keys** (test vs production)
4. **Rotate keys regularly** if compromised
5. **Use Razorpay test mode** during development
6. **Verify webhook signatures** (already implemented)

---

## 📝 Checklist

- [ ] Created `.env` file with Supabase frontend credentials
- [ ] Set all Supabase Edge Function secrets
- [ ] Created Razorpay account and obtained API keys
- [ ] Set up Razorpay webhook endpoint
- [ ] Pricing already configured in code (₹10, ₹79, ₹499)
- [ ] Obtained Lovable API key (or alternative)
- [ ] Deployed all Edge Functions
- [ ] Tested authentication flow
- [ ] Tested image generation
- [ ] Tested payment flow

---

## 🆘 Troubleshooting

### "LOVABLE_API_KEY not configured"
- Check if the secret is set in Supabase Edge Functions
- Verify the secret name matches exactly

### "Insufficient credits" error
- Check if user profile was created correctly
- Verify the database trigger is working
- Check credits in Supabase dashboard

### Razorpay webhook not working
- Verify webhook URL is correct
- Check webhook secret matches
- Ensure `payment.captured` event is selected
- Check Supabase function logs

### Image generation fails
- Verify LOVABLE_API_KEY is set
- Check API rate limits
- Review function logs in Supabase dashboard

---

## 📞 Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Razorpay Docs**: https://razorpay.com/docs
- **Lovable Docs**: https://docs.lovable.dev
- **Supabase Support**: https://supabase.com/support
- **Razorpay Support**: https://razorpay.com/support

---

## 📄 Environment Variables Summary

### Frontend (.env)
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

### Supabase Edge Functions (Secrets)
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
LOVABLE_API_KEY
```

### Razorpay Configuration
- Pricing (in code): ₹10, ₹79, ₹499 (already configured)
- Webhook endpoint: `/functions/v1/razorpay-webhook`

---

**Last Updated**: 2025-01-27

