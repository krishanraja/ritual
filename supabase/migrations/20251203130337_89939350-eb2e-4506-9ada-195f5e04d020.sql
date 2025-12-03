-- Phase 2: Create bucket_list_items table for bucket list import
CREATE TABLE public.bucket_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'import_text', 'import_image')),
  original_image_url TEXT,
  completed BOOLEAN DEFAULT false,
  completed_ritual_id UUID REFERENCES public.weekly_cycles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bucket_list_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for bucket_list_items
CREATE POLICY "Users can view their couple's bucket list"
ON public.bucket_list_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM couples
  WHERE couples.id = bucket_list_items.couple_id
  AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
));

CREATE POLICY "Users can insert into their couple's bucket list"
ON public.bucket_list_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM couples
  WHERE couples.id = bucket_list_items.couple_id
  AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
));

CREATE POLICY "Users can update their couple's bucket list"
ON public.bucket_list_items FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM couples
  WHERE couples.id = bucket_list_items.couple_id
  AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
));

CREATE POLICY "Users can delete their couple's bucket list items"
ON public.bucket_list_items FOR DELETE
USING (EXISTS (
  SELECT 1 FROM couples
  WHERE couples.id = bucket_list_items.couple_id
  AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
));

-- Trigger for updated_at
CREATE TRIGGER update_bucket_list_items_updated_at
BEFORE UPDATE ON public.bucket_list_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Phase 3: Add user_id to ritual_feedback for per-user tracking
ALTER TABLE public.ritual_feedback ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add is_tradition flag to ritual_memories
ALTER TABLE public.ritual_memories ADD COLUMN IF NOT EXISTS is_tradition BOOLEAN DEFAULT false;

-- Add tradition_count to track how many times a ritual has been done
ALTER TABLE public.ritual_memories ADD COLUMN IF NOT EXISTS tradition_count INTEGER DEFAULT 1;