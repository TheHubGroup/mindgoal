/*
  # Create authentication table for login credentials

  1. New Tables
    - `authentication`
      - `id` (uuid, primary key)
      - `email` (text, unique, not null)
      - `password_hash` (text, not null)
      - `profile_id` (uuid, foreign key to profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `last_login` (timestamp, nullable)
      - `is_active` (boolean, default true)

  2. Security
    - Enable RLS on `authentication` table
    - Add policy for authenticated users to read their own authentication data
    - Add indexes for performance on email and profile_id

  3. Relationships
    - Foreign key constraint linking authentication.profile_id to profiles.id
    - Unique constraint on email to prevent duplicate accounts
*/

CREATE TABLE IF NOT EXISTS authentication (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz,
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE authentication ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own authentication data"
  ON authentication
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = profile_id::text);

CREATE POLICY "Users can update own authentication data"
  ON authentication
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = profile_id::text);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_authentication_email ON authentication(email);
CREATE INDEX IF NOT EXISTS idx_authentication_profile_id ON authentication(profile_id);
CREATE INDEX IF NOT EXISTS idx_authentication_active ON authentication(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_authentication_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_authentication_updated_at ON authentication;
CREATE TRIGGER trigger_authentication_updated_at
  BEFORE UPDATE ON authentication
  FOR EACH ROW
  EXECUTE FUNCTION update_authentication_updated_at();
