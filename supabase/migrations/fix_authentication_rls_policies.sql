/*
  # Fix Authentication Table RLS Policies

  1. Problem
    - Authentication table has RLS enabled but policies are too restrictive
    - Registration process cannot INSERT new authentication records
    - Current policy only allows SELECT/UPDATE for authenticated users

  2. Solution
    - Add policy to allow public INSERT for registration
    - Modify existing policies to be more permissive for registration flow
    - Ensure authentication table allows new user creation

  3. Security
    - Allow public INSERT for registration (necessary for new users)
    - Maintain SELECT/UPDATE restrictions for authenticated users only
    - Keep data integrity with proper constraints
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can read own authentication data" ON authentication;
DROP POLICY IF EXISTS "Users can update own authentication data" ON authentication;

-- Create new policies that allow registration
CREATE POLICY "Allow public registration" ON authentication
  FOR INSERT 
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can read own authentication data" ON authentication
  FOR SELECT 
  TO authenticated
  USING (auth.uid()::text = profile_id::text OR auth.role() = 'service_role');

CREATE POLICY "Users can update own authentication data" ON authentication
  FOR UPDATE 
  TO authenticated
  USING (auth.uid()::text = profile_id::text)
  WITH CHECK (auth.uid()::text = profile_id::text);

-- Allow service role full access for admin operations
CREATE POLICY "Service role full access" ON authentication
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
