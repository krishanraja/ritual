# Environment Variables Guide

This document describes all environment variables required for the Ritual app to function correctly with Supabase.

## Overview

The app requires different environment variables for:
- **Client-side** (Vercel/development): Used in the browser
- **Edge Functions** (Supabase): Used in serverless functions

---

## Client-Side Environment Variables

These variables are used in the React application and are exposed to the browser (prefixed with `VITE_`).

### Required Variables

#### `VITE_SUPABASE_URL`
- **Description:** Full Supabase project URL
- **Format:** `https://your-project-id.supabase.co`
- **Example:** `https://abcdefghijklmnop.supabase.co`
- **Where to find:** Supabase Dashboard → Settings → API → Project URL
- **Security:** Safe to expose (public URL)

#### `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Description:** Anon/public JWT key for client-side authentication
- **Format:** JWT token (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
- **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MTA5NjAwMCwiZXhwIjoxOTU2Njc2MDAwfQ...`
- **Where to find:** Supabase Dashboard → Settings → API → `anon` `public` key
- **Security:** Safe to expose (designed for client use)
- **⚠️ IMPORTANT:** Must be the **anon/public** key, NOT the service_role key

#### `VITE_SUPABASE_PROJECT_ID`
- **Description:** Supabase project ID (used for localStorage keys)
- **Format:** Alphanumeric string (usually 20 characters)
- **Example:** `abcdefghijklmnop`
- **Where to find:** 
  - Extracted from `VITE_SUPABASE_URL` (the part before `.supabase.co`)
  - Or: Supabase Dashboard → Settings → General → Reference ID
- **Security:** Safe to expose (public identifier)

---

## Edge Functions Environment Variables

These variables are automatically provided by Supabase to edge functions, but you can also set them manually in Supabase Secrets.

### Auto-Provided Variables

Supabase automatically injects these into edge functions:

#### `SUPABASE_URL`
- **Description:** Project URL (same as `VITE_SUPABASE_URL` but without `VITE_` prefix)
- **Auto-provided:** Yes
- **Manual override:** Supabase Dashboard → Project Settings → Edge Functions → Secrets

#### `SUPABASE_ANON_KEY`
- **Description:** Anon key (same as `VITE_SUPABASE_PUBLISHABLE_KEY`)
- **Auto-provided:** Yes
- **Manual override:** Supabase Dashboard → Project Settings → Edge Functions → Secrets

### Required Manual Secrets

#### `SUPABASE_SERVICE_ROLE_KEY`
- **Description:** Service role key for admin operations (bypasses RLS)
- **Format:** JWT token
- **Where to find:** Supabase Dashboard → Settings → API → `service_role` `secret` key
- **Security:** ⚠️ **SECRET** - Never expose in client code
- **Where to set:** Supabase Dashboard → Project Settings → Edge Functions → Secrets
- **Used by:** 
  - `delete-account` function
  - `stripe-webhook` function
  - `send-push` function
  - `deliver-surprise-ritual` function
  - `check-subscription` function
  - `customer-portal` function
  - `cleanup-orphaned-cycles` function

---

## Setting Up Environment Variables

### Local Development

1. Create a `.env` file in the project root:
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
VITE_SUPABASE_PROJECT_ID=your-project-id
```

2. Restart your development server after adding variables

### Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable:
   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** Your Supabase project URL
   - **Environment:** Production, Preview, Development (select all)
4. Repeat for `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_PROJECT_ID`
5. Redeploy your application

### Supabase Edge Functions

1. Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
2. Add `SUPABASE_SERVICE_ROLE_KEY`:
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** Your service role key from API settings
3. Click "Save"

---

## Validation

The app validates all required environment variables at startup. If any are missing or invalid, you'll see clear error messages:

- **Missing URL:** "Missing VITE_SUPABASE_URL environment variable..."
- **Missing Key:** "Missing VITE_SUPABASE_PUBLISHABLE_KEY environment variable..."
- **Invalid URL:** "Invalid Supabase URL format..."
- **Invalid Key:** "Invalid VITE_SUPABASE_PUBLISHABLE_KEY format. Expected JWT token..."

---

## Security Notes

### ✅ Safe to Expose (Client Variables)
- `VITE_SUPABASE_URL` - Public URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Anon key (designed for client)
- `VITE_SUPABASE_PROJECT_ID` - Public identifier

### ⚠️ Never Expose (Server Variables)
- `SUPABASE_SERVICE_ROLE_KEY` - Bypasses all security
- Service role keys should ONLY be in:
  - Supabase Edge Function secrets
  - Server-side code (never in client)

### Key Type Verification

To verify you're using the correct key type:

1. **Anon/Public Key:**
   - Starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Found in: Settings → API → `anon` `public`
   - ✅ Use in: Client code (`VITE_SUPABASE_PUBLISHABLE_KEY`)

2. **Service Role Key:**
   - Also a JWT token (different payload)
   - Found in: Settings → API → `service_role` `secret`
   - ❌ Never use in: Client code
   - ✅ Use in: Edge functions only

---

## Troubleshooting

### "Missing environment variable" error
- **Cause:** Variable not set or not loaded
- **Fix:** 
  - Check `.env` file exists and has correct variable names
  - Restart dev server after adding variables
  - For Vercel: Ensure variables are set in dashboard and app is redeployed

### "Invalid Supabase URL format" error
- **Cause:** URL doesn't match expected format
- **Fix:** Ensure URL is `https://project-id.supabase.co` (no trailing slash)

### "Invalid JWT token format" error
- **Cause:** Using wrong key type or malformed key
- **Fix:** 
  - Verify you're using the anon/public key (not service role)
  - Check key is complete (not truncated)
  - Get fresh key from Supabase dashboard

### Auth not working
- **Cause:** Wrong key type (service role instead of anon)
- **Fix:** Replace `VITE_SUPABASE_PUBLISHABLE_KEY` with anon/public key

### Edge functions failing
- **Cause:** Missing `SUPABASE_SERVICE_ROLE_KEY` secret
- **Fix:** Add secret in Supabase Dashboard → Edge Functions → Secrets

---

## Quick Reference

| Variable | Location | Required For | Security |
|----------|----------|--------------|----------|
| `VITE_SUPABASE_URL` | Client | All features | ✅ Public |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client | Auth, Database | ✅ Public (anon) |
| `VITE_SUPABASE_PROJECT_ID` | Client | localStorage keys | ✅ Public |
| `SUPABASE_URL` | Edge Functions | Auto-provided | ✅ Public |
| `SUPABASE_ANON_KEY` | Edge Functions | Auto-provided | ✅ Public (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions | Admin operations | ⚠️ Secret |

---

## Next Steps

After setting up environment variables:
1. Verify they're loaded: Check browser console for validation errors
2. Test authentication: Try signing up/signing in
3. Test database access: Verify data loads correctly
4. Test edge functions: Verify function calls work

For migration checklist, see [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md)
