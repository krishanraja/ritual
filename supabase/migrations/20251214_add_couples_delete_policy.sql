-- ===========================================
-- FIX: Add DELETE policy for couples table
-- Issue: "Leave Couple" fails for partner_one because no DELETE policy exists
-- Date: 2025-12-14
-- ===========================================

-- Partner one (creator) can delete the couple entirely
CREATE POLICY "Partner one can delete their couple" 
ON public.couples 
FOR DELETE 
USING (auth.uid() = partner_one);

-- Note: Partner two leaves by UPDATE (setting partner_two = null), 
-- which is already covered by the existing UPDATE policy.

