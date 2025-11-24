-- Allow authenticated users to view joinable couples (where partner_two is null)
-- This enables new users to look up couple codes when joining
CREATE POLICY "Anyone can view joinable couples" ON couples
FOR SELECT 
TO authenticated
USING (partner_two IS NULL);