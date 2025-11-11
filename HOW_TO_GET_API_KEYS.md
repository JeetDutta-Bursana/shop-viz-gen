# 🔑 How to Get All API Keys - Step by Step

## ⚠️ Important Notice

**I cannot provide your API keys** - they are personal credentials that you must obtain from each service's dashboard. This guide shows you exactly where to get each one.

---

## 📊 Current Status

### ❌ No API Keys Configured

- No `.env` file exists
- No API keys are set up
- **You cannot generate images yet** (needs Lovable API key)

**You need to get all API keys first!**

---

## 🤖 Lovable API Key - Image Generation Limits

### How Many Images Can You Generate?

**The answer depends on your Lovable account plan:**

1. **Check Your Lovable Dashboard**:
   - Go to: https://lovable.dev/dashboard
   - Sign in to your account
   - Check your subscription/plan
   - Look for "API Usage" or "Quota" section

2. **Typical Limits** (varies by plan):
   - **Free/Trial Plans**: Limited (check dashboard)
   - **Paid Plans**: Higher quotas
   - Each image generation = 1 API call

3. **How to Check**:
   - Log in to Lovable dashboard
   - Go to Account Settings or Billing
   - Look for "API calls remaining" or "Monthly quota"
   - Check usage statistics

**⚠️ Without a Lovable API key, you cannot generate any images.**

---

## 🔑 Step-by-Step: How to Get Each API Key

### 1️⃣ **Supabase Credentials** (3 keys needed)

#### Step 1: Create Supabase Account
1. Go to: https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub, Google, or email

#### Step 2: Create Project
1. Click "New Project"
2. Fill in:
   - **Name**: Your project name
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
3. Click "Create new project"
4. Wait 2-3 minutes for setup

#### Step 3: Get API Keys
1. Go to: **Project Settings** → **API**
   - Or: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api
2. Copy these 3 values:

```
✅ VITE_SUPABASE_URL = https://xxxxx.supabase.co
   (Copy "Project URL")

✅ VITE_SUPABASE_PUBLISHABLE_KEY = eyJhbGc...
   (Copy "anon public" key)

✅ SUPABASE_SERVICE_ROLE_KEY = eyJhbGc...
   (Copy "service_role" key - ⚠️ Keep this secret!)
```

**Cost**: Free tier available (500MB database, 2GB bandwidth)

---

### 2️⃣ **Razorpay Credentials** (3 keys needed)

#### Step 1: Create Razorpay Account
1. Go to: https://razorpay.com
2. Click "Sign Up"
3. Fill in business details
4. Verify email

#### Step 2: Complete KYC (for live mode)
1. Go to: **Settings** → **Account & Settings**
2. Complete KYC verification
3. Upload required documents
4. Wait for approval (1-2 business days)

#### Step 3: Get API Keys
1. Go to: **Settings** → **API Keys**
   - Or: https://dashboard.razorpay.com/app/keys
2. For **Test Mode** (development):
   - Click "Generate Test Key"
   - Copy **Key ID** (starts with `rzp_test_`)
   - Copy **Key Secret** (keep secret!)

3. For **Live Mode** (production):
   - After KYC approval
   - Click "Generate Live Key"
   - Copy **Key ID** (starts with `rzp_live_`)
   - Copy **Key Secret** (keep secret!)

#### Step 4: Set Up Webhook
1. Go to: **Settings** → **Webhooks**
   - Or: https://dashboard.razorpay.com/app/webhooks
2. Click "Create Webhook"
3. Enter:
   - **URL**: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/razorpay-webhook`
   - **Events**: Select `payment.captured`
4. Click "Create"
5. Copy **Webhook Secret**

```
✅ RAZORPAY_KEY_ID = rzp_test_xxxxx (or rzp_live_xxxxx)
✅ RAZORPAY_KEY_SECRET = your_secret_key_here
✅ RAZORPAY_WEBHOOK_SECRET = your_webhook_secret_here
```

**Cost**: 
- Test mode: Free
- Live mode: 2% transaction fee

---

### 3️⃣ **Lovable API Key** (1 key needed)

#### Step 1: Access Lovable
1. Go to: https://lovable.dev
2. Sign in to your account
3. If you don't have an account, sign up

#### Step 2: Get API Key
**Option A: From Project Dashboard**
1. Go to your Lovable project
2. Navigate to: **Settings** → **API Keys**
3. Click "Generate API Key" or copy existing key

**Option B: From Account Settings**
1. Go to: https://lovable.dev/dashboard
2. Navigate to: **Account Settings** → **API Keys**
3. Generate or copy your API key

#### Step 3: Check Your Limits
1. In Lovable dashboard, check:
   - **Subscription/Plan**: See your current plan
   - **API Usage**: Check how many calls you've used
   - **Quota**: See remaining API calls
   - **Billing**: Check limits for your plan

```
✅ LOVABLE_API_KEY = your-api-key-here
```

**⚠️ Important**: 
- This key controls how many images you can generate
- Check your Lovable dashboard for exact limits
- Each image = 1 API call
- Free plans have limited usage

**Cost**: 
- Check your Lovable subscription plan
- Free plans: Limited usage
- Paid plans: Higher quotas

---

## 📋 Complete Checklist

### ✅ Supabase (3 keys)
- [ ] Created Supabase account
- [ ] Created project
- [ ] Copied Project URL → `VITE_SUPABASE_URL`
- [ ] Copied anon key → `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] Copied service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### ✅ Razorpay (3 keys)
- [ ] Created Razorpay account
- [ ] Completed KYC (for live mode)
- [ ] Generated test keys
- [ ] Copied Key ID → `RAZORPAY_KEY_ID`
- [ ] Copied Key Secret → `RAZORPAY_KEY_SECRET`
- [ ] Created webhook
- [ ] Copied Webhook Secret → `RAZORPAY_WEBHOOK_SECRET`

### ✅ Lovable (1 key)
- [ ] Created Lovable account
- [ ] Generated/copied API key → `LOVABLE_API_KEY`
- [ ] Checked usage limits/quota

---

## 🎯 After You Get All Keys

### Share with Me (I'll Configure Everything)

Once you have all the keys, share them in this format:

```
SUPABASE:
URL: https://xxxxx.supabase.co
Anon Key: eyJhbGc...
Service Role Key: eyJhbGc...

RAZORPAY:
Key ID: rzp_test_...
Key Secret: xxxxx...
Webhook Secret: xxxxx...

LOVABLE:
API Key: xxxxx...
Current Plan: [Free/Pro/etc]
API Quota: [Check your dashboard]
```

**I'll then:**
1. ✅ Create `.env` file
2. ✅ Set up all Supabase Edge Function secrets
3. ✅ Configure everything
4. ✅ Test it works

---

## 💡 Quick Links

- **Supabase**: https://supabase.com/dashboard
- **Razorpay**: https://dashboard.razorpay.com
- **Lovable**: https://lovable.dev/dashboard

---

## ❓ FAQ

### Q: How many images can I generate?
**A**: Check your Lovable dashboard for your plan's quota. Each image = 1 API call.

### Q: Can you give me API keys?
**A**: No, I cannot. You must get them from each service's dashboard (they're personal credentials).

### Q: How long does it take to get all keys?
**A**: 
- Supabase: 5 minutes (instant)
- Razorpay: 10 minutes (test mode) or 1-2 days (live mode with KYC)
- Lovable: 5 minutes (instant)

### Q: What if I don't have a Lovable account?
**A**: Sign up at https://lovable.dev - it's free to start.

---

**Remember**: Get all keys first, then share them with me and I'll configure everything! 🚀

