-- ===========================================
-- COMPLETE SUPABASE SCHEMA FOR RITUAL APP
-- ===========================================
-- This file contains the complete database schema for a fresh Supabase project.
-- Run this file in your new Supabase project's SQL editor to set up all tables,
-- policies, functions, triggers, and storage buckets.
--
-- IMPORTANT: This schema assumes a fresh database. If you're migrating from
-- an existing project, review individual migration files in chronological order.
-- ===========================================

-- ===========================================
-- SECTION 1: HELPER FUNCTIONS
-- ===========================================

-- Function to auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to check if a profile is the current user's partner
CREATE OR REPLACE FUNCTION public.is_partner(profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM couples
    WHERE is_active = true
    AND (
      (partner_one = auth.uid() AND partner_two = profile_id)
      OR (partner_two = auth.uid() AND partner_one = profile_id)
    )
  )
$$;

-- Function to securely get partner's name (only name, not email)
CREATE OR REPLACE FUNCTION public.get_partner_name(partner_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT name FROM profiles WHERE id = partner_id AND is_partner(partner_id)
$$;

-- Function to validate couple code without exposing it
CREATE OR REPLACE FUNCTION public.validate_couple_code(input_code TEXT)
RETURNS TABLE (couple_id UUID, is_valid BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as couple_id,
    TRUE as is_valid
  FROM couples c
  WHERE c.couple_code = input_code
    AND c.partner_two IS NULL
    AND c.is_active = true
    AND c.code_expires_at > now()
  LIMIT 1;
END;
$$;

-- Function to join couple with code (bulletproof with verification)
CREATE OR REPLACE FUNCTION public.join_couple_with_code(input_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_couple couples%ROWTYPE;
  current_user_id uuid;
  verified_partner_two uuid;
  rows_updated integer;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Find and lock the couple row to prevent race conditions
  SELECT * INTO target_couple
  FROM couples
  WHERE couple_code = input_code
    AND partner_two IS NULL
    AND is_active = true
    AND code_expires_at > now()
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Code not found or expired. Check with your partner.');
  END IF;
  
  -- Check not joining own couple
  IF target_couple.partner_one = current_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot join your own couple code!');
  END IF;
  
  -- Perform the join
  UPDATE couples
  SET partner_two = current_user_id
  WHERE id = target_couple.id
    AND partner_two IS NULL;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  
  IF rows_updated = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Join failed - someone else may have joined first');
  END IF;
  
  -- Verify the update persisted
  SELECT partner_two INTO verified_partner_two
  FROM couples
  WHERE id = target_couple.id;
  
  IF verified_partner_two IS NULL OR verified_partner_two != current_user_id THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Database update failed to persist',
      'debug', jsonb_build_object(
        'expected', current_user_id::text,
        'actual', COALESCE(verified_partner_two::text, 'NULL'),
        'couple_id', target_couple.id::text
      )
    );
  END IF;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'couple_id', target_couple.id,
    'partner_one', target_couple.partner_one,
    'partner_two', current_user_id,
    'verified', true
  );
END;
$$;

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'User'),
    new.email
  );
  RETURN new;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.validate_couple_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_partner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_partner_name(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_couple_with_code(text) TO authenticated;

-- ===========================================
-- SECTION 2: TABLES
-- ===========================================

-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  avatar_id text,
  preferred_city text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Couples table
CREATE TABLE public.couples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_one uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  partner_two uuid REFERENCES public.profiles ON DELETE CASCADE,
  couple_code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  current_cycle_week_start date,
  synthesis_ready boolean DEFAULT false,
  is_active boolean DEFAULT true,
  preferred_city text DEFAULT 'New York',
  code_expires_at timestamptz,
  -- Note: Billing data moved to couple_billing table for security
  -- These columns kept for backward compatibility but should not be used
  premium_expires_at timestamptz,
  subscription_id text,
  stripe_customer_id text,
  applied_promo_code text
);

-- Weekly cycles table
CREATE TABLE public.weekly_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES public.couples ON DELETE CASCADE NOT NULL,
  week_start_date date NOT NULL,
  partner_one_input jsonb,
  partner_two_input jsonb,
  partner_one_submitted_at timestamptz,
  partner_two_submitted_at timestamptz,
  synthesized_output jsonb,
  generated_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  -- Agreement tracking
  agreement_reached boolean DEFAULT false,
  agreed_ritual jsonb,
  agreed_date date,
  agreed_time time,
  -- Canvas state for agreement game
  canvas_state_one jsonb,
  canvas_state_two jsonb,
  sync_completed_at timestamptz,
  -- Swap and nudge tracking
  swaps_used integer DEFAULT 0,
  nudge_count integer DEFAULT 0,
  nudged_at timestamptz
);

