# Admin Unlimited Credits Feature

## Overview

Admin users now have unlimited credits, allowing them to generate images without any credit restrictions or deductions.

---

## Implementation

### Backend (`supabase/functions/generate-product-image/index.ts`)

1. **Admin Detection**
   - Checks `profiles.is_admin` field in database
   - Falls back to `ADMIN_EMAILS` list if field doesn't exist
   - Checks both database field and email list for maximum compatibility

2. **Credit Check Bypass**
   - Admin users skip credit validation
   - No "Insufficient credits" error for admin users
   - Admin users can generate images even if credits are 0

3. **Credit Deduction Bypass**
   - Admin users skip credit deduction
   - Credits are not decremented for admin users
   - Returns `-1` in `remainingCredits` to indicate unlimited

4. **Response**
   - Returns `hasUnlimitedCredits: true` for admin users
   - Returns `isAdmin: true` for admin users
   - Returns `remainingCredits: -1` for admin users (indicates unlimited)

### Frontend

#### 1. Dashboard (`src/pages/Dashboard.tsx`)

- **Credit Display**: Shows "Unlimited" with infinity symbol (∞) for admin users
- **Credit Check**: Skips credit validation for admin users before generation
- **Credit Fetch**: Sets credits to `-1` for admin users (indicates unlimited)
- **Payment Polling**: Skips credit updates for admin users
- **Generate Button**: Always enabled for admin users (no credit check)
- **Admin Status**: Passes `isAdmin` flag to backend

#### 2. CreditDisplay Component (`src/components/CreditDisplay.tsx`)

- **Unlimited Display**: Shows infinity symbol (∞) and "Unlimited" text for admin users
- **Click Behavior**: No navigation to pricing page for admin users (unlimited credits)
- **Visual Indicator**: Uses infinity icon instead of coins icon for admin users
- **Props**: Accepts `isAdmin` prop and checks `credits === -1`

#### 3. Pricing Page (`src/pages/Pricing.tsx`)

- **Credit Display**: Shows "Unlimited (Admin)" for admin users
- **Credit Fetch**: Sets credits to `-1` for admin users
- **Payment Polling**: Skips credit updates for admin users

#### 4. Admin Page (`src/pages/Admin.tsx`)

- **Already Configured**: Shows "Unlimited image generation with no credit restrictions"
- **Admin Flag**: Passes `isAdmin: true` to backend
- **No Credit Checks**: Admin page doesn't check credits

---

## How It Works

### Admin User Flow

1. **Login**: Admin user logs in with admin credentials
2. **Credit Check**: System detects admin status (database field or email list)
3. **Credit Display**: Shows "Unlimited" with infinity symbol (∞)
4. **Image Generation**: 
   - Admin user can generate images without credit check
   - No credits deducted from account
   - Backend returns `hasUnlimitedCredits: true`
5. **Credit Updates**: Credits remain at `-1` (unlimited) for admin users

### Regular User Flow

1. **Login**: Regular user logs in
2. **Credit Check**: System fetches actual credits from database
3. **Credit Display**: Shows actual credit count
4. **Image Generation**: 
   - Credit check performed before generation
   - Credits deducted after successful generation
   - Backend returns updated credit count

---

## Technical Details

### Credit Value Representation

- **Regular Users**: Positive integer (0, 1, 2, 3, ...)
- **Admin Users**: `-1` (special value indicating unlimited)

### Admin Status Detection

The system checks admin status in this order:
1. **Database Field**: `profiles.is_admin === true`
2. **Email List**: Email matches `ADMIN_EMAILS` list
3. **Frontend Flag**: `isAdmin` prop passed from frontend

### Backend Response

```json
{
  "success": true,
  "generatedImageUrl": "...",
  "generation": {...},
  "remainingCredits": -1,  // -1 indicates unlimited for admin
  "isAdmin": true,
  "hasUnlimitedCredits": true
}
```

### Frontend State

- **Admin Users**: `credits = -1` (unlimited)
- **Regular Users**: `credits = actual_credit_count`

---

## UI Changes

### CreditDisplay Component

**Before:**
- Shows credit count with coins icon
- Clickable to navigate to pricing

**After:**
- Shows "Unlimited" with infinity icon for admin users
- Not clickable for admin users (no pricing needed)
- Shows credit count with coins icon for regular users

### Dashboard

**Before:**
- Credit check before generation
- Generate button disabled if credits <= 0

**After:**
- Credit check skipped for admin users
- Generate button always enabled for admin users
- Shows "Unlimited Credits (Admin)" message
- Shows infinity symbol (∞) for admin users

### Pricing Page

**Before:**
- Shows actual credit count

**After:**
- Shows "Unlimited (Admin)" for admin users
- Shows actual credit count for regular users

---

## Benefits

1. **Unlimited Access**: Admin users can generate unlimited images
2. **No Restrictions**: No credit checks or deductions for admin users
3. **Clear Indication**: Visual indicators (infinity symbol) show unlimited status
4. **Seamless Experience**: Admin users don't see credit-related restrictions
5. **Backward Compatible**: Works with existing admin email list and new database field

---

## Testing

### Test Cases

1. ✅ Admin user logs in → Credits show "Unlimited"
2. ✅ Admin user generates image → No credits deducted
3. ✅ Admin user generates image → No "Insufficient credits" error
4. ✅ Admin user generates image → Backend returns `hasUnlimitedCredits: true`
5. ✅ Regular user logs in → Credits show actual count
6. ✅ Regular user generates image → Credits deducted
7. ✅ Regular user with 0 credits → Cannot generate (shows error)
8. ✅ Admin user with 0 credits → Can generate (unlimited)

---

## Security Notes

- Admin status is checked on both frontend and backend
- Backend always verifies admin status (cannot be bypassed)
- Database field `is_admin` is the primary source of truth
- Email list is fallback for backward compatibility
- Admin users cannot purchase credits (unlimited status)

---

## Summary

Admin users now have:
- ✅ Unlimited credits (no credit restrictions)
- ✅ No credit deductions
- ✅ Clear visual indicators (infinity symbol)
- ✅ Seamless image generation experience
- ✅ No need to purchase credits

The system automatically detects admin users and grants them unlimited credits, providing a seamless experience for administrators while maintaining proper credit management for regular users.

