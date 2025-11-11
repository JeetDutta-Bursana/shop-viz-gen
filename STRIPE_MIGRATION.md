# ✅ Razorpay to Stripe Migration - Complete

## 🎯 What Changed

All Razorpay payment configuration has been replaced with Stripe.

---

## 📝 Changes Made

### 1. **Edge Functions**

#### ✅ `create-payment/index.ts` - UPDATED
- **Before:** Used Razorpay API to create orders
- **After:** Uses Stripe SDK to create checkout sessions
- **Changes:**
  - Removed Razorpay API calls
  - Added Stripe SDK import
  - Creates Stripe Checkout Sessions
  - Returns session ID and URL for redirect
  - Uses `STRIPE_SECRET_KEY` instead of `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

#### ✅ `stripe-webhook/index.ts` - NEW
- **Before:** `razorpay-webhook/index.ts` handled Razorpay webhooks
- **After:** `stripe-webhook/index.ts` handles Stripe webhooks
- **Changes:**
  - Listens for `checkout.session.completed` event (instead of `payment.captured`)
  - Uses Stripe SDK for signature verification
  - Uses `STRIPE_WEBHOOK_SECRET` instead of `RAZORPAY_WEBHOOK_SECRET`

#### ❌ `razorpay-webhook/index.ts` - DELETED
- Old Razorpay webhook function removed

### 2. **Frontend Code**

#### ✅ `src/pages/Pricing.tsx` - UPDATED
- **Before:** Used Razorpay Checkout modal
- **After:** Uses Stripe Checkout redirect
- **Changes:**
  - Removed Razorpay script loading
  - Removed Razorpay checkout modal integration
  - Changed to redirect to Stripe Checkout URL
  - Updated prices from INR (₹) to USD ($)
  - Updated error messages to reference Stripe
  - Updated footer text: "powered by Stripe"

#### ✅ `src/pages/BursanaAI.tsx` - UPDATED
- **Before:** Used Razorpay Checkout modal
- **After:** Uses Stripe Checkout redirect
- **Changes:**
  - Removed Razorpay checkout function
  - Updated to redirect to Stripe Checkout URL
  - Updated prices from INR (₹) to USD ($)
  - Updated payment success handling to check for session_id

### 3. **Environment Variables**

#### ✅ Edge Function Secrets (Updated)
- **Removed:**
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
  - `RAZORPAY_WEBHOOK_SECRET`
  
- **Added:**
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`

#### ✅ Frontend `.env` (No Changes)
- Still only needs Supabase credentials
- Stripe keys are only in Edge Function secrets

### 4. **Pricing**

Prices have been converted from INR to USD:
- Single Image: ₹10 → $0.15
- 10-Pack: ₹79 → $1.00
- Pro Plan: ₹499 → $6.00

---

## 🔧 What You Need to Do

### 1. **Set Up Stripe Account**
1. Sign up at https://stripe.com
2. Get your **Secret Key** from dashboard
3. Test mode: `sk_test_...`
4. Production mode: `sk_live_...`

### 2. **Set Edge Function Secrets**
In Supabase Dashboard → Edge Functions → Secrets:

```
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 3. **Deploy Edge Functions**
```bash
supabase functions deploy create-payment
supabase functions deploy stripe-webhook
```

### 4. **Set Up Stripe Webhook**
1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter endpoint URL: `https://your-project-id.supabase.co/functions/v1/stripe-webhook`
4. Select events: `checkout.session.completed`
5. Copy webhook signing secret and add to Edge Function secrets as `STRIPE_WEBHOOK_SECRET`

### 5. **Remove Old Razorpay Secrets**
Remove these from Supabase Edge Function secrets:
- `RAZORPAY_KEY_ID` (if exists)
- `RAZORPAY_KEY_SECRET` (if exists)
- `RAZORPAY_WEBHOOK_SECRET` (if exists)

---

## 📊 Pricing Packages

The pricing is now set in USD:

| Package | Price | Credits |
|---------|-------|---------|
| Single Image | $0.15 | 1 |
| 10-Pack | $1.00 | 10 |
| Pro Plan | $6.00 | 100 |

**No Price IDs needed** - Prices are configured directly in code.

---

## 🔄 Migration Checklist

- [x] Updated `create-payment` Edge Function
- [x] Created `stripe-webhook` Edge Function
- [x] Deleted `razorpay-webhook` Edge Function
- [x] Updated `Pricing.tsx` frontend component
- [x] Updated `BursanaAI.tsx` frontend component
- [x] Updated pricing to USD
- [ ] **You need to:** Set Stripe credentials in Supabase
- [ ] **You need to:** Deploy Edge Functions
- [ ] **You need to:** Configure Stripe webhook
- [ ] **You need to:** Remove Razorpay secrets from Supabase

---

## 🔍 Testing

### Test Mode
1. Use Stripe test mode keys (`sk_test_...`)
2. Use Stripe test cards: https://stripe.com/docs/testing
3. Test webhook locally using Stripe CLI: `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook`

### Production Mode
1. Switch to Stripe live mode keys (`sk_live_...`)
2. Update webhook endpoint URL to production URL
3. Test with real payment methods

---

## 📚 Resources

- **Stripe Docs:** https://stripe.com/docs
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Stripe Testing:** https://stripe.com/docs/testing