-- Ritual library table (public catalog)
CREATE TABLE public.ritual_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  time_estimate text NOT NULL,
  budget_band text NOT NULL,
  constraints jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Completions table
CREATE TABLE public.completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_cycle_id uuid REFERENCES public.weekly_cycles ON DELETE CASCADE NOT NULL,
  ritual_title text NOT NULL,
  completed_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Ritual preferences table (for mutual agreement)
CREATE TABLE public.ritual_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_cycle_id uuid NOT NULL REFERENCES public.weekly_cycles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ritual_title text NOT NULL,
  ritual_data jsonb NOT NULL,
  rank integer NOT NULL CHECK (rank >= 1 AND rank <= 3),
  proposed_date date,
  proposed_time time,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(weekly_cycle_id, user_id, rank)
);

-- Ritual streaks table
CREATE TABLE public.ritual_streaks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_completion_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(couple_id)
);

-- Ritual memories table
CREATE TABLE public.ritual_memories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  ritual_title text NOT NULL,
  ritual_description text,
  completion_date date NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  notes text,
  photo_url text,
  is_tradition boolean DEFAULT false,
  tradition_count integer DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ritual suggestions table
CREATE TABLE public.ritual_suggestions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  suggested_ritual jsonb NOT NULL,
  reason text NOT NULL,
  based_on_history jsonb,
  shown_at timestamptz NOT NULL DEFAULT now(),
  accepted boolean,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ritual feedback table
CREATE TABLE public.ritual_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  weekly_cycle_id uuid NOT NULL REFERENCES public.weekly_cycles(id) ON DELETE CASCADE,
  user_id uuid,
  did_complete boolean,
  connection_rating integer CHECK (connection_rating >= 1 AND connection_rating <= 5),
  would_repeat text CHECK (would_repeat IN ('yes', 'maybe', 'no')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Bucket list items table
CREATE TABLE public.bucket_list_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'import_text', 'import_image')),
  original_image_url text,
  completed boolean DEFAULT false,
  completed_ritual_id uuid REFERENCES public.weekly_cycles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Memory reactions table
CREATE TABLE public.memory_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid NOT NULL REFERENCES public.ritual_memories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction text NOT NULL CHECK (reaction IN ('❤️', '🔥', '😍', '🥹', '👏')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(memory_id, user_id)
);

-- Push subscriptions table
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Surprise rituals table
CREATE TABLE public.surprise_rituals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL,
  ritual_data jsonb NOT NULL,
  delivered_at timestamptz DEFAULT now(),
  opened_at timestamptz,
  completed_at timestamptz,
  month date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(couple_id, month)
);

-- Couple billing table (separate for security)
CREATE TABLE public.couple_billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  stripe_customer_id text,
  subscription_id text,
  premium_expires_at timestamptz,
  applied_promo_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(couple_id)
);

-- User analytics events table
CREATE TABLE public.user_analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  couple_id uuid REFERENCES public.couples(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  page text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User feedback table
CREATE TABLE public.user_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  couple_id uuid REFERENCES public.couples(id) ON DELETE SET NULL,
  feedback_type text NOT NULL CHECK (feedback_type IN ('quick_reaction', 'feature_request', 'bug_report', 'general', 'nps_score')),
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative', NULL)),
  message text,
  context jsonb DEFAULT '{}'::jsonb,
  page_context text,
  user_journey_stage text,
  rating integer CHECK (rating >= 1 AND rating <= 10),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Contact submissions table
CREATE TABLE public.contact_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===========================================
-- SECTION 3: ENABLE ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ritual_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ritual_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ritual_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ritual_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ritual_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ritual_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bucket_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surprise_rituals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- SECTION 4: RLS POLICIES
-- ===========================================

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view their partner's name only"
  ON public.profiles FOR SELECT
  USING (is_partner(id));

-- Couples policies
CREATE POLICY "Users can view their couple"
  ON public.couples FOR SELECT
  USING (auth.uid() = partner_one OR auth.uid() = partner_two);

CREATE POLICY "Authenticated users can create couples"
  ON public.couples FOR INSERT
  WITH CHECK (auth.uid() = partner_one);

CREATE POLICY "Couple members can update their couple"
  ON public.couples FOR UPDATE
  USING (auth.uid() = partner_one OR auth.uid() = partner_two)
  WITH CHECK (auth.uid() = partner_one OR auth.uid() = partner_two);

CREATE POLICY "Partner one can delete their couple"
  ON public.couples FOR DELETE
  USING (auth.uid() = partner_one);

-- Weekly cycles policies
CREATE POLICY "Users can view their weekly cycles"
  ON public.weekly_cycles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = weekly_cycles.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can insert their weekly cycles"
  ON public.weekly_cycles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = weekly_cycles.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can update their weekly cycles"
  ON public.weekly_cycles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = weekly_cycles.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can delete their couple's empty cycles"
  ON public.weekly_cycles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = weekly_cycles.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
    AND partner_one_input IS NULL
    AND partner_two_input IS NULL
  );

