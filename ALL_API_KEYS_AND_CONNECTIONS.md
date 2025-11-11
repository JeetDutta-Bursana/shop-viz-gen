# 🔑 All API Keys and Connections Required

This document lists ALL API keys, secrets, and connection strings needed for the AI Product Image Generator application.

---

## 📋 Complete List of Required Credentials

### 1. **Frontend Environment Variables** (`.env` file)
**Location**: Root directory of `shop-viz-gen/`

| Variable            | Description          | Example Format              |
|---------------------|----------------------|-----------------------------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anonymous/public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

**Where to Get**:
- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api
- Copy **Project URL** → `VITE_SUPABASE_URL`
- Copy **anon public** key → `VITE_SUPABASE_PUBLISHABLE_KEY`

---

### 2. **Supabase Edge Function Secrets** (6 required)
**Location**: Supabase Dashboard → Edge Functions → Secrets

| Secret Name | Used By | Description |
|------------|---------|-------------|
| `SUPABASE_URL` | All functions | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | `create-payment` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | `generate-product-image`, `razorpay-webhook` | Service role key (⚠️ secret) |
| `RAZORPAY_KEY_ID` | `create-payment` | Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | `create-payment`, `razorpay-webhook` | Razorpay Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | `razorpay-webhook` | Razorpay webhook signing secret |
| `LOVABLE_API_KEY` | `generate-product-image` | Lovable AI Gateway API key |

#### Where to Get Each:

**Supabase Keys**:
- **Location**: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api
- `SUPABASE_URL` → **Project URL**
- `SUPABASE_ANON_KEY` → **anon public** key
- `SUPABASE_SERVICE_ROLE_KEY` → **service_role** key (⚠️ Never expose to frontend!)

**Razorpay Keys**:
- **Location**: https://dashboard.razorpay.com/app/keys
- `RAZORPAY_KEY_ID` → **Settings** → **API Keys** → **Key ID** (starts with `rzp_test_` or `rzp_live_`)
- `RAZORPAY_KEY_SECRET` → **Settings** → **API Keys** → **Key Secret** (keep secret!)
- `RAZORPAY_WEBHOOK_SECRET` → **Settings** → **Webhooks** → Create webhook → Copy **Webhook Secret**

**Lovable AI Gateway**:
- **Location**: https://lovable.dev (or your Lovable project dashboard)
- `LOVABLE_API_KEY` → **Project Settings** → **API Keys** → Generate/Copy key

---

### 3. **Razorpay Pricing** (Already Configured)
**Location**: Code file - `src/pages/Pricing.tsx`

| Package | Price | Credits | Description |
|---------|-------|---------|-------------|
| Single Image | ₹10 | 1 | Instant download |
| 10-Pack | ₹79 | 10 | Bulk showcase creation |
| Pro Plan | ₹499/mo | Unlimited | Unlimited uploads |

**✅ No Price IDs needed** - Prices are configured directly in code (₹10, ₹79, ₹499)

---

### 4. **Razorpay Webhook Configuration**
**Location**: Razorpay Dashboard → Webhooks

| Setting | Value |
|---------|-------|
| **Endpoint URL** | `https://YOUR_PROJECT_ID.supabase.co/functions/v1/razorpay-webhook` |
| **Events to listen for** | `payment.captured` |
| **Webhook secret** | Copy after creation → Use as `RAZORPAY_WEBHOOK_SECRET` |

**How to Set Up**:
1. Go to: https://dashboard.razorpay.com/app/webhooks
2. Click **"Create Webhook"**
3. Enter endpoint URL: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/razorpay-webhook`
4. Select event: `payment.captured`
5. Click **"Create Webhook"**
6. Copy the **Webhook Secret** → Add to Supabase secrets as `RAZORPAY_WEBHOOK_SECRET`

---

## 📝 Setup Summary

### Total Credentials Needed:

1. **Frontend** (`.env` file): **2 variables**
2. **Supabase Edge Functions** (Secrets): **6 secrets**
3. **Razorpay Pricing** (Code): **Already configured** (₹10, ₹79, ₹499)
4. **Razorpay Webhook**: **1 endpoint URL**

**Total: 8 credentials/configurations**

---

## 🚀 Quick Setup Commands

### Step 1: Create Frontend .env
```bash
cd shop-viz-gen
cp env.template .env
# Edit .env with your Supabase credentials
```

### Step 2: Set Supabase Secrets (CLI)
```bash
supabase link --project-ref YOUR_PROJECT_ID
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your_anon_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set RAZORPAY_KEY_ID=rzp_test_your_key_id
supabase secrets set RAZORPAY_KEY_SECRET=your_razorpay_secret
supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
supabase secrets set LOVABLE_API_KEY=your_lovable_key
```

### Step 3: Razorpay Pricing
- ✅ Already configured in code (₹10, ₹79, ₹499)
- No Price IDs needed - prices are set directly in `src/pages/Pricing.tsx`

### Step 4: Set Up Razorpay Webhook
- Go to Razorpay Dashboard → Webhooks
- Create webhook: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/razorpay-webhook`
- Select event: `payment.captured`
- Copy webhook secret → Add to Supabase secrets as `RAZORPAY_WEBHOOK_SECRET`

---

## 🔒 Security Notes

1. **Never commit `.env` file** to git
2. **Never expose `SUPABASE_SERVICE_ROLE_KEY`** to frontend
3. **Use Razorpay test mode** during development
4. **Rotate keys** if compromised
5. **Verify webhook signatures** (already implemented in code)

---

## 📊 Credentials Checklist

### Frontend (.env)
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY`

### Supabase Edge Functions Secrets
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `RAZORPAY_KEY_ID`
- [ ] `RAZORPAY_KEY_SECRET`
- [ ] `RAZORPAY_WEBHOOK_SECRET`
- [ ] `LOVABLE_API_KEY`

### Razorpay Configuration
- [ ] Created Razorpay account
- [ ] Generated test/live keys
- [ ] Set up webhook endpoint
- [ ] Added webhook secret to Supabase
- [ ] Pricing already configured in code (₹10, ₹79, ₹499)

---

## 🆘 Troubleshooting

### "VITE_SUPABASE_URL is undefined"
- Check `.env` file exists in root directory
- Verify variable names start with `VITE_`
- Restart dev server after creating `.env`

### "LOVABLE_API_KEY not configured"
- Check Supabase Edge Function secrets
- Verify secret name matches exactly
- Redeploy function after setting secret

### "Insufficient credits"
- Check database trigger created profile
- Verify credits column in profiles table
- Check user has credits > 0

### Razorpay webhook not working
- Verify webhook URL is correct
- Check webhook secret matches
- Ensure event `payment.captured` is selected
- Check Supabase function logs

---

## 📞 Support Links

- **Supabase**: https://supabase.com/docs
- **Razorpay**: https://razorpay.com/docs
- **Lovable**: https://docs.lovable.dev
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Razorpay Dashboard**: https://dashboard.razorpay.com

---

**Last Updated**: 2025-01-27

