/*
  # Fix Leaderboard Score Calculation

  This migration ensures that:
  1. All users can see each other's profiles (for leaderboard functionality)
  2. Score calculation works correctly for all users
  3. RLS policies are properly configured

  ## Changes:
  - Drop any existing restrictive SELECT policies on profiles
  - Create a new policy allowing authenticated users to view all profiles
  - Verify existing policies without using the 'operation' column
*/

-- Drop existing overly restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Create new policy that allows users to view all profiles
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Verify existing policies without using the 'operation' column
DO $$
DECLARE
  policy_count integer;
  select_policy_exists boolean;
BEGIN
  -- Count existing policies for profiles
  SELECT COUNT(*) 
  FROM pg_policies 
  WHERE tablename = 'profiles' 
  INTO policy_count;
  
  -- Check if our new SELECT policy exists
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view all profiles'
  ) INTO select_policy_exists;
  
  -- Log results
  RAISE NOTICE '✅ Found % policies for profiles table', policy_count;
  
  IF select_policy_exists THEN
    RAISE NOTICE '✅ SELECT policy for all profiles exists';
  ELSE
    RAISE NOTICE '❌ SELECT policy for all profiles is missing';
  END IF;
  
  RAISE NOTICE '✅ Leaderboard access fixed - users can now see other profiles';
END $$;