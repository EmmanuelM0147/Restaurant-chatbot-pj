/*
  # Initial schema for food ordering chatbot

  1. New Tables
    - menu_items: Available products
    - orders: Pending orders
    - order_history: Completed orders

  2. Security
    - Enable RLS on all tables
    - Add policies for device-based access
*/

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id serial PRIMARY KEY,
  name text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  description text,
  created_at timestamptz DEFAULT now()
);

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
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Menu items are readable by all"
  ON menu_items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Orders are readable by device"
  ON orders
  FOR SELECT
  USING (device_id = current_setting('app.device_id', true));

CREATE POLICY "Orders are insertable by device"
  ON orders
  FOR INSERT
  WITH CHECK (device_id = current_setting('app.device_id', true));

CREATE POLICY "Orders are updatable by device"
  ON orders
  FOR UPDATE
  USING (device_id = current_setting('app.device_id', true));

CREATE POLICY "Order history is readable by device"
  ON order_history
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE device_id = current_setting('app.device_id', true)
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

-- Insert initial menu items
INSERT INTO menu_items (name, price, description) VALUES
  ('Burger', 5.99, 'Classic beef burger'),
  ('Pizza', 8.99, 'Margherita pizza'),
  ('Salad', 4.99, 'Fresh garden salad'),
  ('Fries', 2.99, 'Crispy french fries'),
  ('Drink', 1.99, 'Soft drink of your choice');