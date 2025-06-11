/*
  # Complete Database Schema Fix
  
  This migration ensures all required tables and policies are properly configured
  for the application to work correctly.
  
  ## What this fixes:
  1. Ensures all required tables exist with correct structure
  2. Fixes RLS policies for proper security
  3. Sets up storage bucket for avatars
  4. Creates necessary functions and triggers
*/

-- =====================================================
-- STEP 1: ENSURE PROFILES TABLE EXISTS AND IS CORRECT
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  nombre text DEFAULT '',
  apellido text DEFAULT '',
  grado text DEFAULT '',
  nombre_colegio text DEFAULT '',
  ciudad text DEFAULT '',
  pais text DEFAULT 'Colombia',
  edad integer CHECK (edad >= 5 AND edad <= 25),
  sexo text CHECK (sexo IN ('Masculino', 'Femenino', 'Otro', 'Prefiero no decir')),
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- STEP 2: ENSURE USER_RESPONSES TABLE EXISTS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  response text NOT NULL,
  activity_type text NOT NULL DEFAULT 'cuentame_quien_eres',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_responses_user_id_idx ON user_responses(user_id);
CREATE INDEX IF NOT EXISTS user_responses_activity_type_idx ON user_responses(activity_type);

-- Enable RLS
ALTER TABLE user_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own responses" ON user_responses;
DROP POLICY IF EXISTS "Users can insert own responses" ON user_responses;
DROP POLICY IF EXISTS "Users can update own responses" ON user_responses;
DROP POLICY IF EXISTS "Users can delete own responses" ON user_responses;

-- Create RLS policies for user_responses
CREATE POLICY "Users can view own responses" ON user_responses
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own responses" ON user_responses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own responses" ON user_responses
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own responses" ON user_responses
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- STEP 3: ENSURE USER_PREFERENCES TABLE EXISTS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_text text NOT NULL,
  category text NOT NULL CHECK (category IN ('likes', 'dislikes')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON user_preferences;

-- Create RLS policies for user_preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON user_preferences
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- STEP 4: ENSURE TIMELINE_NOTES TABLE EXISTS
-- =====================================================

CREATE TABLE IF NOT EXISTS timeline_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  emoji text NOT NULL DEFAULT '📝',
  color text NOT NULL DEFAULT '#FFE4E1',
  shape text NOT NULL DEFAULT 'rounded-lg',
  font text NOT NULL DEFAULT 'Comic Neue',
  section text NOT NULL CHECK (section IN ('pasado', 'presente', 'futuro')),
  position_x numeric NOT NULL DEFAULT 50,
  position_y numeric NOT NULL DEFAULT 50,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE timeline_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own timeline notes" ON timeline_notes;
DROP POLICY IF EXISTS "Users can insert own timeline notes" ON timeline_notes;
DROP POLICY IF EXISTS "Users can update own timeline notes" ON timeline_notes;
DROP POLICY IF EXISTS "Users can delete own timeline notes" ON timeline_notes;

-- Create RLS policies for timeline_notes
CREATE POLICY "Users can view own timeline notes" ON timeline_notes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own timeline notes" ON timeline_notes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own timeline notes" ON timeline_notes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own timeline notes" ON timeline_notes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- STEP 5: SETUP STORAGE BUCKET FOR AVATARS
-- =====================================================

-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

-- Create storage policies with correct user ID extraction
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = split_part(name, '.', 1)
  );

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = split_part(name, '.', 1)
  );

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = split_part(name, '.', 1)
  );

CREATE POLICY "Public can view avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- =====================================================
-- STEP 6: CREATE UPDATED_AT FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS handle_user_responses_updated_at ON user_responses;
DROP TRIGGER IF EXISTS handle_user_preferences_updated_at ON user_preferences;
DROP TRIGGER IF EXISTS handle_timeline_notes_updated_at ON timeline_notes;

-- Create triggers for updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_user_responses_updated_at
  BEFORE UPDATE ON user_responses
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_timeline_notes_updated_at
  BEFORE UPDATE ON timeline_notes
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- =====================================================
-- STEP 7: VERIFICATION
-- =====================================================

DO $$
BEGIN
  -- Check if all tables exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE NOTICE '✅ Table profiles exists and is configured';
  ELSE
    RAISE NOTICE '❌ Table profiles is missing';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_responses') THEN
    RAISE NOTICE '✅ Table user_responses exists and is configured';
  ELSE
    RAISE NOTICE '❌ Table user_responses is missing';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
    RAISE NOTICE '✅ Table user_preferences exists and is configured';
  ELSE
    RAISE NOTICE '❌ Table user_preferences is missing';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'timeline_notes') THEN
    RAISE NOTICE '✅ Table timeline_notes exists and is configured';
  ELSE
    RAISE NOTICE '❌ Table timeline_notes is missing';
  END IF;

  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    RAISE NOTICE '✅ Storage bucket avatars exists and is configured';
  ELSE
    RAISE NOTICE '❌ Storage bucket avatars is missing';
  END IF;

  RAISE NOTICE '🎯 Database schema fix completed successfully';
  RAISE NOTICE '📱 Application should now work correctly';
END $$;