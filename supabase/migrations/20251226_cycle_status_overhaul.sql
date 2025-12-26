-- ============================================================================
-- Migration: Cycle Status Overhaul
-- Purpose: Add explicit cycle_status enum and availability_slots table
-- Date: 2025-12-26
-- 
-- INSTRUCTIONS: Run this SQL manually in Supabase SQL Editor
-- This migration is idempotent - safe to run multiple times
-- ============================================================================

-- Step 1: Create the cycle_status enum type
DO $$ BEGIN
  CREATE TYPE cycle_status AS ENUM (
    'awaiting_both_input',
    'awaiting_partner_one',
    'awaiting_partner_two',
    'generating',
    'generation_failed',
    'awaiting_both_picks',
    'awaiting_partner_one_pick',
    'awaiting_partner_two_pick',
    'awaiting_agreement',
    'agreed',
    'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add status column to weekly_cycles
ALTER TABLE weekly_cycles 
ADD COLUMN IF NOT EXISTS status cycle_status DEFAULT 'awaiting_both_input';

-- Step 3: Add updated_at column if missing
ALTER TABLE weekly_cycles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Step 4: Reset incomplete cycles (per user's choice)
-- Delete cycles that are mid-flow so users start fresh
DELETE FROM weekly_cycles 
WHERE agreement_reached = false 
  AND (synthesized_output IS NULL OR agreed_ritual IS NULL);

-- Step 5: Backfill status for any remaining rows
UPDATE weekly_cycles SET status = 
  CASE
    WHEN agreement_reached = true THEN 'agreed'::cycle_status
    WHEN synthesized_output IS NOT NULL AND agreement_reached = false THEN 'awaiting_both_picks'::cycle_status
    WHEN partner_one_input IS NOT NULL AND partner_two_input IS NOT NULL AND synthesized_output IS NULL THEN 'generating'::cycle_status
    WHEN partner_one_input IS NOT NULL AND partner_two_input IS NULL THEN 'awaiting_partner_two'::cycle_status
    WHEN partner_two_input IS NOT NULL AND partner_one_input IS NULL THEN 'awaiting_partner_one'::cycle_status
    ELSE 'awaiting_both_input'::cycle_status
  END
WHERE status IS NULL OR status = 'awaiting_both_input';

-- Step 6: Create trigger function for automatic status transitions
CREATE OR REPLACE FUNCTION update_cycle_status()
RETURNS TRIGGER AS $$
DECLARE
  has_p1_input BOOLEAN;
  has_p2_input BOOLEAN;
  has_output BOOLEAN;
  has_p1_picks BOOLEAN;
  has_p2_picks BOOLEAN;
  is_agreed BOOLEAN;
  v_partner_one UUID;
  v_partner_two UUID;
BEGIN
  -- Get current state
  has_p1_input := NEW.partner_one_input IS NOT NULL;
  has_p2_input := NEW.partner_two_input IS NOT NULL;
  has_output := NEW.synthesized_output IS NOT NULL;
  is_agreed := NEW.agreement_reached = true;
  
  -- Get partner IDs from couple
  SELECT partner_one, partner_two INTO v_partner_one, v_partner_two
  FROM couples WHERE id = NEW.couple_id;
  
  -- Check for picks (requires query to ritual_preferences)
  SELECT EXISTS(
    SELECT 1 FROM ritual_preferences 
    WHERE weekly_cycle_id = NEW.id 
    AND user_id = v_partner_one
    AND rank IS NOT NULL
    LIMIT 1
  ) INTO has_p1_picks;
  
  SELECT EXISTS(
    SELECT 1 FROM ritual_preferences 
    WHERE weekly_cycle_id = NEW.id 
    AND user_id = v_partner_two
    AND rank IS NOT NULL
    LIMIT 1
  ) INTO has_p2_picks;
  
  -- Determine new status based on state
  IF is_agreed THEN
    NEW.status := 'agreed';
  ELSIF has_output AND has_p1_picks AND has_p2_picks THEN
    NEW.status := 'awaiting_agreement';
  ELSIF has_output AND has_p1_picks AND NOT has_p2_picks THEN
    NEW.status := 'awaiting_partner_two_pick';
  ELSIF has_output AND has_p2_picks AND NOT has_p1_picks THEN
    NEW.status := 'awaiting_partner_one_pick';
  ELSIF has_output THEN
    NEW.status := 'awaiting_both_picks';
  ELSIF has_p1_input AND has_p2_input AND NOT has_output THEN
    NEW.status := 'generating';
  ELSIF has_p1_input AND NOT has_p2_input THEN
    NEW.status := 'awaiting_partner_two';
  ELSIF has_p2_input AND NOT has_p1_input THEN
    NEW.status := 'awaiting_partner_one';
  ELSE
    NEW.status := 'awaiting_both_input';
  END IF;
  
  -- Update timestamp
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Drop and recreate the trigger
DROP TRIGGER IF EXISTS cycle_status_transition ON weekly_cycles;
CREATE TRIGGER cycle_status_transition
  BEFORE INSERT OR UPDATE ON weekly_cycles
  FOR EACH ROW
  EXECUTE FUNCTION update_cycle_status();

-- Step 8: Create index for fast status lookups
CREATE INDEX IF NOT EXISTS idx_weekly_cycles_status 
ON weekly_cycles(couple_id, status);

-- Step 9: Create availability_slots table
CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_cycle_id UUID REFERENCES weekly_cycles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  day_offset INT NOT NULL CHECK (day_offset BETWEEN 0 AND 6),
  time_slot TEXT NOT NULL CHECK (time_slot IN ('morning', 'afternoon', 'evening')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(weekly_cycle_id, user_id, day_offset, time_slot)
);

-- Step 10: Enable RLS on availability_slots
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

-- Step 11: RLS policies for availability_slots
DROP POLICY IF EXISTS "Users can manage their own availability" ON availability_slots;
CREATE POLICY "Users can manage their own availability"
  ON availability_slots FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view partner availability" ON availability_slots;
CREATE POLICY "Users can view partner availability"
  ON availability_slots FOR SELECT
  USING (
    weekly_cycle_id IN (
      SELECT wc.id FROM weekly_cycles wc
      JOIN couples c ON wc.couple_id = c.id
      WHERE c.partner_one = auth.uid() OR c.partner_two = auth.uid()
    )
  );

-- Step 12: Enable realtime for availability_slots
DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE availability_slots;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 13: Trigger to update cycle status when preferences are inserted/deleted
CREATE OR REPLACE FUNCTION update_cycle_status_on_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger an update on the weekly_cycle to recalculate status
  UPDATE weekly_cycles 
  SET updated_at = now() 
  WHERE id = COALESCE(NEW.weekly_cycle_id, OLD.weekly_cycle_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS preferences_status_update ON ritual_preferences;
CREATE TRIGGER preferences_status_update
  AFTER INSERT OR UPDATE OR DELETE ON ritual_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_cycle_status_on_preferences();

-- Step 14: Create a unique constraint on ritual_preferences for upsert
DO $$ BEGIN
  ALTER TABLE ritual_preferences 
  ADD CONSTRAINT ritual_preferences_cycle_user_rank_unique 
  UNIQUE (weekly_cycle_id, user_id, rank);
EXCEPTION
  WHEN duplicate_table THEN null;
  WHEN duplicate_object THEN null;
END $$;

-- Step 15: Verify migration by showing current status distribution
SELECT 
  status,
  COUNT(*) as count
FROM weekly_cycles
GROUP BY status
ORDER BY status;

