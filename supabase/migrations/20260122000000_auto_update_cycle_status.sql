-- Migration: Auto-update cycle status based on state
-- Created: 2026-01-22
-- Purpose: Eliminate client-side status race conditions by computing status in database

-- Drop trigger if exists (for reruns)
DROP TRIGGER IF EXISTS auto_update_cycle_status ON weekly_cycles;
DROP FUNCTION IF EXISTS update_cycle_status();

-- Create function to compute status based on cycle state
CREATE OR REPLACE FUNCTION update_cycle_status()
RETURNS TRIGGER AS $$
DECLARE
  p1_id UUID;
  p2_id UUID;
  p1_pick_count INTEGER;
  p2_pick_count INTEGER;
  p1_slot_count INTEGER;
  p2_slot_count INTEGER;
BEGIN
  -- Get partner IDs for this couple
  SELECT partner_one, partner_two INTO p1_id, p2_id
  FROM couples
  WHERE id = NEW.couple_id;

  -- If agreement already reached, status is 'agreed'
  IF NEW.agreement_reached = true AND NEW.agreed_ritual IS NOT NULL THEN
    NEW.status := 'agreed';
    RETURN NEW;
  END IF;

  -- Check if both partners have submitted input
  IF NEW.partner_one_input IS NOT NULL AND NEW.partner_two_input IS NOT NULL THEN
    
    -- If synthesis output exists, check picks
    IF NEW.synthesized_output IS NOT NULL THEN
      
      -- Count picks and slots for each partner
      SELECT COUNT(*) INTO p1_pick_count
      FROM ritual_preferences
      WHERE weekly_cycle_id = NEW.id AND user_id = p1_id;

      SELECT COUNT(*) INTO p2_pick_count
      FROM ritual_preferences
      WHERE weekly_cycle_id = NEW.id AND user_id = p2_id;

      SELECT COUNT(*) INTO p1_slot_count
      FROM availability_slots
      WHERE weekly_cycle_id = NEW.id AND user_id = p1_id;

      SELECT COUNT(*) INTO p2_slot_count
      FROM availability_slots
      WHERE weekly_cycle_id = NEW.id AND user_id = p2_id;

      -- Both have picked enough (3+ rituals, 1+ slot each)
      IF p1_pick_count >= 3 AND p1_slot_count >= 1 AND p2_pick_count >= 3 AND p2_slot_count >= 1 THEN
        NEW.status := 'awaiting_agreement';
      -- Only partner one has picked
      ELSIF p1_pick_count >= 3 AND p1_slot_count >= 1 THEN
        NEW.status := 'awaiting_partner_two_pick';
      -- Only partner two has picked
      ELSIF p2_pick_count >= 3 AND p2_slot_count >= 1 THEN
        NEW.status := 'awaiting_partner_one_pick';
      -- Neither has picked enough yet
      ELSE
        NEW.status := 'awaiting_both_picks';
      END IF;

    -- Both submitted but synthesis not complete yet
    ELSE
      NEW.status := 'generating';
    END IF;

  -- Only partner one has submitted
  ELSIF NEW.partner_one_input IS NOT NULL THEN
    NEW.status := 'awaiting_partner_two';

  -- Only partner two has submitted
  ELSIF NEW.partner_two_input IS NOT NULL THEN
    NEW.status := 'awaiting_partner_one';

  -- Neither has submitted
  ELSE
    NEW.status := 'awaiting_both_input';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run before insert/update
CREATE TRIGGER auto_update_cycle_status
  BEFORE INSERT OR UPDATE ON weekly_cycles
  FOR EACH ROW
  EXECUTE FUNCTION update_cycle_status();

-- Add comment for documentation
COMMENT ON FUNCTION update_cycle_status() IS 'Automatically computes weekly_cycles.status based on current state. Eliminates client-side status race conditions.';
