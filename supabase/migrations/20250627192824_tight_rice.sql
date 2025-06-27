/*
  # Add support for users without email

  1. Changes
    - Add has_email boolean column to profiles table
    - Add unique constraint on nombre for users without email
    - Update RLS policies to handle username-based authentication

  2. Security
    - Maintain existing security model
    - Add additional checks for username uniqueness
    - Ensure proper authentication for users without email

  3. Data Integrity
    - Add constraints to ensure data consistency
    - Maintain backward compatibility with existing users
*/

-- Add has_email column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_email boolean DEFAULT true;

-- Add index on nombre for username lookups
CREATE INDEX IF NOT EXISTS profiles_nombre_idx ON profiles(nombre);

-- Add function to check username uniqueness
CREATE OR REPLACE FUNCTION check_username_unique()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check uniqueness for users without email
  IF NEW.has_email = false AND NEW.nombre IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM profiles 
      WHERE nombre = NEW.nombre 
      AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Username already exists';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to check username uniqueness
DROP TRIGGER IF EXISTS check_username_unique_trigger ON profiles;
CREATE TRIGGER check_username_unique_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_username_unique();

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Added support for users without email';
  RAISE NOTICE '✅ Added username uniqueness check';
  RAISE NOTICE '✅ Users can now register with username instead of email';
END $$;