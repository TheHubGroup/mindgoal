/*
  # Configuración inicial para nuevo proyecto Supabase
  
  Este script configura las tablas necesarias para la aplicación educativa
  desde cero en un proyecto nuevo de Supabase.
  
  ## Tablas que se crearán:
  1. profiles - Información de usuarios
  2. timeline_notes - Notas de línea de tiempo
  3. user_preferences - Preferencias de usuarios
  
  ## Configuración:
  - Políticas RLS para seguridad
  - Storage para avatars
  - Triggers para timestamps
*/

-- =====================================================
-- PASO 1: CREAR TABLA PROFILES
-- =====================================================

CREATE TABLE profiles (
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

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
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
-- PASO 2: CREAR TABLA TIMELINE_NOTES
-- =====================================================

CREATE TABLE timeline_notes (
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

-- Habilitar RLS
ALTER TABLE timeline_notes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para timeline_notes
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
-- PASO 3: CREAR TABLA USER_PREFERENCES
-- =====================================================

CREATE TABLE user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_text text NOT NULL,
  category text NOT NULL CHECK (category IN ('likes', 'dislikes')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_preferences
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
-- PASO 4: FUNCIONES PARA UPDATED_AT
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_timeline_notes_updated_at
  BEFORE UPDATE ON timeline_notes
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- =====================================================
-- PASO 5: CONFIGURAR STORAGE PARA AVATARS
-- =====================================================

-- Crear bucket para avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Políticas para storage de avatars
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================
-- PASO 6: VERIFICACIÓN FINAL
-- =====================================================

-- Test de funcionamiento
DO $$
DECLARE
  test_id uuid := gen_random_uuid();
BEGIN
  -- Verificar que las tablas se crearon correctamente
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE NOTICE '✅ Tabla profiles creada correctamente';
  ELSE
    RAISE NOTICE '❌ Error: Tabla profiles no se creó';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'timeline_notes') THEN
    RAISE NOTICE '✅ Tabla timeline_notes creada correctamente';
  ELSE
    RAISE NOTICE '❌ Error: Tabla timeline_notes no se creó';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
    RAISE NOTICE '✅ Tabla user_preferences creada correctamente';
  ELSE
    RAISE NOTICE '❌ Error: Tabla user_preferences no se creó';
  END IF;

  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    RAISE NOTICE '✅ Bucket avatars creado correctamente';
  ELSE
    RAISE NOTICE '❌ Error: Bucket avatars no se creó';
  END IF;

  RAISE NOTICE '🎯 Configuración de base de datos completada';
  RAISE NOTICE '📱 La aplicación ya puede registrar usuarios';
END $$;