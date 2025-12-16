# Supabase Migration Checklist

This checklist ensures your new Supabase project is fully configured and ready for production.

---

## Pre-Migration Setup

### 1. Create New Supabase Project
- [ ] Create new project in Supabase Dashboard
- [ ] Note the project URL (e.g., `https://your-project-id.supabase.co`)
- [ ] Note the project ID (extracted from URL)

### 2. Get API Keys
- [ ] Copy **anon/public** key from Settings → API
- [ ] Copy **service_role** key from Settings → API (keep secret!)
- [ ] Verify anon key is JWT format (starts with `eyJ...`)
- [ ] Verify service_role key is different from anon key

---

## Database Schema Setup

### 3. Run SQL Schema
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Copy contents of `supabase/migrations/000_initial_schema.sql`
- [ ] Paste into SQL Editor
- [ ] Click "Run" or press `Ctrl+Enter`
- [ ] Verify no errors in output
- [ ] Check execution time (should be < 30 seconds)

### 4. Verify Tables Created
- [ ] Go to Table Editor in Supabase Dashboard
- [ ] Verify these tables exist:
  - [ ] `profiles`
  - [ ] `couples`
  - [ ] `weekly_cycles`
  - [ ] `ritual_preferences`
  - [ ] `completions`
  - [ ] `ritual_streaks`
  - [ ] `ritual_memories`
  - [ ] `ritual_feedback`
  - [ ] `ritual_suggestions`
  - [ ] `ritual_library`
  - [ ] `bucket_list_items`
  - [ ] `memory_reactions`
  - [ ] `push_subscriptions`
  - [ ] `surprise_rituals`
  - [ ] `couple_billing`
  - [ ] `user_analytics_events`
  - [ ] `user_feedback`
  - [ ] `contact_submissions`

### 5. Verify RLS Policies
- [ ] Go to Authentication → Policies in Supabase Dashboard
- [ ] Verify RLS is enabled on all tables (should show "Enabled")
- [ ] Check that policies exist for each table
- [ ] Verify no tables have "No policies" warning

### 6. Verify Functions
- [ ] Go to Database → Functions in Supabase Dashboard
- [ ] Verify these functions exist:
  - [ ] `handle_new_user()`
  - [ ] `update_updated_at_column()`
  - [ ] `is_partner(uuid)`
  - [ ] `get_partner_name(uuid)`
  - [ ] `validate_couple_code(text)`
  - [ ] `join_couple_with_code(text)`

### 7. Verify Triggers
- [ ] Go to Database → Triggers in Supabase Dashboard
- [ ] Verify these triggers exist:
  - [ ] `on_auth_user_created` (on `auth.users`)
  - [ ] `update_ritual_streaks_updated_at` (on `ritual_streaks`)
  - [ ] `update_ritual_memories_updated_at` (on `ritual_memories`)
  - [ ] `update_ritual_feedback_updated_at` (on `ritual_feedback`)
  - [ ] `update_bucket_list_items_updated_at` (on `bucket_list_items`)
  - [ ] `update_couple_billing_updated_at` (on `couple_billing`)

---

## Storage Setup

### 8. Verify Storage Bucket
- [ ] Go to Storage in Supabase Dashboard
- [ ] Verify `ritual-photos` bucket exists
- [ ] Verify bucket is **public**
- [ ] Verify file size limit is 5MB
- [ ] Verify allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- [ ] Verify RLS policies exist for the bucket

### 9. Test Storage Upload (Optional)
- [ ] Try uploading a test image via Supabase Dashboard
- [ ] Verify upload succeeds
- [ ] Verify public URL is accessible

---

## Realtime Setup

### 10. Verify Realtime
- [ ] Go to Database → Replication in Supabase Dashboard
- [ ] Verify these tables are enabled for Realtime:
  - [ ] `couples`
  - [ ] `weekly_cycles`
  - [ ] `ritual_streaks`
  - [ ] `ritual_memories`
  - [ ] `ritual_suggestions`
  - [ ] `memory_reactions`

---

## Edge Functions Setup

