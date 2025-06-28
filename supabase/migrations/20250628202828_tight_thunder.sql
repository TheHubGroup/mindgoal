/*
  # Update Age Constraint to Allow Ages up to 100 Years
  
  This migration fixes the age constraint issue by:
  1. Removing the existing constraint that limits age to 25 years
  2. Adding a new constraint that allows ages between 0 and 100 years
  3. Verifying the change was successful
  
  ## Changes:
  - Drop the existing age check constraint
  - Add a new constraint with range 0-100
  - Verify the constraint was updated successfully
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