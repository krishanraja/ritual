-- Add code expiration and active status to couples table
ALTER TABLE public.couples 
ADD COLUMN IF NOT EXISTS code_expires_at timestamptz DEFAULT (now() + interval '24 hours'),
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add foreign key constraints to link partners to profiles
ALTER TABLE public.couples
DROP CONSTRAINT IF EXISTS couples_partner_one_fkey,
DROP CONSTRAINT IF EXISTS couples_partner_two_fkey;

ALTER TABLE public.couples
ADD CONSTRAINT couples_partner_one_fkey 
  FOREIGN KEY (partner_one) REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT couples_partner_two_fkey 
  FOREIGN KEY (partner_two) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can update their couple" ON public.couples;
DROP POLICY IF EXISTS "Anyone can join open couples" ON public.couples;

-- Allow partner_one to delete the couple
CREATE POLICY "Partner one can delete couple" 
ON public.couples
FOR DELETE 
TO authenticated
USING (auth.uid() = partner_one AND is_active = true);

-- Allow partner_two to join (set partner_two field)
CREATE POLICY "Anyone can join open couples" 
ON public.couples
FOR UPDATE
TO authenticated
USING (partner_two IS NULL AND is_active = true AND code_expires_at > now())
WITH CHECK (partner_two = auth.uid());

-- Allow partner_two to leave (set partner_two to NULL)
CREATE POLICY "Partner two can leave couple" 
ON public.couples
FOR UPDATE
TO authenticated
USING (auth.uid() = partner_two AND is_active = true)
WITH CHECK (partner_two IS NULL);

-- Allow partner_one to update couple settings
CREATE POLICY "Partner one can update couple" 
ON public.couples
FOR UPDATE
TO authenticated
USING (auth.uid() = partner_one AND is_active = true);

-- Update existing couples to have expiration dates and active status
UPDATE public.couples 
SET code_expires_at = created_at + interval '24 hours',
    is_active = true
WHERE code_expires_at IS NULL OR is_active IS NULL;