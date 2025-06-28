/*
  # Fix Age Constraint in Profiles Table

  This migration fixes the age constraint in the profiles table to allow ages up to 100 years.
  Previous migrations have attempted to fix this issue, but the constraint is still limiting ages to 25 years.

  ## Changes:
  1. Drop ALL existing age constraints from the profiles table
  2. Add a new constraint that allows ages between 0 and 100 years
  3. Verify the change was successful
*/

-- Drop ALL possible variations of the age constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_edad_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_age_check;

-- Add a new constraint with range 0-100
ALTER TABLE profiles 
ADD CONSTRAINT profiles_edad_check 
CHECK (edad >= 0 AND edad <= 100);

-- Verification
DO $$
DECLARE
  constraint_def text;
BEGIN
  -- Get the actual constraint definition to verify it was updated correctly
  SELECT pg_get_constraintdef(oid)
  INTO constraint_def
  FROM pg_constraint
  WHERE conname = 'profiles_edad_check';
  
  IF constraint_def LIKE '%>= 0 AND%<= 100%' THEN
    RAISE NOTICE '✅ Age constraint successfully updated';
    RAISE NOTICE '✅ New constraint definition: %', constraint_def;
    RAISE NOTICE '🎯 Users of all ages up to 100 can now register on the platform';
  ELSE
    RAISE NOTICE '❌ Failed to update age constraint correctly';
    RAISE NOTICE '⚠️ Current constraint: %', constraint_def;
  END IF;
END $$;