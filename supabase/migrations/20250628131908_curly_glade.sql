/*
  # Remove age upper limit restriction
  
  This migration removes the upper age limit restriction from the profiles table
  and updates the constraint to only ensure age is non-negative.
  
  ## Changes:
  1. Drop the existing age check constraint
  2. Add a new constraint that only checks for non-negative age
  3. Verify the changes were applied successfully
*/

-- Drop the existing age check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_edad_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_age_check;

-- Add a new constraint that only checks for non-negative age
ALTER TABLE profiles 
ADD CONSTRAINT profiles_edad_check 
CHECK (edad >= 0);

-- Verification
DO $$
BEGIN
  -- Check if the constraint was updated successfully
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'profiles_edad_check'
  ) THEN
    RAISE NOTICE '✅ Age restriction successfully removed';
    RAISE NOTICE '✅ New constraint added: edad >= 0';
    RAISE NOTICE '🎯 Users of all ages can now register on the platform';
  ELSE
    RAISE NOTICE '❌ Failed to update age constraint';
  END IF;
END $$;