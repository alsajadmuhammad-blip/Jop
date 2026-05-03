-- Supabase SQL Setup for Hero Carousel Items Table
-- Run these commands in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.hero_carousel_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  src TEXT NOT NULL,
  hint TEXT,
  text TEXT,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hero_carousel_items_store_id_idx ON public.hero_carousel_items(store_id);

CREATE OR REPLACE FUNCTION update_hero_carousel_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hero_carousel_items_update_timestamp ON public.hero_carousel_items;
CREATE TRIGGER hero_carousel_items_update_timestamp
BEFORE UPDATE ON public.hero_carousel_items
FOR EACH ROW
EXECUTE FUNCTION update_hero_carousel_items_updated_at();

ALTER TABLE public.hero_carousel_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated select hero carousel items" ON public.hero_carousel_items;
CREATE POLICY "Allow authenticated select hero carousel items"
  ON public.hero_carousel_items
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated insert hero carousel items" ON public.hero_carousel_items;
CREATE POLICY "Allow authenticated insert hero carousel items"
  ON public.hero_carousel_items
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated update hero carousel items" ON public.hero_carousel_items;
CREATE POLICY "Allow authenticated update hero carousel items"
  ON public.hero_carousel_items
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

GRANT ALL ON public.hero_carousel_items TO authenticated;
GRANT ALL ON public.hero_carousel_items TO service_role;
