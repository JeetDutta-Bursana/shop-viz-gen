# Requirements Checklist - Production & Localhost Ready

## 📋 What You Need to Provide

This checklist covers everything needed to make your project production-ready and localhost-ready.

---

## 🔐 1. Supabase Setup (Required)

### A. Supabase Project
- [ ] **Supabase Account** - Sign up at https://supabase.com
- [ ] **Project Created** - Create a new Supabase project
- [ ] **Project ID** - Found in project settings

### B. Frontend Environment Variables (`.env` file)
Location: `shop-viz-gen/.env`

You need to provide:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

**Where to get these:**
- Go to: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api`
- Copy **Project URL** → `VITE_SUPABASE_URL`
- Copy **anon public** key → `VITE_SUPABASE_PUBLISHABLE_KEY`

### C. Supabase Edge Function Secrets (6 secrets)
Location: Supabase Dashboard → Edge Functions → Secrets

You need to provide:
1. **SUPABASE_URL** = `https://your-project-id.supabase.co`
2. **SUPABASE_ANON_KEY** = Your anon/public key
3. **SUPABASE_SERVICE_ROLE_KEY** = Your service_role key (keep secret!)
4. **STRIPE_SECRET_KEY** = From Stripe (see section 2)
5. **STRIPE_WEBHOOK_SECRET** = From Stripe webhook (see section 2)
6. **LOVABLE_API_KEY** = From Lovable (see section 3)

**Where to get service_role key:**
- Same page as above: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api`
- Copy **service_role** key (⚠️ Keep this secret! Never expose in frontend)

### D. Database Migrations
- [ ] **Migrations Applied** - Run the SQL files in `supabase/migrations/`
- [ ] **Storage Bucket Created** - Should be created by migrations
- [ ] **RLS Policies Active** - Should be set up by migrations

---

## 💳 2. Stripe Setup (Required for Payments)

### A. Stripe Account
- [ ] **Stripe Account** - Sign up at https://stripe.com
- [ ] **Test Mode Enabled** - For development/testing
- [ ] **Production Mode** - For production

### B. Stripe API Keys
You need to provide:

**For Development (Test Mode):**
```
STRIPE_SECRET_KEY=sk_test_...
```

**For Production:**
```
STRIPE_SECRET_KEY=sk_live_...
```

**Where to get:**
- Go to: https://dashboard.stripe.com/apikeys
- Copy **Secret key** (starts with `sk_test_` or `sk_live_`)
- Keep this secret!

### C. Credit Packages (Already Configured)
The pricing is already set in the code:

1. **Single Image**
   - Price: $0.15
   - Credits: 1

2. **10-Pack**
   - Price: $1.00
   - Credits: 10

3. **Pro Plan**
   - Price: $6.00
   - Credits: 100

**No Price IDs needed** - Prices are configured directly in `src/pages/Pricing.tsx`

### D. Stripe Webhook
- [ ] **Webhook Endpoint Created**
  - URL: `https://your-project-id.supabase.co/functions/v1/stripe-webhook`
  - Events to listen for: `checkout.session.completed`
- [ ] **Webhook Secret Retrieved**
  - Copy the **Webhook signing secret** after creating the webhook (starts with `whsec_`)
  - Add to Supabase Edge Function secrets as `STRIPE_WEBHOOK_SECRET`

**Where to set up:**
- Go to: https://dashboard.stripe.com/webhooks
- Click "Add endpoint"
- Enter your Supabase function URL
- Select event: `checkout.session.completed`
- Copy the webhook signing secret

---

## 🤖 3. Lovable AI API Key (Required for Image Generation)

- [ ] **Lovable Account** - Sign up at https://lovable.dev
- [ ] **API Key** - Get from Lovable dashboard
- [ ] **API Key Added** - Add to Supabase Edge Function secrets as `LOVABLE_API_KEY`

**Where to get:**
- Go to: https://lovable.dev/dashboard (or your Lovable account)
- Navigate to API Keys section
- Generate or copy your API key

---

## 🚀 4. Deployment Configuration

### A. Localhost (Development)
- [ ] **Node.js Installed** - v18 or higher
- [ ] **npm Installed** - Comes with Node.js
- [ ] **Dependencies Installed** - Run `npm install`
- [ ] **`.env` file created** - With Supabase credentials
- [ ] **Dev server running** - `npm run dev`

