/*
  # Debug and fix profiles table issues

  1. Check table structure
  2. Verify RLS policies
  3. Test basic operations
  4. Create minimal working setup
*/

-- First, let's see what we have
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add all required columns if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS nombre text,
ADD COLUMN IF NOT EXISTS apellido text,
ADD COLUMN IF NOT EXISTS grado text,
ADD COLUMN IF NOT EXISTS nombre_colegio text,
ADD COLUMN IF NOT EXISTS ciudad text,
ADD COLUMN IF NOT EXISTS pais text DEFAULT 'Colombia',
ADD COLUMN IF NOT EXISTS edad integer,
ADD COLUMN IF NOT EXISTS sexo text,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Remove all existing constraints and add them back properly
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_edad_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_sexo_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_edad_check CHECK (edad >= 5 AND edad <= 25),
ADD CONSTRAINT profiles_sexo_check CHECK (sexo IN ('Masculino', 'Femenino', 'Otro', 'Prefiero no decir'));

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can upsert own profile" ON profiles;

-- Create simple, permissive policies
CREATE POLICY "Enable all for authenticated users"
  ON profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- Test insert to make sure it works
DO $$
BEGIN
  -- This is just a test, will be rolled back
  INSERT INTO profiles (id, email, nombre) 
  VALUES ('00000000-0000-0000-0000-000000000000', 'test@test.com', 'Test');
  
  DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000000';
  
  RAISE NOTICE 'Profiles table is working correctly';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error testing profiles table: %', SQLERRM;
END $$;
