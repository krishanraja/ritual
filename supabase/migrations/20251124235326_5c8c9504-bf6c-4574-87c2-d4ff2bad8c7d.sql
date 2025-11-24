-- Allow authenticated users to join open couples by updating partner_two
-- This enables new users to join a couple by setting themselves as partner_two
CREATE POLICY "Anyone can join open couples" ON couples
FOR UPDATE 
TO authenticated
USING (partner_two IS NULL)
WITH CHECK (partner_two = auth.uid());