# Idiot-Proof Next Steps Guide

**Follow these steps EXACTLY in order. Don't skip anything.**

---

## Step 1: Get Your Supabase Project Details

### 1.1 Open Supabase Dashboard
1. Go to https://supabase.com
2. Sign in to your account
3. Click on your **new** Supabase project (the one you just created, NOT the old shared one)

### 1.2 Get Your Project URL
1. Look at the top of the page - you'll see your project URL
2. It looks like: `https://abcdefghijklmnop.supabase.co`
3. **Copy this entire URL** - you'll need it later
4. Write it down somewhere safe

### 1.3 Get Your Project ID
1. Your Project ID is the part BEFORE `.supabase.co`
2. For example, if your URL is `https://abcdefghijklmnop.supabase.co`
3. Then your Project ID is: `abcdefghijklmnop`
4. **Copy this** - you'll need it later

### 1.4 Get Your Anon/Public Key
1. In the left sidebar, click **Settings** (gear icon at the bottom)
2. Click **API** (under Project Settings)
3. Find the section called **Project API keys**
4. Look for the key labeled **`anon` `public`**
5. Click the **eye icon** or **copy button** next to it
6. **Copy this entire key** (it's very long, starts with `eyJ...`)
7. ⚠️ **IMPORTANT:** Make sure you copied the **anon/public** key, NOT the service_role key
8. Write it down somewhere safe

### 1.5 Get Your Service Role Key
1. Still in the **API** settings page
2. Find the key labeled **`service_role` `secret`**
3. Click the **eye icon** or **copy button** next to it
4. **Copy this entire key** (also very long)
5. ⚠️ **SECRET:** This is a secret key - don't share it with anyone
6. Write it down somewhere safe

**✅ CHECKPOINT:** You should now have:
- [ ] Project URL (e.g., `https://xxx.supabase.co`)
- [ ] Project ID (e.g., `xxx`)
- [ ] Anon/Public Key (starts with `eyJ...`)
- [ ] Service Role Key (also starts with `eyJ...`)

---

## Step 2: Run the SQL Schema

### 2.1 Open SQL Editor
1. In Supabase Dashboard, click **SQL Editor** in the left sidebar
2. You should see a blank SQL editor window

### 2.2 Copy the Schema File
1. Open the file `supabase/migrations/000_initial_schema.sql` in your project
2. **Select ALL** the text (Ctrl+A or Cmd+A)
3. **Copy** it (Ctrl+C or Cmd+C)
4. The file is very long - make sure you copied everything

### 2.3 Paste and Run
1. Go back to Supabase SQL Editor
2. Click in the editor window
3. **Paste** the SQL (Ctrl+V or Cmd+V)
4. Click the **RUN** button (green button at bottom right)
5. OR press **Ctrl+Enter** (Windows) or **Cmd+Enter** (Mac)

### 2.4 Wait for Completion
1. Wait 10-30 seconds for it to finish
2. You should see "Success" message at the bottom
3. If you see errors, scroll down and read them - but it should work fine

**✅ CHECKPOINT:** SQL schema should be executed successfully
- [ ] No errors in SQL Editor
- [ ] Success message shown

---

## Step 3: Verify Tables Were Created

### 3.1 Check Tables
1. In Supabase Dashboard, click **Table Editor** in the left sidebar
2. You should see a list of tables
3. Look for these tables (you should see ALL of them):
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

**✅ CHECKPOINT:** All 18 tables should exist
- [ ] Can see all tables in Table Editor

---

## Step 4: Set Edge Function Secret

### 4.1 Open Edge Functions Settings
1. In Supabase Dashboard, click **Settings** (gear icon)
2. Click **Edge Functions** (under Project Settings)
3. Click the **Secrets** tab

### 4.2 Add Service Role Key
1. Click **Add new secret** button
2. In the **Name** field, type exactly: `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ Must be EXACTLY this (copy-paste it to be sure)
3. In the **Value** field, paste your **Service Role Key** (from Step 1.5)
4. Click **Save** or **Add secret**

**✅ CHECKPOINT:** Secret should be saved
- [ ] Secret `SUPABASE_SERVICE_ROLE_KEY` appears in the list
- [ ] Value is hidden (shows as dots/asterisks)

---

## Step 5: Set Vercel Environment Variables

### 5.1 Open Vercel Dashboard
1. Go to https://vercel.com
2. Sign in to your account
3. Click on your **Ritual** project

### 5.2 Go to Environment Variables
1. Click **Settings** tab (at the top)
2. Click **Environment Variables** (in the left sidebar)

### 5.3 Add First Variable: VITE_SUPABASE_URL
1. Click **Add New** button
2. In **Key** field, type exactly: `VITE_SUPABASE_URL`
3. In **Value** field, paste your **Project URL** (from Step 1.2)
4. Under **Environment**, check ALL boxes:
   - [ ] Production
   - [ ] Preview
   - [ ] Development
5. Click **Save**

### 5.4 Add Second Variable: VITE_SUPABASE_PUBLISHABLE_KEY
1. Click **Add New** button again
2. In **Key** field, type exactly: `VITE_SUPABASE_PUBLISHABLE_KEY`
3. In **Value** field, paste your **Anon/Public Key** (from Step 1.4)
4. Under **Environment**, check ALL boxes:
   - [ ] Production
   - [ ] Preview
   - [ ] Development
5. Click **Save**

### 5.5 Add Third Variable: VITE_SUPABASE_PROJECT_ID
1. Click **Add New** button again
2. In **Key** field, type exactly: `VITE_SUPABASE_PROJECT_ID`
3. In **Value** field, paste your **Project ID** (from Step 1.3)
4. Under **Environment**, check ALL boxes:
   - [ ] Production
   - [ ] Preview
   - [ ] Development
5. Click **Save**

**✅ CHECKPOINT:** All three variables should be in the list
- [ ] `VITE_SUPABASE_URL` exists
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` exists
- [ ] `VITE_SUPABASE_PROJECT_ID` exists
- [ ] All have all three environments checked

### 5.6 Redeploy Your App
1. Still in Vercel, click **Deployments** tab (at the top)
2. Find the most recent deployment
3. Click the **three dots** (⋯) menu next to it
4. Click **Redeploy**
5. Click **Redeploy** in the confirmation popup
6. Wait for deployment to finish (2-5 minutes)

**✅ CHECKPOINT:** App should be redeployed
- [ ] Deployment shows "Ready" status
- [ ] No errors in deployment logs

---

## Step 6: Set Local Development Environment Variables

### 6.1 Create .env File
1. Open your project folder in your code editor
2. In the **root** of the project (same folder as `package.json`), create a new file
3. Name it exactly: `.env` (with the dot at the beginning)
4. ⚠️ Make sure it's `.env` not `env` or `.env.txt`

### 6.2 Add Variables to .env File
1. Open the `.env` file
2. Copy and paste this EXACTLY (replace with your actual values):

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR-ANON-KEY-HERE
VITE_SUPABASE_PROJECT_ID=YOUR-PROJECT-ID
```

3. Replace:
   - `YOUR-PROJECT-ID` with your actual Project ID (from Step 1.3)
   - `YOUR-ANON-KEY-HERE` with your actual Anon/Public Key (from Step 1.4)
   - Keep the `https://` and `.supabase.co` parts

4. Example (don't use this, use YOUR values):
```
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MTA5NjAwMCwiZXhwIjoxOTU2Njc2MDAwfQ.abcdefghijklmnopqrstuvwxyz1234567890
VITE_SUPABASE_PROJECT_ID=abcdefghijklmnop
```

5. **Save** the file

### 6.3 Restart Your Dev Server
1. If your dev server is running, **stop it** (Ctrl+C in terminal)
2. Start it again: `npm run dev`
3. Wait for it to start

**✅ CHECKPOINT:** Dev server should start without errors
- [ ] No "Missing environment variable" errors
- [ ] App loads in browser

---

## Step 7: Test Everything

### 7.1 Test the App Loads
1. Open your app in browser (local or Vercel URL)
2. Open browser **Developer Tools** (F12 or Right-click → Inspect)
3. Click **Console** tab
4. Look for any red errors
5. ✅ Should see NO errors about missing environment variables

### 7.2 Test Sign Up
1. Go to `/auth` page (or click Sign Up)
2. Enter:
   - Name: `Test User`
   - Email: `test@example.com` (use a real email you can access)
   - Password: `testpassword123` (at least 8 characters)
3. Click **Sign Up**
4. ✅ Should either:
   - Sign you in and redirect to home page, OR
   - Show message about checking email

### 7.3 Verify Profile Was Created
1. Go back to Supabase Dashboard
2. Click **Table Editor** → **profiles** table
3. ✅ Should see a new row with your test user's name and email

### 7.4 Test Sign In
1. If you signed up, sign out first
2. Go to `/auth` page
3. Enter your email and password
4. Click **Sign In**
5. ✅ Should sign you in and redirect to home page

**✅ CHECKPOINT:** Basic auth should work
- [ ] Can sign up
- [ ] Profile created in database
- [ ] Can sign in

---

## Step 8: Verify Storage Bucket

### 8.1 Check Storage Bucket Exists
1. In Supabase Dashboard, click **Storage** in left sidebar
2. ✅ Should see a bucket called `ritual-photos`
3. Click on it
4. ✅ Should show it's **Public**

**✅ CHECKPOINT:** Storage bucket should exist
- [ ] `ritual-photos` bucket visible
- [ ] Bucket is public

---

## Troubleshooting

### Problem: "Missing environment variable" error
**Solution:**
1. Check you spelled the variable names EXACTLY (case-sensitive)
2. Check you added them to Vercel AND your local `.env` file
3. Restart your dev server after adding to `.env`
4. Redeploy on Vercel after adding variables

### Problem: SQL schema has errors
**Solution:**
1. Make sure you copied the ENTIRE file (it's very long)
2. Try running it again - some errors are OK if objects already exist
3. Check the error message - it will tell you what's wrong

### Problem: Can't sign up/sign in
**Solution:**
1. Check you're using the **anon/public** key, NOT the service_role key
2. Check your Project URL is correct (no trailing slash)
3. Check browser console for specific error messages
4. Verify the key starts with `eyJ...` (JWT format)

### Problem: Tables don't appear
**Solution:**
1. Refresh the Table Editor page
2. Check SQL Editor for any error messages
3. Try running the SQL schema again

### Problem: Edge function secret not working
**Solution:**
1. Check the name is EXACTLY `SUPABASE_SERVICE_ROLE_KEY` (no typos)
2. Check you pasted the service_role key, not the anon key
3. Make sure you clicked Save

---

## Final Checklist

Before you're done, verify:

- [ ] SQL schema ran successfully
- [ ] All 18 tables exist in Supabase
- [ ] Edge function secret `SUPABASE_SERVICE_ROLE_KEY` is set
- [ ] All 3 environment variables are in Vercel
- [ ] All 3 environment variables are in local `.env` file
- [ ] App redeployed on Vercel
- [ ] Local dev server starts without errors
- [ ] Can sign up a new user
- [ ] Can sign in
- [ ] Profile created in database
- [ ] Storage bucket `ritual-photos` exists

---

## You're Done! 🎉

If all checkboxes are checked, your migration is complete!

**Next:** Start using your app normally. Everything should work as before, but now it's connected to your new Supabase project.

---

## Need Help?

- Check browser console for specific error messages
- Check Supabase Dashboard → Logs for database errors
- Verify all environment variables are set correctly
- Make sure you're using the NEW project, not the old shared one
