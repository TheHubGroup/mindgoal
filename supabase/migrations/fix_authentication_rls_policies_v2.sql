/*
  # Fix Authentication Table RLS Policies - Handle Existing Policies

  1. Problem
    - Authentication table RLS policies are blocking registration
    - Policy "Allow public registration" already exists but may be misconfigured
    - Need to properly configure all policies for registration flow

  2. Solution
    - Drop ALL existing policies on authentication table
    - Recreate with proper permissions for registration
    - Ensure public can INSERT for registration
    - Maintain security for other operations

  3. Security
    - Allow public INSERT for registration (necessary for new users)
    - Restrict SELECT/UPDATE to authenticated users only
    - Service role gets full access for admin operations
*/

-- Drop ALL existing policies on authentication table
DROP POLICY IF EXISTS "Allow public registration" ON authentication;
DROP POLICY IF EXISTS "Users can read own authentication data" ON authentication;
DROP POLICY IF EXISTS "Users can update own authentication data" ON authentication;
DROP POLICY IF EXISTS "Service role full access" ON authentication;
DROP POLICY IF EXISTS "profiles_select_policy" ON authentication;
DROP POLICY IF EXISTS "profiles_insert_policy" ON authentication;
DROP POLICY IF EXISTS "profiles_update_policy" ON authentication;

-- Create new policies with proper permissions
CREATE POLICY "authentication_insert_policy" ON authentication
  FOR INSERT 
  TO public
  WITH CHECK (true);

CREATE POLICY "authentication_select_policy" ON authentication
  FOR SELECT 
  TO authenticated
  USING (auth.uid()::text = profile_id::text);

CREATE POLICY "authentication_update_policy" ON authentication
  FOR UPDATE 
  TO authenticated
  USING (auth.uid()::text = profile_id::text)
  WITH CHECK (auth.uid()::text = profile_id::text);

-- Service role policy for admin operations
CREATE POLICY "authentication_service_role_policy" ON authentication
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
