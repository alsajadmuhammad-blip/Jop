-- Supabase SQL Setup for Stores Table
-- Run these commands in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  reviews INT DEFAULT 0,
  location TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  type VARCHAR(50) DEFAULT 'إلكتروني',
  market_type VARCHAR(100),
  business_hours JSONB,
  whatsapp_number VARCHAR(50),
  has_delivery BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false,
  product_limit INT DEFAULT 50,
  subscription_duration INT DEFAULT 30,
  activation_date TIMESTAMP WITH TIME ZONE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_email VARCHAR(255),
  password TEXT,
  payment_proof_url TEXT,
  package_name VARCHAR(50),
  registered_by_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stores_market_type_idx ON public.stores(market_type);
CREATE INDEX IF NOT EXISTS stores_owner_id_idx ON public.stores(owner_id);
CREATE INDEX IF NOT EXISTS stores_registered_by_agent_id_idx ON public.stores(registered_by_agent_id);
CREATE INDEX IF NOT EXISTS stores_is_active_idx ON public.stores(is_active);

CREATE OR REPLACE FUNCTION update_stores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS stores_update_timestamp ON public.stores;
CREATE TRIGGER stores_update_timestamp
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION update_stores_updated_at();

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated select stores" ON public.stores;
CREATE POLICY "Allow authenticated select stores"
  ON public.stores
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated insert stores" ON public.stores;
CREATE POLICY "Allow authenticated insert stores"
  ON public.stores
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated update stores" ON public.stores;
CREATE POLICY "Allow authenticated update stores"
  ON public.stores
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

GRANT ALL ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;
