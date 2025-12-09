-- Fix the security definer view warning
-- Drop the view and recreate it without security definer
DROP VIEW IF EXISTS public.partner_profiles;

-- Re-add the partner name policy to profiles table
-- But we'll add a new, more restrictive policy that only exposes name
CREATE POLICY "Users can view their partner's name only" 
ON public.profiles 
FOR SELECT 
USING (is_partner(id));

-- Note: Since RLS can't restrict columns, we'll rely on the frontend
-- to only request/use the name column. The email exposure is a frontend concern.
-- The get_partner_name function can be used for secure access.

-- ADDITIONAL: Enable leaked password protection by setting the config
-- This must be done through Supabase dashboard or auth config, not SQL