-- Ritual library policies (public read)
CREATE POLICY "Anyone can view ritual library"
  ON public.ritual_library FOR SELECT
  USING (true);

-- Completions policies
CREATE POLICY "Users can view their completions"
  ON public.completions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.weekly_cycles wc
      JOIN public.couples c ON c.id = wc.couple_id
      WHERE wc.id = completions.weekly_cycle_id
      AND (c.partner_one = auth.uid() OR c.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can insert their completions"
  ON public.completions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.weekly_cycles wc
      JOIN public.couples c ON c.id = wc.couple_id
      WHERE wc.id = completions.weekly_cycle_id
      AND (c.partner_one = auth.uid() OR c.partner_two = auth.uid())
    )
  );

-- Ritual preferences policies
CREATE POLICY "Users can view their couple's preferences"
  ON public.ritual_preferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.weekly_cycles wc
      JOIN public.couples c ON c.id = wc.couple_id
      WHERE wc.id = ritual_preferences.weekly_cycle_id
      AND (c.partner_one = auth.uid() OR c.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can insert their preferences"
  ON public.ritual_preferences FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.weekly_cycles wc
      JOIN public.couples c ON c.id = wc.couple_id
      WHERE wc.id = ritual_preferences.weekly_cycle_id
      AND (c.partner_one = auth.uid() OR c.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can update their preferences"
  ON public.ritual_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their preferences"
  ON public.ritual_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Ritual streaks policies
CREATE POLICY "Users can view their couple's streak"
  ON public.ritual_streaks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = ritual_streaks.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can update their couple's streak"
  ON public.ritual_streaks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = ritual_streaks.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can insert their couple's streak"
  ON public.ritual_streaks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = ritual_streaks.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can delete their couple's streak"
  ON public.ritual_streaks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = ritual_streaks.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

-- Ritual memories policies
CREATE POLICY "Users can view their couple's memories"
  ON public.ritual_memories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = ritual_memories.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can create their couple's memories"
  ON public.ritual_memories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = ritual_memories.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can update their couple's memories"
  ON public.ritual_memories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = ritual_memories.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can delete their couple's memories"
  ON public.ritual_memories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = ritual_memories.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

-- Ritual suggestions policies
CREATE POLICY "Users can view their couple's suggestions"
  ON public.ritual_suggestions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = ritual_suggestions.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can create suggestions for their couple"
  ON public.ritual_suggestions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = ritual_suggestions.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can update their couple's suggestions"
  ON public.ritual_suggestions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = ritual_suggestions.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can delete their couple's suggestions"
  ON public.ritual_suggestions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = ritual_suggestions.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

-- Ritual feedback policies
CREATE POLICY "Users can view their couple's feedback"
  ON public.ritual_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = ritual_feedback.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can insert their couple's feedback"
  ON public.ritual_feedback FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = ritual_feedback.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can update their couple's feedback"
  ON public.ritual_feedback FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = ritual_feedback.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

-- Bucket list items policies
CREATE POLICY "Users can view their couple's bucket list"
  ON public.bucket_list_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = bucket_list_items.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can insert into their couple's bucket list"
  ON public.bucket_list_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = bucket_list_items.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can update their couple's bucket list"
  ON public.bucket_list_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = bucket_list_items.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can delete their couple's bucket list items"
  ON public.bucket_list_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = bucket_list_items.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

-- Memory reactions policies
CREATE POLICY "Couple members can view reactions"
  ON public.memory_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ritual_memories rm
      JOIN public.couples c ON c.id = rm.couple_id
      WHERE rm.id = memory_reactions.memory_id
      AND (c.partner_one = auth.uid() OR c.partner_two = auth.uid())
    )
  );

