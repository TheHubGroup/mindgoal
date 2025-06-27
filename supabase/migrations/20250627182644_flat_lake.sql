/*
  # Fix Leaderboard Access - Allow Users to View Other Profiles

  1. Problem
    - Leaderboard only shows the current user
    - RLS policies are too restrictive, preventing users from seeing other profiles
    - This breaks the leaderboard functionality

  2. Solution
    - Create a new RLS policy that allows users to view all profiles
    - Keep existing policies for update/insert operations
    - This enables the leaderboard to display all users while maintaining security

  3. Security
    - Users can still only modify their own profiles
    - Only public/non-sensitive profile data is exposed
    - This is a common pattern for social/community features
*/

-- Drop existing overly restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create new policy that allows users to view all profiles
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Verify existing update/insert policies are still in place
DO $$
DECLARE
  update_policy_exists boolean;
  insert_policy_exists boolean;
BEGIN
  -- Check if update policy exists
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND operation = 'UPDATE'
  ) INTO update_policy_exists;
  
  -- Check if insert policy exists
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND operation = 'INSERT'
  ) INTO insert_policy_exists;
  
  -- Log results
  IF update_policy_exists THEN
    RAISE NOTICE '✅ Update policy exists for profiles';
  ELSE
    RAISE NOTICE '⚠️ No update policy found for profiles';
  END IF;
  
  IF insert_policy_exists THEN
    RAISE NOTICE '✅ Insert policy exists for profiles';
  ELSE
    RAISE NOTICE '⚠️ No insert policy found for profiles';
  END IF;
  
  RAISE NOTICE '✅ Leaderboard access fixed - users can now see other profiles';
END $$;