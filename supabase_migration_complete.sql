-- =====================================================
-- MIGRACIÓN COMPLETA PARA SUPABASE - PROFILES TABLE
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. VERIFICAR ESTRUCTURA ACTUAL
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. CREAR TABLA PROFILES SI NO EXISTE
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. AGREGAR TODAS LAS COLUMNAS NECESARIAS
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

-- 4. LIMPIAR CONSTRAINTS EXISTENTES
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_edad_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_sexo_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_key;

-- 5. AGREGAR CONSTRAINTS NECESARIOS
ALTER TABLE profiles 
ADD CONSTRAINT profiles_edad_check CHECK (edad >= 5 AND edad <= 25),
ADD CONSTRAINT profiles_sexo_check CHECK (sexo IN ('Masculino', 'Femenino', 'Otro', 'Prefiero no decir'));

-- 6. HABILITAR ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 7. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can upsert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON profiles;

-- 8. CREAR POLÍTICA ULTRA PERMISIVA PARA DEBUGGING
CREATE POLICY "Enable all operations for authenticated users"
  ON profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 9. CREAR/ACTUALIZAR FUNCIÓN DE UPDATED_AT
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. CREAR TRIGGER PARA UPDATED_AT
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- 11. LIMPIAR TRIGGERS AUTOMÁTICOS QUE PUEDEN CAUSAR CONFLICTOS
DROP TRIGGER IF EXISTS create_profile_on_signup_trigger ON auth.users;
DROP FUNCTION IF EXISTS create_profile_on_signup();

-- 12. CONFIGURAR STORAGE PARA AVATARS
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 13. POLÍTICAS DE STORAGE PARA AVATARS
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

CREATE POLICY "Users can upload own avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view avatars"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete own avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 14. TEST DE FUNCIONAMIENTO
DO $$
DECLARE
  test_id uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Intentar insertar un registro de prueba
  INSERT INTO profiles (id, email, nombre, apellido, grado, nombre_colegio, ciudad, pais, edad, sexo) 
  VALUES (
    test_id, 
    'test@test.com', 
    'Test', 
    'User', 
    '5°', 
    'Test School', 
    'Test City', 
    'Colombia', 
    15, 
    'Masculino'
  );
  
  -- Verificar que se insertó
  IF EXISTS (SELECT 1 FROM profiles WHERE id = test_id) THEN
    RAISE NOTICE '✅ TEST EXITOSO: Profiles table funcionando correctamente';
  ELSE
    RAISE NOTICE '❌ TEST FALLIDO: No se pudo insertar en profiles';
  END IF;
  
  -- Limpiar el registro de prueba
  DELETE FROM profiles WHERE id = test_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ ERROR EN TEST: %', SQLERRM;
    -- Intentar limpiar en caso de error
    DELETE FROM profiles WHERE id = test_id;
END $$;

-- 15. VERIFICACIÓN FINAL
SELECT 
  'profiles' as table_name,
  COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Mostrar todas las columnas creadas
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- =====================================================
-- INSTRUCCIONES DE EJECUCIÓN:
-- 1. Copia todo este código
-- 2. Ve a Supabase Dashboard > SQL Editor
-- 3. Pega el código completo
-- 4. Haz clic en "Run"
-- 5. Verifica que aparezca "✅ TEST EXITOSO" en los resultados
-- =====================================================
