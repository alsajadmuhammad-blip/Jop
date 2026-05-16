-- Inventory management schema for products and stock tracking
-- Run this in Supabase SQL editor.

-- 1) Add inventory fields to existing products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS sku VARCHAR(100),
ADD COLUMN IF NOT EXISTS "sku" VARCHAR(100),
ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "stock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS reorder_level INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "reorderLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS reorder_quantity INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "reorderQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_in_stock BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "isInStock" BOOLEAN NOT NULL DEFAULT FALSE;

-- 2) Add useful indexes for SKU and stock
CREATE INDEX IF NOT EXISTS products_store_id_sku_idx ON public.products USING btree (store_id, sku);
CREATE INDEX IF NOT EXISTS products_store_id_stock_idx ON public.products USING btree (store_id, stock);

-- 3) Create inventory transaction history table
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  "productId" UUID NOT NULL,
  store_id UUID NOT NULL,
  "storeId" UUID NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  change_qty INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reference_type VARCHAR(50) NULL,
  reference_id UUID NULL,
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products (id) ON DELETE CASCADE,
  CONSTRAINT inventory_transactions_productId_fkey FOREIGN KEY ("productId") REFERENCES public.products (id) ON DELETE CASCADE,
  CONSTRAINT inventory_transactions_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores (id) ON DELETE CASCADE,
  CONSTRAINT inventory_transactions_storeId_fkey FOREIGN KEY ("storeId") REFERENCES public.stores (id) ON DELETE CASCADE,
  CONSTRAINT inventory_transactions_transaction_type_check CHECK (transaction_type IN ('stock_in', 'stock_out', 'sale', 'adjustment', 'return', 'transfer'))
);

CREATE INDEX IF NOT EXISTS inventory_transactions_product_id_idx ON public.inventory_transactions USING btree (product_id);
CREATE INDEX IF NOT EXISTS inventory_transactions_store_id_idx ON public.inventory_transactions USING btree (store_id);
CREATE INDEX IF NOT EXISTS inventory_transactions_created_at_idx ON public.inventory_transactions USING btree (created_at DESC);

-- 4) Keep is_in_stock / isInStock in sync with stock.
CREATE OR REPLACE FUNCTION public.products_sync_stock_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_in_stock := NEW.stock > 0;
  NEW."isInStock" := NEW.is_in_stock;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_sync_stock_status ON public.products;
CREATE TRIGGER products_sync_stock_status
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.products_sync_stock_status();

-- 5) Provide a stock adjustment helper function for safe inventory updates
CREATE OR REPLACE FUNCTION public.adjust_product_stock(
  p_product_id UUID,
  p_store_id UUID,
  p_change INTEGER,
  p_transaction_type VARCHAR,
  p_reference_type VARCHAR DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  product_id UUID,
  previous_stock INTEGER,
  new_stock INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_previous_stock INTEGER;
  v_new_stock INTEGER;
  v_product_store UUID;
BEGIN
  SELECT stock, store_id INTO v_previous_stock, v_product_store
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
  END IF;

  IF v_product_store IS DISTINCT FROM p_store_id THEN
    RAISE EXCEPTION 'Product store mismatch: % != %', v_product_store, p_store_id;
  END IF;

  v_new_stock := v_previous_stock + p_change;
  IF v_new_stock < 0 THEN
    RAISE EXCEPTION 'Stock cannot be negative for product %', p_product_id;
  END IF;

  UPDATE public.products
  SET stock = v_new_stock,
      "stock" = v_new_stock,
      updated_at = now(),
      "updatedAt" = now()
  WHERE id = p_product_id;

  INSERT INTO public.inventory_transactions (
    product_id,
    "productId",
    store_id,
    "storeId",
    transaction_type,
    change_qty,
    previous_stock,
    new_stock,
    reference_type,
    reference_id,
    notes
  ) VALUES (
    p_product_id,
    p_product_id,
    p_store_id,
    p_store_id,
    p_transaction_type,
    p_change,
    v_previous_stock,
    v_new_stock,
    p_reference_type,
    p_reference_id,
    p_notes
  );

  RETURN QUERY SELECT p_product_id, v_previous_stock, v_new_stock;
END;
$$;
