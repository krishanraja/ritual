# DIAGNOSIS: Foreign Key Constraint Violation - Profile Missing

## Problem Summary
Users cannot sign up, sign in, create couples, or leave couples. All operations fail with:
```
insert or update on table "couples" violates foreign key constraint "couples_partner_one_fkey"
```

## Root Cause Analysis

### Architecture Flow

```
User Signup/Signin
  ↓
auth.users record created
  ↓
Trigger: handle_new_user() (should create profile)
  ↓
public.profiles record (should exist)
  ↓
Create Couple (uses user.id as partner_one)
  ↓
Foreign Key Check: partner_one → profiles.id
  ↓
❌ FAILS if profile doesn't exist
```

### Foreign Key Constraint

**Location:** `supabase/migrations/20251125002243_0fc50479-3e57-4d3b-819c-eeb6e8c09a8a.sql:12-13`

```sql
ADD CONSTRAINT couples_partner_one_fkey 
  FOREIGN KEY (partner_one) REFERENCES public.profiles(id) ON DELETE CASCADE
```

**Requirement:** `couples.partner_one` MUST reference an existing `profiles.id`

### Profile Creation Trigger

**Location:** `supabase/migrations/20251119175435_62bed0c3-e490-4c31-af5f-a5fcdb7fc55a.sql:19-38`

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Expected Behavior:** Automatically creates `profiles` record when `auth.users` record is inserted.

### Failure Points

1. **Trigger Not Firing**
   - Trigger might be missing or disabled in production
   - Trigger might have been dropped by a migration
   - Database state mismatch between local and production

2. **Trigger Failing Silently**
   - RLS policies blocking the INSERT
   - Permission issues with SECURITY DEFINER
   - Error in trigger function not being logged

3. **Race Condition**
   - User tries to create couple immediately after signup
   - Trigger hasn't completed yet
   - Code doesn't wait for profile creation

4. **Missing Profile Check**
   - `CreateCoupleDialog.tsx:85` directly uses `user.id` without verifying profile exists
   - No fallback to create profile if missing
   - No error handling for foreign key violations

### Code Locations

**Create Couple:**
- File: `src/components/CreateCoupleDialog.tsx`
- Line: 82-89
- Issue: No profile existence check before insert

**Join Couple:**
- File: `supabase/functions/join_couple_with_code` (if exists)
- File: `src/components/JoinDrawer.tsx`
- Issue: Same foreign key constraint applies to `partner_two`

**Leave Couple:**
- File: `src/contexts/CoupleContext.tsx:917-956`
- Issue: Foreign key constraint might block updates if profile missing

## Call Graph

```
User Action (Signup/Signin)
  ↓
Auth.tsx: handleAuth()
  ↓
supabase.auth.signUp() / signInWithPassword()
  ↓
[Trigger should fire: handle_new_user()]
  ↓
User tries to create couple
  ↓
CreateCoupleDialog.tsx: handleCreateSpace()
  ↓
supabase.from('couples').insert({ partner_one: user.id })
  ↓
❌ Database checks: couples_partner_one_fkey
  ↓
❌ FAILS: profiles.id doesn't exist for user.id
```

## Observed Errors

1. **Foreign Key Constraint Violation**
   - Error: `insert or update on table "couples" violates foreign key constraint "couples_partner_one_fkey"`
   - Location: Database constraint check
   - Impact: Blocks all couple creation/update operations

2. **No Profile Existence Verification**
   - Location: `CreateCoupleDialog.tsx:85`
   - Issue: Code assumes profile exists
   - Impact: Silent failure when profile missing

3. **No Error Recovery**
   - Location: `CreateCoupleDialog.tsx:91-96`
   - Issue: Only handles duplicate code (23505), not foreign key (23503)
   - Impact: User sees generic error, can't proceed

## Architecture Map

```
┌─────────────────┐
│  auth.users     │ (Supabase Auth)
└────────┬────────┘
         │
         │ Trigger: handle_new_user()
         ↓
┌─────────────────┐
│ public.profiles │ (Should exist)
└────────┬────────┘
         │
         │ Foreign Key: couples_partner_one_fkey
         ↓
┌─────────────────┐
│ public.couples  │ (Fails if profile missing)
└─────────────────┘
```

## Files Involved

1. **Database Schema:**
   - `supabase/migrations/20251119175435_62bed0c3-e490-4c31-af5f-a5fcdb7fc55a.sql` - Trigger definition
   - `supabase/migrations/20251125002243_0fc50479-3e57-4d3b-819c-eeb6e8c09a8a.sql` - Foreign key constraint
   - `supabase/migrations/000_initial_schema.sql` - Complete schema

2. **Application Code:**
   - `src/components/CreateCoupleDialog.tsx:25-116` - Create couple logic
   - `src/components/JoinDrawer.tsx` - Join couple logic
   - `src/contexts/CoupleContext.tsx:917-956` - Leave couple logic
   - `src/pages/Auth.tsx:147-259` - Signup/signin flow

3. **Database Functions:**
   - `public.handle_new_user()` - Profile creation trigger
   - `public.join_couple_with_code()` - Join couple function (if exists)

## Conditional Rendering Branches

**CreateCoupleDialog:**
- If user exists → Check for existing couple
- If existing couple → Show code
- If no couple → Generate code and insert
- **MISSING:** If profile doesn't exist → Create profile first

**Error Handling:**
- If error code 23505 (duplicate) → Retry with new code
- **MISSING:** If error code 23503 (foreign key) → Create profile and retry

## Impact on Ritual Generation

**CRITICAL:** The profile foreign key issue also affects ritual generation when both partners have submitted:

1. **trigger-synthesis function** (line 78) uses: `select('*, couples!inner(preferred_city)')`
   - This INNER JOIN requires the couple to exist and be valid
   - If couple has invalid foreign keys (missing profiles), JOIN may fail silently
   - Function returns "Cycle not found" even though cycle exists

2. **RLS Policies on weekly_cycles** check couple membership:
   - Policies use: `EXISTS (SELECT 1 FROM public.couples WHERE ...)`
   - If couple has invalid FKs, the EXISTS check might fail
   - Updates to `synthesized_output` could be blocked

3. **Existing couples with missing profiles:**
   - If couples were created before FK constraint was added
   - Or if FK constraint was temporarily disabled
   - These couples have invalid `partner_one`/`partner_two` references
   - Synthesis flow fails when trying to JOIN or verify couple membership

## Next Steps

1. Verify trigger exists and is enabled in production
2. Add profile existence check before couple operations
3. Add profile creation fallback if missing
4. Add proper error handling for foreign key violations
5. **Fix existing couples with missing profile references**
6. **Ensure trigger-synthesis handles missing profiles gracefully**
7. **Add profile verification in synthesis flow**
8. Test all flows: signup, signin, create couple, join couple, leave couple, **ritual generation**