### B. Production
- [ ] **Domain Name** (optional) - For custom domain
- [ ] **Production Environment Variables** - Same as `.env` but with production values
- [ ] **Supabase Project** - Production Supabase project
- [ ] **Stripe Production Keys** - Live mode keys
- [ ] **Edge Functions Deployed** - To production Supabase
- [ ] **Webhook URL Updated** - Production webhook URL in Stripe

---

## 📝 5. Code Changes Needed

### A. Pricing Page
**File:** `src/pages/Pricing.tsx`

✅ **Already Configured** - Pricing is set directly in code ($0.15, $1.00, $6.00)
- No Price IDs needed - prices are configured directly in `src/pages/Pricing.tsx`

### B. Environment-Specific URLs (if needed)
- [ ] **Localhost URLs** - Usually auto-detected
- [ ] **Production URLs** - Update webhook URLs if needed

---

## ✅ 6. Setup Steps Summary

### For Localhost (Development):
1. ✅ Create Supabase project
2. ✅ Get Supabase credentials (URL + anon key)
3. ✅ Create `.env` file with Supabase credentials
4. ✅ Run database migrations
5. ✅ Set Stripe test mode keys
6. ✅ Pricing already configured in code ($0.15, $1.00, $6.00)
7. ✅ Get Lovable API key
8. ✅ Set all 6 Edge Function secrets
9. ✅ Deploy Edge Functions
10. ✅ Set up Stripe webhook (test mode)
12. ✅ Run `npm install`
13. ✅ Run `npm run dev`

### For Production:
1. ✅ Create production Supabase project
2. ✅ Get production Supabase credentials
3. ✅ Set production environment variables
4. ✅ Run database migrations (production)
5. ✅ Set Stripe live mode keys
6. ✅ Pricing already configured in code ($0.15, $1.00, $6.00)
7. ✅ Get Lovable API key (production)
8. ✅ Set all 6 Edge Function secrets (production)
9. ✅ Deploy Edge Functions (production)
10. ✅ Set up Stripe webhook (live mode) with production URL
12. ✅ Build: `npm run build`
13. ✅ Deploy to hosting (Vercel, Netlify, etc.)

---

## 📊 7. Quick Reference - What to Provide

### Minimum for Localhost (Basic Functionality):
```
✅ Supabase:
   - Project URL
   - Anon key
   - Service role key

✅ Stripe:
   - Test Secret Key
   - Pricing already configured in code

✅ Lovable:
   - API key
```

### Full Production:
```
✅ Everything above, plus:
   - Production Supabase project
   - Stripe live keys
   - Production Lovable API key
   - Domain name (optional)
   - Hosting configuration
```

---

## 🆘 8. Where to Get Help

- **Supabase Docs:** https://supabase.com/docs
- **Stripe Docs:** https://stripe.com/docs
- **Lovable Docs:** https://docs.lovable.dev
- **Setup Guide:** See `SETUP_INSTRUCTIONS.md`
- **API Keys Guide:** See `ALL_API_KEYS_AND_CONNECTIONS.md`

---

## 📋 Quick Checklist

Copy this checklist and check off items as you complete them:

**Setup:**
- [ ] Supabase project created
- [ ] `.env` file created with Supabase credentials
- [ ] Database migrations run
- [ ] Stripe account created
- [ ] Stripe test keys generated
- [ ] Pricing already configured in code ($0.15, $1.00, $6.00)
- [ ] Lovable API key obtained
- [ ] Edge Function secrets set (6 secrets)
- [ ] Edge Functions deployed
- [ ] Stripe webhook configured
- [ ] Dependencies installed (`npm install`)
- [ ] Dev server running (`npm run dev`)
- [ ] Tested authentication
- [ ] Tested image upload
- [ ] Tested image generation
- [ ] Tested payment flow

---

**Once you provide these, I can help you:**
1. Create the `.env` file
2. Update the Price IDs in `Pricing.tsx`
3. Set up the Edge Function secrets
4. Deploy the Edge Functions
5. Configure the webhook
6. Test everything works

**Just share:**
- Your Supabase credentials (URL + anon key)
- Your Stripe API keys (Secret Key)
- Your Lovable API key

And I'll help you configure everything! 🚀

