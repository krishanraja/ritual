-- ===========================================
-- SECURITY AUDIT FIXES - Critical & High Priority
-- ===========================================

-- 1. FIX: Profiles table - Create a view that only exposes partner's name (not email)
-- Drop the overly permissive policy and create a more restrictive one
DROP POLICY IF EXISTS "Users can view their partner's name" ON public.profiles;

-- Create a more specific policy that only allows viewing partner's name
-- We'll use a database function to control which columns are accessible
CREATE OR REPLACE FUNCTION public.get_partner_name(partner_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT name FROM profiles WHERE id = partner_id AND is_partner(partner_id)
$$;

-- Re-create partner view policy with explicit column restriction via RLS
-- Note: RLS policies can't restrict columns, so we need a different approach
-- Create a secure view for partner data
CREATE OR REPLACE VIEW public.partner_profiles AS
SELECT 
  p.id,
  p.name
FROM profiles p
WHERE is_partner(p.id);

-- Grant access to the view
GRANT SELECT ON public.partner_profiles TO authenticated;

-- 2. FIX: Surprise rituals - Restrict INSERT to proper couple validation
DROP POLICY IF EXISTS "Service role can insert surprise rituals" ON public.surprise_rituals;

CREATE POLICY "Only service role can insert surprise rituals" 
ON public.surprise_rituals 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- 3. FIX: Push subscriptions - Add UPDATE policy
CREATE POLICY "Users can update their own push subscriptions" 
ON public.push_subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. FIX: Ritual streaks - Add DELETE policy
CREATE POLICY "Users can delete their couple's streak" 
ON public.ritual_streaks 
FOR DELETE 
USING (EXISTS ( 
  SELECT 1 FROM couples 
  WHERE couples.id = ritual_streaks.couple_id 
  AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
));

-- 5. FIX: Ritual suggestions - Add DELETE policy
CREATE POLICY "Users can delete their couple's suggestions" 
ON public.ritual_suggestions 
FOR DELETE 
USING (EXISTS ( 
  SELECT 1 FROM couples 
  WHERE couples.id = ritual_suggestions.couple_id 
  AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
));

-- 6. FIX: Weekly cycles - Add DELETE policy (limited scope)
CREATE POLICY "Users can delete their couple's empty cycles" 
ON public.weekly_cycles 
FOR DELETE 
USING (
  EXISTS ( 
    SELECT 1 FROM couples 
    WHERE couples.id = weekly_cycles.couple_id 
    AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
  )
  -- Only allow deletion of cycles with no submissions yet
  AND partner_one_input IS NULL 
  AND partner_two_input IS NULL
);

-- 7. IMPROVEMENT: Add NOT NULL constraint to user_analytics_events.user_id
-- This prevents orphaned anonymous analytics that can't be read
-- First update any existing NULL values (set to a system UUID or delete)
DELETE FROM public.user_analytics_events WHERE user_id IS NULL;

-- Now make user_id required
ALTER TABLE public.user_analytics_events 
ALTER COLUMN user_id SET NOT NULL;

-- Update the INSERT policy to require user_id
DROP POLICY IF EXISTS "Users can insert their own analytics" ON public.user_analytics_events;

CREATE POLICY "Users can insert their own analytics" 
ON public.user_analytics_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 8. IMPROVEMENT: Add NOT NULL constraint to user_feedback.user_id
-- This prevents orphaned anonymous feedback that can't be read
DELETE FROM public.user_feedback WHERE user_id IS NULL;

ALTER TABLE public.user_feedback 
ALTER COLUMN user_id SET NOT NULL;

DROP POLICY IF EXISTS "Users can insert feedback" ON public.user_feedback;

CREATE POLICY "Users can insert their own feedback" 
ON public.user_feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);