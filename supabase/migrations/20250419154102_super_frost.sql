/*
  # Create orders schema

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `device_id` (text)
      - `items` (jsonb)
      - `status` (text)
      - `created_at` (timestamptz)
    - `order_history`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `items` (jsonb)
      - `status` (text)
      - `completed_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for device_id-based access
*/

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  items jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Create order_history table
CREATE TABLE IF NOT EXISTS order_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  items jsonb NOT NULL,
  status text NOT NULL,
  completed_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own orders"
  ON orders
  FOR SELECT
  USING (device_id = current_user);

CREATE POLICY "Users can insert their own orders"
  ON orders
  FOR INSERT
  WITH CHECK (device_id = current_user);

CREATE POLICY "Users can update their own orders"
  ON orders
  FOR UPDATE
  USING (device_id = current_user);

CREATE POLICY "Users can read their own order history"
  ON order_history
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE device_id = current_user
    )
  );

-- Create function to copy completed orders to history
CREATE OR REPLACE FUNCTION copy_completed_order_to_history()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO order_history (order_id, items, status)
    VALUES (NEW.id, NEW.items, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for completed orders
CREATE TRIGGER order_completed_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION copy_completed_order_to_history();