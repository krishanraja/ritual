-- Add unique constraint to couple_code to prevent duplicates
ALTER TABLE couples 
ADD CONSTRAINT unique_couple_code UNIQUE (couple_code);