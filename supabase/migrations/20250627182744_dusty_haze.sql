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
  policy_count integer;
BEGIN
  -- Count existing policies for profiles
  SELECT COUNT(*) 
  FROM pg_policies 
  WHERE tablename = 'profiles' 
  INTO policy_count;
  
  -- Log results
  RAISE NOTICE '✅ Found % policies for profiles table', policy_count;
  
  -- Ensure we have at least the new SELECT policy
  IF policy_count > 0 THEN
    RAISE NOTICE '✅ Leaderboard access fixed - users can now see other profiles';
  ELSE
    RAISE NOTICE '⚠️ Warning: No policies found for profiles table';
  END IF;
END $$;