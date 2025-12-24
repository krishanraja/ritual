-- Fix profile creation by adding RPC function and proper INSERT policy
-- This allows both trigger-based and client-side profile creation

-- Create RPC function for ensuring profile exists (more secure than direct INSERT)
CREATE OR REPLACE FUNCTION public.ensure_profile_exists()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  user_email text;
  user_name text;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE WARNING 'ensure_profile_exists: No authenticated user';
    RETURN false;
  END IF;
  
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE id = current_user_id) THEN
    RETURN true;
  END IF;
  
  -- Get user data from auth.users
  SELECT email, raw_user_meta_data->>'name' INTO user_email, user_name
  FROM auth.users 
  WHERE id = current_user_id;
  
  -- Create profile (SECURITY DEFINER bypasses RLS)
  INSERT INTO profiles (id, name, email)
  VALUES (
    current_user_id, 
    COALESCE(user_name, COALESCE(split_part(user_email, '@', 1), 'User')), 
    user_email
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Verify it was created
  IF EXISTS (SELECT 1 FROM profiles WHERE id = current_user_id) THEN
    RETURN true;
  ELSE
    RAISE WARNING 'ensure_profile_exists: Failed to create profile for user %', current_user_id;
    RETURN false;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'ensure_profile_exists: Error creating profile for user %: %', current_user_id, SQLERRM;
    RETURN false;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_profile_exists() TO authenticated;

-- Also add a client-side INSERT policy as fallback (allows users to create their own profile)
-- This is less secure but provides a fallback if RPC fails
CREATE POLICY IF NOT EXISTS "Users can create their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

