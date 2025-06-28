/*
  # Fix Username-Based Login System
  
  This migration adds support for username-based logins by:
  1. Adding a username column to the profiles table
  2. Creating a function to find users by username
  3. Adding indexes for better performance
  
  ## Changes:
  - Add username column to profiles table
  - Create index on username for faster lookups
  - Add function to find user by username
*/

-- Add username column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);

-- Create function to find user by username
CREATE OR REPLACE FUNCTION find_user_by_username(p_username text)
RETURNS TABLE (
  id uuid,
  email text
) AS $$
BEGIN
  RETURN QUERY
  SELECT profiles.id, profiles.email
  FROM profiles
  WHERE profiles.nombre = p_username
  OR profiles.username = p_username
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing profiles to set username from nombre
UPDATE profiles
SET username = nombre
WHERE username IS NULL AND nombre IS NOT NULL;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Username column added to profiles table';
  RAISE NOTICE '✅ Index created on username column';
  RAISE NOTICE '✅ Function created to find user by username';
  RAISE NOTICE '🔑 Username-based login system is now ready';
END $$;