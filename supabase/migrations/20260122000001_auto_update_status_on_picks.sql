-- Migration: Trigger status recomputation when picks/slots change
-- Created: 2026-01-22
-- Purpose: Ensure cycle status updates when ritual_preferences or availability_slots change

-- Drop triggers if exists (for reruns)
DROP TRIGGER IF EXISTS recompute_status_on_picks_change ON ritual_preferences;
DROP TRIGGER IF EXISTS recompute_status_on_slots_change ON availability_slots;
DROP FUNCTION IF EXISTS recompute_cycle_status_on_picks();

-- Create function to touch weekly_cycles row (triggers status recomputation)
CREATE OR REPLACE FUNCTION recompute_cycle_status_on_picks()
RETURNS TRIGGER AS $$
BEGIN
  -- Touch the weekly_cycles row to trigger status recomputation
  -- Use updated_at to avoid infinite loops
  UPDATE weekly_cycles
  SET updated_at = NOW()
  WHERE id = COALESCE(NEW.weekly_cycle_id, OLD.weekly_cycle_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on ritual_preferences table
CREATE TRIGGER recompute_status_on_picks_change
  AFTER INSERT OR UPDATE OR DELETE ON ritual_preferences
  FOR EACH ROW
  EXECUTE FUNCTION recompute_cycle_status_on_picks();

-- Create trigger on availability_slots table
CREATE TRIGGER recompute_status_on_slots_change
  AFTER INSERT OR UPDATE OR DELETE ON availability_slots
  FOR EACH ROW
  EXECUTE FUNCTION recompute_cycle_status_on_picks();

-- Add comment for documentation
COMMENT ON FUNCTION recompute_cycle_status_on_picks() IS 'Triggers status recomputation in weekly_cycles when ritual_preferences or availability_slots change.';