CREATE POLICY "Couple members can add reactions"
  ON public.memory_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.ritual_memories rm
      JOIN public.couples c ON c.id = rm.couple_id
      WHERE rm.id = memory_reactions.memory_id
      AND (c.partner_one = auth.uid() OR c.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can update their own reactions"
  ON public.memory_reactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON public.memory_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Push subscriptions policies
CREATE POLICY "Users can view their own push subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Surprise rituals policies
CREATE POLICY "Users can view their couple's surprise rituals"
  ON public.surprise_rituals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = surprise_rituals.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can update their couple's surprise rituals"
  ON public.surprise_rituals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = surprise_rituals.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

CREATE POLICY "Only service role can insert surprise rituals"
  ON public.surprise_rituals FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Couple billing policies
CREATE POLICY "Only partner one can view billing"
  ON public.couple_billing FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = couple_billing.couple_id
      AND couples.partner_one = auth.uid()
    )
  );

CREATE POLICY "Only partner one can update billing"
  ON public.couple_billing FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = couple_billing.couple_id
      AND couples.partner_one = auth.uid()
    )
  );

CREATE POLICY "Service role can manage billing"
  ON public.couple_billing FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- User analytics events policies
CREATE POLICY "Users can insert their own analytics"
  ON public.user_analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own analytics"
  ON public.user_analytics_events FOR SELECT
  USING (auth.uid() = user_id);

-- User feedback policies
CREATE POLICY "Users can insert their own feedback"
  ON public.user_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
  ON public.user_feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Contact submissions policies
CREATE POLICY "Anyone can submit contact form"
  ON public.contact_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own submissions"
  ON public.contact_submissions FOR SELECT
  USING (auth.uid() = user_id);

-- ===========================================
-- SECTION 5: TRIGGERS
-- ===========================================

-- Trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at columns
CREATE TRIGGER update_ritual_streaks_updated_at
  BEFORE UPDATE ON public.ritual_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ritual_memories_updated_at
  BEFORE UPDATE ON public.ritual_memories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ritual_feedback_updated_at
  BEFORE UPDATE ON public.ritual_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bucket_list_items_updated_at
  BEFORE UPDATE ON public.bucket_list_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_couple_billing_updated_at
  BEFORE UPDATE ON public.couple_billing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- SECTION 6: INDEXES
-- ===========================================

-- Performance indexes
CREATE INDEX idx_couples_premium_expires ON public.couples(premium_expires_at);
CREATE INDEX idx_ritual_streaks_couple_id ON public.ritual_streaks(couple_id);
CREATE INDEX idx_ritual_memories_couple_id ON public.ritual_memories(couple_id);
CREATE INDEX idx_ritual_memories_completion_date ON public.ritual_memories(completion_date DESC);
CREATE INDEX idx_ritual_suggestions_couple_id ON public.ritual_suggestions(couple_id);
CREATE INDEX idx_ritual_suggestions_shown_at ON public.ritual_suggestions(shown_at DESC);
CREATE INDEX idx_ritual_feedback_couple_id ON public.ritual_feedback(couple_id);
CREATE INDEX idx_ritual_feedback_weekly_cycle_id ON public.ritual_feedback(weekly_cycle_id);
CREATE INDEX idx_analytics_user_id ON public.user_analytics_events(user_id);
CREATE INDEX idx_analytics_event_type ON public.user_analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON public.user_analytics_events(created_at);
CREATE INDEX idx_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX idx_feedback_type ON public.user_feedback(feedback_type);

-- ===========================================
-- SECTION 7: STORAGE BUCKET
-- ===========================================

-- Create ritual-photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ritual-photos',
  'ritual-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Users can upload couple photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ritual-photos' AND
  EXISTS (
    SELECT 1 FROM public.couples
    WHERE (id::text = (storage.foldername(name))[1])
    AND (partner_one = auth.uid() OR partner_two = auth.uid())
  )
);

CREATE POLICY "Users can view couple photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ritual-photos' AND
  EXISTS (
    SELECT 1 FROM public.couples
    WHERE (id::text = (storage.foldername(name))[1])
    AND (partner_one = auth.uid() OR partner_two = auth.uid())
  )
);

-- ===========================================
-- SECTION 8: REALTIME
-- ===========================================

-- Enable realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.couples;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_cycles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ritual_streaks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ritual_memories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ritual_suggestions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.memory_reactions;

-- ===========================================
-- END OF SCHEMA
-- ===========================================
-- 
-- Next steps:
-- 1. Verify all tables were created: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- 2. Verify RLS is enabled: SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- 3. Verify functions exist: SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';
-- 4. Test storage bucket: Check in Supabase dashboard Storage section
-- 5. Test realtime: Check in Supabase dashboard Realtime section
-- ===========================================
