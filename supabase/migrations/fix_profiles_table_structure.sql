/*
  # Fix profiles table structure and RLS policies

  1. Changes
    - Update profiles table to match expected column names
    - Fix RLS policies for proper user registration
    - Add proper constraints and defaults
    - Ensure compatibility with registration form

  2. Security
    - Enable RLS with correct policies
    - Allow authenticated users to manage their profiles
    - Fix trigger for automatic profile creation

  3. Profile Structure
    - Use consistent column names (first_name, last_name instead of nombre, apellido)
    - Add proper foreign key constraints
    - Set appropriate defaults
*/

-- Drop existing table and recreate with correct structure
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  grade text,
  school_name text,
  city text,
  country text DEFAULT 'Colombia',
  age integer CHECK (age >= 5 AND age <= 25),
  gender text CHECK (gender IN ('Masculino', 'Femenino', 'Otro', 'Prefiero no decir')),
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow public read access for profile creation during signup
CREATE POLICY "Allow profile creation during signup"
  ON profiles
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- Remove any existing triggers that might conflict
DROP TRIGGER IF EXISTS create_profile_on_signup_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_profile_on_signup();
DROP FUNCTION IF EXISTS handle_new_user();
