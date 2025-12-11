-- Step 1: Create ritual-photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ritual-photos',
  'ritual-photos', 
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Step 2: RLS for storage - Users can upload to their couple's folder
CREATE POLICY "Users can upload couple photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ritual-photos' AND
  EXISTS (
    SELECT 1 FROM public.couples 
    WHERE (id::text = (storage.foldername(name))[1])
    AND (partner_one = auth.uid() OR partner_two = auth.uid())
  )
);

-- Step 3: RLS for storage - Users can view their couple's photos
CREATE POLICY "Users can view couple photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ritual-photos' AND
  EXISTS (
    SELECT 1 FROM public.couples 
    WHERE (id::text = (storage.foldername(name))[1])
    AND (partner_one = auth.uid() OR partner_two = auth.uid())
  )
);

-- Step 4: Create memory_reactions table
CREATE TABLE public.memory_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid NOT NULL REFERENCES public.ritual_memories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction text NOT NULL CHECK (reaction IN ('❤️', '🔥', '😍', '🥹', '👏')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(memory_id, user_id)
);

-- Step 5: Enable RLS on memory_reactions
ALTER TABLE public.memory_reactions ENABLE ROW LEVEL SECURITY;

-- Step 6: RLS - Couple members can view reactions
CREATE POLICY "Couple members can view reactions"
ON public.memory_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ritual_memories rm
    JOIN public.couples c ON c.id = rm.couple_id
    WHERE rm.id = memory_reactions.memory_id
    AND (c.partner_one = auth.uid() OR c.partner_two = auth.uid())
  )
);

-- Step 7: RLS - Couple members can add reactions
CREATE POLICY "Couple members can add reactions"
ON public.memory_reactions FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.ritual_memories rm
    JOIN public.couples c ON c.id = rm.couple_id
    WHERE rm.id = memory_reactions.memory_id
    AND (c.partner_one = auth.uid() OR c.partner_two = auth.uid())
  )
);

-- Step 8: RLS - Users can update their own reactions
CREATE POLICY "Users can update their own reactions"
ON public.memory_reactions FOR UPDATE
USING (auth.uid() = user_id);

-- Step 9: RLS - Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions"
ON public.memory_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Step 10: Enable realtime for memory_reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.memory_reactions;