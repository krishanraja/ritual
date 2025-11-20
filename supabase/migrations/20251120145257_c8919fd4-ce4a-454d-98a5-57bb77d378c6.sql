-- Add canvas state fields to weekly_cycles table for Magnetic Canvas feature
ALTER TABLE weekly_cycles
ADD COLUMN canvas_state_one jsonb,
ADD COLUMN canvas_state_two jsonb,
ADD COLUMN sync_completed_at timestamp with time zone;

COMMENT ON COLUMN weekly_cycles.canvas_state_one IS 'Partner one emotional token positions and strengths on magnetic canvas';
COMMENT ON COLUMN weekly_cycles.canvas_state_two IS 'Partner two emotional token positions and strengths on magnetic canvas';
COMMENT ON COLUMN weekly_cycles.sync_completed_at IS 'Timestamp when both partners completed their canvas interaction';