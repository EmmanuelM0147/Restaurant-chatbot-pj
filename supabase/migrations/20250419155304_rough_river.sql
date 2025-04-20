/*
  # Add order history tracking

  1. Changes
    - Add order history tracking table
    - Add trigger for tracking order status changes
    - Add RLS policies for order history

  2. Security
    - Enable RLS on order_history table
    - Add policies for order history access
*/

-- Create order_history table
CREATE TABLE IF NOT EXISTS order_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  status_change varchar(50) NOT NULL,
  previous_status varchar(50),
  changed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

-- Create policies for order history
CREATE POLICY "Users can read their own order history"
  ON order_history
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders 
      WHERE user_id = current_setting('request.jwt.claims')::json->>'sub'::text::uuid
    )
  );

-- Create function to track order status changes
CREATE OR REPLACE FUNCTION track_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_history (
      order_id,
      status_change,
      previous_status
    )
    VALUES (
      NEW.id,
      NEW.status,
      OLD.status
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status changes
CREATE TRIGGER order_status_change_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION track_order_status_change();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_history(order_id);