/*
  # Add scheduled delivery time to orders

  1. Changes
    - Add scheduled_for column to orders table
    - Add validation for scheduled_for time range
    - Update RLS policies

  2. Security
    - Maintain existing RLS policies
    - Add check constraint for business hours
*/

-- Add scheduled_for column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;

-- Add check constraint for business hours (9 AM - 9 PM)
ALTER TABLE orders ADD CONSTRAINT orders_scheduled_for_hours_check
  CHECK (
    EXTRACT(HOUR FROM scheduled_for AT TIME ZONE 'UTC') BETWEEN 9 AND 21
  );

-- Create index for scheduled deliveries
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_for ON orders(scheduled_for);

-- Update existing policies to include scheduled_for
CREATE OR REPLACE POLICY "Users can update their own orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());