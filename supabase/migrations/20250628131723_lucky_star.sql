/*
  # Remove age restriction from profiles table
  
  1. Changes
    - Remove the age restriction that limits age to 25 years
    - Update the age check constraint to only ensure age is non-negative
    - Keep all other constraints and table structure intact
  
  2. Reason
    - Allow users of all ages to register on the platform
    - Remove unnecessary restriction on older users
    - Maintain data integrity by keeping the minimum age check
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