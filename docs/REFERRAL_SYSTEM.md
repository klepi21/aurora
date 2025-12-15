# Referral System Implementation

## Overview
A referral system has been implemented that allows users to invite friends and earn refpoints when their friends connect their wallet for the first time using their referral link.

## Features

1. **Unique Referral Codes**: Each user gets a unique 8-character referral code (auto-generated)
2. **Referral Links**: Users can share their referral link (`/app?ref=CODE`)
3. **Refpoints**: Users earn 1 refpoint for each friend who connects via their referral link
4. **Referral Tracking**: System tracks who referred whom and counts total referrals

## Database Changes

### Migration File
`supabase/migration_add_referral_system.sql`

**New Columns in `users` table:**
- `referral_code` (TEXT, UNIQUE) - Unique code for each user
- `referred_by` (TEXT, FK to users.wallet_address) - Wallet address of the referrer
- `refpoints` (INTEGER, DEFAULT 0) - Points earned from referrals

**Database Functions:**
- `generate_referral_code()` - Generates unique 8-character codes
- `ensure_unique_referral_code()` - Trigger function to auto-generate codes
- `award_referral_points()` - Trigger function to award refpoints when referrals are made

**Indexes:**
- `idx_users_referral_code` - Fast lookup by referral code
- `idx_users_referred_by` - Fast counting of referrals
- `idx_users_refpoints` - For leaderboard queries

## API Endpoints

### 1. `POST /api/users/init`
Initializes a user when they first connect their wallet. Handles referral code processing.

**Request:**
```json
{
  "wallet_address": "erd1...",
  "referral_code": "ABC12345" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "referred": true/false
}
```

### 2. `GET /api/referrals?wallet_address=...`
Gets referral information for a user.

**Response:**
```json
{
  "success": true,
  "data": {
    "referral_code": "ABC12345",
    "referral_link": "https://app.com/app?ref=ABC12345",
    "refpoints": 5,
    "referral_count": 5
  }
}
```

## Frontend Implementation

### UI Components
Added a "Referral Program" section to `/app` page showing:
- Referral link with copy button
- Current refpoints count
- Total number of referrals
- Refpoints badge

### User Flow

1. **User connects wallet** → System checks for `?ref=CODE` in URL
2. **If referral code found** → User is initialized with `referred_by` set
3. **Refpoint awarded** → Referrer gets 1 refpoint (via database trigger)
4. **Referral link displayed** → User can copy and share their link

## Setup Instructions

### 1. Run Database Migration
Execute the migration file in your Supabase SQL editor:

```sql
-- Run: supabase/migration_add_referral_system.sql
```

### 2. Environment Variables (Optional)
Add to `.env.local` if you want to customize the base URL:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

If not set, the system will use the `Origin` header from requests.

### 3. Test the System

1. Connect wallet as User A
2. Copy referral link from the Referral Program section
3. Open referral link in incognito/another browser
4. Connect wallet as User B
5. User A should receive 1 refpoint
6. User B's referral section should show they were referred

## How It Works

1. **Referral Code Generation**: 
   - Auto-generated when user is created (via database trigger)
   - 8 characters: A-Z (excluding I, O) and 2-9 (excluding 0, 1)
   - Ensures uniqueness

2. **Referral Detection**:
   - When user connects wallet, frontend checks URL for `?ref=CODE`
   - Calls `/api/users/init` with referral code
   - Backend validates code and sets `referred_by`

3. **Refpoint Awarding**:
   - Database trigger fires on INSERT when `referred_by` is set
   - Automatically increments referrer's `refpoints` by 1
   - Also handled manually in API as backup

4. **Preventing Abuse**:
   - Users can only be referred once (existing `referred_by` prevents updates)
   - Self-referrals are ignored
   - Invalid referral codes are silently ignored

## Type Updates

Updated `src/types/database.ts` to include:
```typescript
export interface User {
  // ... existing fields
  referral_code: string | null;
  referred_by: string | null;
  refpoints: number;
}
```

## Notes

- Referral codes are case-sensitive
- Refpoints are separate from game points (`total_points`)
- Referral links work across all routes (redirects to `/app` with ref parameter)
- The system handles edge cases like invalid codes, self-referrals, and duplicate referrals

