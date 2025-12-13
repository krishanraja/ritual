-- Add avatar_id column to profiles table for optional avatar selection
ALTER TABLE public.profiles 
ADD COLUMN avatar_id text DEFAULT NULL;