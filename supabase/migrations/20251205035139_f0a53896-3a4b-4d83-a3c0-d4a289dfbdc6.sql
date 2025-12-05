-- Add premium columns to couples table
ALTER TABLE couples ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS subscription_id TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add swap tracking to weekly_cycles
ALTER TABLE weekly_cycles ADD COLUMN IF NOT EXISTS swaps_used INTEGER DEFAULT 0;

-- Add nudge tracking per week
ALTER TABLE weekly_cycles ADD COLUMN IF NOT EXISTS nudge_count INTEGER DEFAULT 0;

-- Create index for premium lookups
CREATE INDEX IF NOT EXISTS idx_couples_premium_expires ON couples(premium_expires_at);