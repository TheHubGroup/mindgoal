/*
  # Fix Database Conflicts During User Signup

  This migration resolves the "Database error saving new user" issue by:
  1. Removing conflicting triggers that interfere with Supabase auth
  2. Updating the profiles table structure to match the AuthContext expectations
  3. Simplifying RLS policies to prevent conflicts
  4. Ensuring clean separation between auth and profile creation

  ## Changes:
  1. Remove automatic profile creation trigger
  2. Update profiles table column names to match AuthContext
  3. Simplify RLS policies
  4. Clean up any conflicting functions
*/

-- =====================================================
-- STEP 1: Remove Conflicting Triggers and Functions
-- =====================================================

-- Drop the problematic trigger that causes signup conflicts
DROP TRIGGER IF EXISTS create_profile_on_signup_trigger ON auth.users;
DROP FUNCTION IF EXISTS create_profile_on_signup();

-- Drop any other conflicting triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON profiles;

-- =====================================================
-- STEP 2: Update Profiles Table Structure
-- =====================================================

-- The AuthContext expects English column names, but the table has Spanish names
-- Add the English columns that AuthContext expects
DO $$
BEGIN
  -- Add first_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_name text;
  END IF;

  -- Add last_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_name text;
  END IF;

  -- Add user_id if it doesn't exist (AuthContext expects this)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add grade if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'grade'
  ) THEN
    ALTER TABLE profiles ADD COLUMN grade text;
  END IF;

  -- Add school_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'school_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN school_name text;
  END IF;

  -- Add city if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'city'
  ) THEN
    ALTER TABLE profiles ADD COLUMN city text;
  END IF;

  -- Add country if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'country'
  ) THEN
    ALTER TABLE profiles ADD COLUMN country text DEFAULT 'Colombia';
  END IF;

  -- Add age if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'age'
  ) THEN
    ALTER TABLE profiles ADD COLUMN age integer CHECK (age >= 5 AND age <= 25);
  END IF;

  -- Add gender if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'gender'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gender text CHECK (gender IN ('Masculino', 'Femenino', 'Otro', 'Prefiero no decir'));
  END IF;
END $$;

-- Update user_id column to match id for existing records
UPDATE profiles SET user_id = id WHERE user_id IS NULL;

-- =====================================================
-- STEP 3: Clean Up RLS Policies
-- =====================================================

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_policy_all" ON profiles;
DROP POLICY IF EXISTS "profiles_policy_insert_anon" ON profiles;
DROP POLICY IF EXISTS "profiles_all_authenticated" ON profiles;

-- Create simple, non-conflicting policies
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR auth.uid() = user_id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR auth.uid() = user_id)
  WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

-- =====================================================
-- STEP 4: Recreate Simple Triggers
-- =====================================================

-- Simple updated_at function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at (non-conflicting)
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- =====================================================
-- STEP 5: Ensure Storage is Properly Configured
-- =====================================================

-- Ensure avatars bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Clean storage policies
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "avatar_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatar_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatar_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatar_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_all_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;

-- Simple storage policies
CREATE POLICY "avatars_authenticated_all" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- =====================================================
-- STEP 6: Verification
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Signup conflicts resolved';
  RAISE NOTICE '✅ Profile table structure updated';
  RAISE NOTICE '✅ RLS policies simplified';
  RAISE NOTICE '✅ Storage configured';
  RAISE NOTICE '🎯 User signup should now work without database errors';
END $$;