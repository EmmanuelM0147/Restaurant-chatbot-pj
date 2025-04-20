/*
  # Initial database schema for restaurant chatbot

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `created_at` (timestamptz)
    - `orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `total` (numeric)
      - `status` (character varying)
      - `scheduled_time` (timestamptz)
      - `special_instructions` (text)
      - `created_at` (timestamptz)
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `item_name` (character varying)
      - `quantity` (integer)
      - `price` (numeric)
      - `created_at` (timestamptz)
    - `payment_transactions`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `payment_provider` (character varying)
      - `transaction_id` (character varying)
      - `amount` (numeric)
      - `status` (character varying)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  status varchar(50) NOT NULL DEFAULT 'pending',
  scheduled_time timestamptz,
  special_instructions text,
  created_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  item_name varchar(255) NOT NULL,
  quantity integer NOT NULL,
  price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  payment_provider varchar(50) NOT NULL,
  transaction_id varchar(255),
  amount numeric(10,2) NOT NULL,
  status varchar(50) NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable row level security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can access their own data"
  ON users
  FOR ALL
  TO authenticated
  USING (id = auth.uid());

-- Create policies for orders table
CREATE POLICY "Users can access their own orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create policies for order_items table
CREATE POLICY "Users can access their own order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders 
      WHERE user_id = auth.uid()
    )
  );

-- Create policies for payment_transactions table
CREATE POLICY "Users can access their own payment transactions"
  ON payment_transactions
  FOR ALL
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders 
      WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);