### 11. Set Edge Function Secrets
- [ ] Go to Project Settings → Edge Functions → Secrets
- [ ] Add `SERVICE_ROLE_KEY`:
  - [ ] Name: `SERVICE_ROLE_KEY` (⚠️ NOT `SUPABASE_SERVICE_ROLE_KEY` - Supabase doesn't allow `SUPABASE_` prefix)
  - [ ] Value: Your service_role key
  - [ ] Click "Save"
- [ ] Verify secret appears in list (value is hidden)

### 12. Deploy Edge Functions
- [ ] Verify all edge functions are deployed:
  - [ ] `trigger-synthesis`
  - [ ] `synthesize-rituals`
  - [ ] `delete-account`
  - [ ] `stripe-webhook`
  - [ ] `send-push`
  - [ ] `notify-partner-completion`
  - [ ] `create-checkout`
  - [ ] `customer-portal`
  - [ ] `check-subscription`
  - [ ] `deliver-surprise-ritual`
  - [ ] `nudge-partner`
  - [ ] `cleanup-orphaned-cycles`
  - [ ] `send-contact-email`
  - [ ] `parse-bucket-list`

---

## Client Configuration

### 13. Set Vercel Environment Variables
- [ ] Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- [ ] Add `VITE_SUPABASE_URL`:
  - [ ] Value: Your Supabase project URL
  - [ ] Environments: Production, Preview, Development
- [ ] Add `VITE_SUPABASE_PUBLISHABLE_KEY`:
  - [ ] Value: Your anon/public key
  - [ ] Environments: Production, Preview, Development
- [ ] Add `VITE_SUPABASE_PROJECT_ID`:
  - [ ] Value: Your project ID
  - [ ] Environments: Production, Preview, Development
- [ ] Redeploy application

### 14. Verify Local Development
- [ ] Create `.env` file with all three `VITE_*` variables
- [ ] Restart development server
- [ ] Check browser console for validation errors
- [ ] Verify no "Missing environment variable" errors

---

## Authentication Testing

### 15. Test Sign Up Flow
- [ ] Navigate to `/auth` page
- [ ] Click "Sign Up"
- [ ] Enter test email and password
- [ ] Submit form
- [ ] Verify:
  - [ ] No console errors
  - [ ] Success message or email confirmation prompt
  - [ ] Profile row created in `profiles` table
  - [ ] User appears in Authentication → Users

### 16. Test Sign In Flow
- [ ] Sign in with test account
- [ ] Verify:
  - [ ] No console errors
  - [ ] Redirects to home page
  - [ ] User profile loads
  - [ ] Session persists on refresh

### 17. Test Profile Creation
- [ ] After signup, verify:
  - [ ] Profile row exists in `profiles` table
  - [ ] Profile has correct `name` from signup form
  - [ ] Profile `id` matches auth user `id`
  - [ ] Trigger `on_auth_user_created` fired (check logs)

---

## Database Functionality Testing

### 18. Test Couple Creation
- [ ] Sign in as user
- [ ] Create a couple (generate couple code)
- [ ] Verify:
  - [ ] Couple row created in `couples` table
  - [ ] `partner_one` is current user
  - [ ] `couple_code` is unique
  - [ ] `is_active` is `true`

### 19. Test Couple Joining
- [ ] Sign in as second user
- [ ] Join couple using code
- [ ] Verify:
  - [ ] `partner_two` is set in `couples` table
  - [ ] Function `join_couple_with_code` executed successfully
  - [ ] Both users can see the couple

### 20. Test Weekly Cycle Creation
- [ ] With both partners in couple
- [ ] Navigate to input page
- [ ] Submit input
- [ ] Verify:
  - [ ] `weekly_cycles` row created
  - [ ] `partner_one_input` or `partner_two_input` populated
  - [ ] Cycle accessible to both partners

---

## Security Verification

### 21. Verify RLS is Working
- [ ] Sign in as User A
- [ ] Try to query another user's profile directly
- [ ] Verify: Only own profile is accessible
- [ ] Sign in as User B
- [ ] Try to access User A's couple (if not partner)
- [ ] Verify: Access denied (no rows returned)

### 22. Verify No Hardcoded References
- [ ] Search codebase for old project ID: `ffowyysujkzwxisjckxh`
- [ ] Verify: No matches found
- [ ] Search for old project URL: `gdojuuzlxpxftsfkmneu`
- [ ] Verify: No matches found

### 23. Verify Environment Variable Validation
- [ ] Remove one env var from `.env`
- [ ] Restart dev server
- [ ] Verify: Clear error message shown
- [ ] Restore env var
- [ ] Verify: App loads correctly

---

## Production Readiness

### 24. Performance Checks
- [ ] Verify indexes exist on frequently queried columns
- [ ] Check query performance in Supabase Dashboard → Database → Query Performance
- [ ] Verify no slow queries (> 1 second)

### 25. Monitoring Setup
- [ ] Enable Supabase logging
- [ ] Set up error alerts (if available)
- [ ] Monitor edge function execution logs

### 26. Backup Verification
- [ ] Verify Supabase automatic backups are enabled
- [ ] Note backup schedule
- [ ] Test restore process (optional)

---

## Final Verification

### 27. End-to-End Test
- [ ] Complete user journey:
  - [ ] Sign up → Create couple → Join couple → Submit input → View rituals
- [ ] Verify all steps work without errors
- [ ] Check browser console for errors
- [ ] Check Supabase logs for errors

### 28. Multi-User Test
- [ ] Test with two different browsers/users
- [ ] Verify realtime updates work
- [ ] Verify partner actions are visible to both users

### 29. Error Handling Test
- [ ] Test with invalid couple code
- [ ] Test with expired session
- [ ] Test with network offline
- [ ] Verify graceful error messages

---

## Post-Migration

### 30. Documentation
- [ ] Update any project-specific documentation
- [ ] Note new project URL and IDs
- [ ] Document any custom configurations

### 31. Team Communication
- [ ] Share new environment variables with team
- [ ] Update shared documentation
- [ ] Notify team of migration completion

---

## Troubleshooting

If any step fails:

1. **SQL Errors:**
   - Check Supabase logs for detailed error messages
   - Verify you're running the complete schema file
   - Check for conflicting existing objects

2. **RLS Policy Issues:**
   - Verify policies are created in correct order
   - Check policy conditions match your use case
   - Test policies with direct SQL queries

3. **Environment Variable Issues:**
   - Verify variable names match exactly (case-sensitive)
   - Check for trailing spaces in values
   - Restart dev server after changes

4. **Auth Issues:**
   - Verify anon key is correct (not service_role)
   - Check email confirmation settings in Supabase
   - Verify redirect URLs are configured

5. **Storage Issues:**
   - Verify bucket is public
   - Check RLS policies on storage.objects
   - Verify MIME types are allowed

---

## Success Criteria

✅ All checklist items completed  
✅ No errors in browser console  
✅ No errors in Supabase logs  
✅ All features functional  
✅ Security policies working  
✅ Ready for production deployment  

---

## Need Help?

- Check [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for env var setup
- Review Supabase documentation: https://supabase.com/docs
- Check application logs for specific error messages
