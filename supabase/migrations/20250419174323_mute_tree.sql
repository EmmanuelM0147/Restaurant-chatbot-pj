/*
  # Initial schema for restaurant chatbot

  1. New Tables
    - orders: Stores current orders
    - order_history: Stores completed orders
  
  2. Security
    - Enable RLS
    - Add device-based policies
*/

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  items jsonb NOT NULL,
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  status text NOT NULL DEFAULT 'pending',
  payment_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Create order_history table
CREATE TABLE IF NOT EXISTS order_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  items jsonb NOT NULL,
  total numeric(10,2) NOT NULL,
  payment_status text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
CREATE POLICY "Users can read their own orders"
  ON orders
  FOR SELECT
  USING (device_id = current_setting('app.device_id', true));

CREATE POLICY "Users can insert their own orders"
  ON orders
  FOR INSERT
  WITH CHECK (device_id = current_setting('app.device_id', true));

CREATE POLICY "Users can update their own orders"
  ON orders
  FOR UPDATE
  USING (device_id = current_setting('app.device_id', true));

-- Create policies for order_history
CREATE POLICY "Users can read their own order history"
  ON order_history
  FOR SELECT
  USING (device_id = current_setting('app.device_id', true));

-- Create indexes
CREATE INDEX idx_orders_device_id ON orders(device_id);
CREATE INDEX idx_order_history_device_id ON order_history(device_id);