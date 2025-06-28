/*
  # Update Age Constraint in Profiles Table
  
  This migration:
  1. Removes the upper limit (25 years) on the edad field in the profiles table
  2. Sets a new upper limit of 100 years
  3. Maintains the lower limit of 0 years
  
  ## Changes:
  - Drop existing edad check constraint
  - Add new constraint with range 0-100
  - Ensure backward compatibility with existing data
*/

-- Drop the existing age check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_edad_check;

-- Add a new constraint with range 0-100
ALTER TABLE profiles 
ADD CONSTRAINT profiles_edad_check 
CHECK (edad >= 0 AND edad <= 100);

-- Verification
DO $$
BEGIN
  -- Check if the constraint was updated successfully
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'profiles_edad_check'
  ) THEN
    RAISE NOTICE '✅ Age constraint successfully updated';
    RAISE NOTICE '✅ New constraint added: edad between 0 and 100';
    RAISE NOTICE '🎯 Users of all ages up to 100 can now register on the platform';
  ELSE
    RAISE NOTICE '❌ Failed to update age constraint';
  END IF;
END $$;