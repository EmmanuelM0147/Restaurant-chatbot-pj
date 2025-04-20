/*
  # Create sessions table and management system

  1. New Tables
    - `sessions`
      - `id` (uuid, primary key)
      - `device_id` (text, unique)
      - `user_id` (uuid, nullable, references auth.users)
      - `created_at` (timestamptz)
      - `last_active` (timestamptz)
      - `metadata` (jsonb)

  2. Security
    - Enable RLS on sessions table
    - Add policies for device-based access
*/

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Sessions are readable by their device"
  ON sessions
  FOR SELECT
  USING (device_id = current_setting('app.device_id', TRUE));

CREATE POLICY "Sessions are insertable by their device"
  ON sessions
  FOR INSERT
  WITH CHECK (device_id = current_setting('app.device_id', TRUE));

CREATE POLICY "Sessions are updatable by their device"
  ON sessions
  FOR UPDATE
  USING (device_id = current_setting('app.device_id', TRUE));

-- Create function to update last_active
CREATE OR REPLACE FUNCTION update_session_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for last_active updates
CREATE TRIGGER session_last_active_trigger
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_last_active();