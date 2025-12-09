-- Create a more restrictive approach to partner profile access
-- The is_partner RLS policy allows SELECT on all columns, but we need to restrict this

-- Option: Create a separate payments table to move sensitive payment data
-- This is the cleanest security solution

-- 1. Create a new couple_billing table for payment data
CREATE TABLE IF NOT EXISTS public.couple_billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  stripe_customer_id text,
  subscription_id text,
  premium_expires_at timestamp with time zone,
  applied_promo_code text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(couple_id)
);

-- Enable RLS
ALTER TABLE public.couple_billing ENABLE ROW LEVEL SECURITY;

-- Only partner_one (the creator/payer) can view billing details
CREATE POLICY "Only partner one can view billing" 
ON public.couple_billing 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM couples 
    WHERE couples.id = couple_billing.couple_id 
    AND couples.partner_one = auth.uid()
  )
);

-- Only partner_one can update billing
CREATE POLICY "Only partner one can update billing" 
ON public.couple_billing 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM couples 
    WHERE couples.id = couple_billing.couple_id 
    AND couples.partner_one = auth.uid()
  )
);

-- Service role can insert (from webhook)
CREATE POLICY "Service role can manage billing" 
ON public.couple_billing 
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_couple_billing_updated_at
  BEFORE UPDATE ON public.couple_billing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing billing data
INSERT INTO public.couple_billing (couple_id, stripe_customer_id, subscription_id, premium_expires_at, applied_promo_code)
SELECT id, stripe_customer_id, subscription_id, premium_expires_at, applied_promo_code
FROM public.couples
WHERE stripe_customer_id IS NOT NULL OR subscription_id IS NOT NULL OR premium_expires_at IS NOT NULL
ON CONFLICT (couple_id) DO UPDATE SET
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  subscription_id = EXCLUDED.subscription_id,
  premium_expires_at = EXCLUDED.premium_expires_at,
  applied_promo_code = EXCLUDED.applied_promo_code;

-- 2. For profiles email exposure - drop the partner policy entirely
-- Since frontend uses get_partner_name function and only needs name
DROP POLICY IF EXISTS "Users can view their partner's name only" ON public.profiles;

-- Partners will use the get_partner_name() function instead
-- This function already exists and returns only the name