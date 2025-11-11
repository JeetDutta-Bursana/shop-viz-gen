# Supabase to Firebase Migration Plan

## Overview
This document outlines the migration from Supabase to Firebase for the AI Product Image Generator.

## What Needs to be Replaced

### 1. Authentication
- **Current**: Supabase Auth (email/password)
- **Replace with**: Firebase Authentication
- **Changes needed**:
  - Replace `@supabase/supabase-js` with `firebase/auth`
  - Update all auth calls in `src/pages/Auth.tsx`, `Dashboard.tsx`
  - Update session management

### 2. Database
- **Current**: Supabase PostgreSQL
- **Replace with**: Firestore (NoSQL) or Cloud SQL (PostgreSQL)
- **Changes needed**:
  - Migrate `profiles` table → Firestore collection
  - Migrate `generations` table → Firestore collection
  - Update all database queries (`.from()` → `.collection()`)
  - Update RLS policies → Firestore Security Rules

### 3. Storage
- **Current**: Supabase Storage
- **Replace with**: Firebase Storage
- **Changes needed**:
  - Update image upload/download code
  - Update storage paths and URLs

### 4. Edge Functions
- **Current**: Supabase Edge Functions (Deno)
- **Replace with**: Cloud Functions (Node.js)
- **Changes needed**:
  - Rewrite all Edge Functions as Cloud Functions
  - Update function deployment
  - Update environment variables/secrets

## Migration Steps

### Step 1: Set up Firebase Project
1. Create Firebase project
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Set up Firebase Storage
5. Enable Cloud Functions

### Step 2: Install Firebase SDK
```bash
npm install firebase
```

### Step 3: Create Firebase Client
Replace `src/integrations/supabase/client.ts` with Firebase client

### Step 4: Migrate Authentication
- Update `src/pages/Auth.tsx`
- Update `src/pages/Dashboard.tsx` (session handling)
- Update `src/pages/AdminAuth.tsx`

### Step 5: Migrate Database
- Create Firestore collections
- Migrate data
- Update all database queries
- Set up Security Rules

### Step 6: Migrate Storage
- Update image upload code
- Update image URLs
- Migrate existing images

### Step 7: Migrate Functions
- Rewrite Edge Functions as Cloud Functions
- Update deployment scripts
- Update environment variables

## Files to Modify

### Frontend Files
- `src/integrations/supabase/client.ts` → `src/integrations/firebase/client.ts`
- `src/pages/Auth.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Admin.tsx`
- `src/pages/AdminAuth.tsx`
- `src/pages/Pricing.tsx`
- `src/components/UploadZone.tsx`
- `src/components/ImageGallery.tsx`

### Backend Files
- `supabase/functions/generate-product-image/index.ts` → `functions/generate-product-image/index.js`
- `supabase/functions/create-payment/index.ts` → `functions/create-payment/index.js`
- `supabase/functions/stripe-webhook/index.ts` → `functions/stripe-webhook/index.js`

### Configuration Files
- Remove `supabase/` directory
- Add `firebase.json`
- Add `.firebaserc`
- Update `.env` file

## Estimated Time
- **Small project**: 2-3 days
- **Medium project**: 1 week
- **Large project**: 2 weeks

## Risks
- Data migration can be complex
- Different database model (SQL → NoSQL)
- Different authentication flow
- Different storage structure
- Function runtime differences (Deno → Node.js)

## Benefits of Firebase
- Better integration with Google services
- More mature ecosystem
- Better documentation
- More hosting options
- Better real-time capabilities

## Next Steps
1. Choose Firebase or another alternative
2. Set up new project
3. Begin migration process
4. Test thoroughly
5. Deploy

