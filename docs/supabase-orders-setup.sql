-- Supabase SQL Setup for Orders System
-- Run these commands in your Supabase SQL editor

-- 1. Create orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  store_name VARCHAR(255) NOT NULL,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  items JSONB NOT NULL, -- Array of {productId, productName, quantity, unitPrice, totalPrice}
  total_amount DECIMAL(12, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, accepted, preparing, ready_for_pickup, delivering, delivered, cancelled
  notes TEXT,
  payment_method VARCHAR(50) DEFAULT 'whatsapp', -- whatsapp, cash, transfer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create indexes for faster queries
CREATE INDEX orders_store_id_idx ON orders(store_id);
CREATE INDEX orders_customer_id_idx ON orders(customer_id);
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_created_at_idx ON orders(created_at DESC);

-- 3. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_update_timestamp
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_orders_updated_at();

-- 4. Enable RLS (Row Level Security)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Allow customers to view their own orders
CREATE POLICY "Customers can view their own orders"
  ON orders
  FOR SELECT
  USING (
    auth.uid() = customer_id OR
    auth.uid() IN (SELECT owner_id FROM stores WHERE id = store_id)
  );

-- Allow customers to insert their own orders
CREATE POLICY "Customers can create orders"
  ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Allow store owners to update their own store's orders
CREATE POLICY "Store owners can update their store orders"
  ON orders
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT owner_id FROM stores WHERE id = store_id)
  )
  WITH CHECK (
    auth.uid() IN (SELECT owner_id FROM stores WHERE id = store_id)
  );

-- Allow reading orders for store owners
CREATE POLICY "Store owners can read their store orders"
  ON orders
  FOR SELECT
  USING (
    auth.uid() IN (SELECT owner_id FROM stores WHERE id = store_id)
  );
