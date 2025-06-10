-- =====================================================
-- FIX: Handle existing tables gracefully
-- =====================================================

-- Solo crear la tabla profiles si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
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
    RAISE NOTICE '✅ Tabla profiles creada';
  ELSE
    RAISE NOTICE '⚠️ Tabla profiles ya existe, verificando estructura...';
    
    -- Agregar columnas faltantes si no existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'nombre') THEN
      ALTER TABLE profiles ADD COLUMN nombre text DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'apellido') THEN
      ALTER TABLE profiles ADD COLUMN apellido text DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'grado') THEN
      ALTER TABLE profiles ADD COLUMN grado text DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'nombre_colegio') THEN
      ALTER TABLE profiles ADD COLUMN nombre_colegio text DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'ciudad') THEN
      ALTER TABLE profiles ADD COLUMN ciudad text DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pais') THEN
      ALTER TABLE profiles ADD COLUMN pais text DEFAULT 'Colombia';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'edad') THEN
      ALTER TABLE profiles ADD COLUMN edad integer CHECK (edad >= 5 AND edad <= 25);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'sexo') THEN
      ALTER TABLE profiles ADD COLUMN sexo text CHECK (sexo IN ('Masculino', 'Femenino', 'Otro', 'Prefiero no decir'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
      ALTER TABLE profiles ADD COLUMN avatar_url text DEFAULT '';
    END IF;
    
    RAISE NOTICE '✅ Estructura de profiles verificada y actualizada';
  END IF;
END $$;

-- Habilitar RLS en profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Crear políticas RLS para profiles
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
-- CREAR OTRAS TABLAS SI NO EXISTEN
-- =====================================================

-- Tabla timeline_notes
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'timeline_notes' AND table_schema = 'public') THEN
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
    
    ALTER TABLE timeline_notes ENABLE ROW LEVEL SECURITY;
    
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
    
    RAISE NOTICE '✅ Tabla timeline_notes creada';
  ELSE
    RAISE NOTICE '⚠️ Tabla timeline_notes ya existe';
  END IF;
END $$;

-- Tabla user_preferences
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences' AND table_schema = 'public') THEN
    CREATE TABLE user_preferences (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      preference_text text NOT NULL,
      category text NOT NULL CHECK (category IN ('likes', 'dislikes')),
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
    
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
    
    RAISE NOTICE '✅ Tabla user_preferences creada';
  ELSE
    RAISE NOTICE '⚠️ Tabla user_preferences ya existe';
  END IF;
END $$;

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at (solo crear si no existen)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'handle_profiles_updated_at') THEN
    CREATE TRIGGER handle_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION handle_updated_at();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'timeline_notes') AND 
     NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'handle_timeline_notes_updated_at') THEN
    CREATE TRIGGER handle_timeline_notes_updated_at
      BEFORE UPDATE ON timeline_notes
      FOR EACH ROW
      EXECUTE FUNCTION handle_updated_at();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences') AND 
     NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'handle_user_preferences_updated_at') THEN
    CREATE TRIGGER handle_user_preferences_updated_at
      BEFORE UPDATE ON user_preferences
      FOR EACH ROW
      EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;

-- =====================================================
-- CONFIGURAR STORAGE PARA AVATARS
-- =====================================================

-- Crear bucket para avatars si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Eliminar políticas existentes de storage
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

-- Crear políticas para storage de avatars
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
-- VERIFICACIÓN FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=== VERIFICACIÓN FINAL ===';
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE NOTICE '✅ Tabla profiles: OK';
  ELSE
    RAISE NOTICE '❌ Tabla profiles: FALTA';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'timeline_notes') THEN
    RAISE NOTICE '✅ Tabla timeline_notes: OK';
  ELSE
    RAISE NOTICE '❌ Tabla timeline_notes: FALTA';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
    RAISE NOTICE '✅ Tabla user_preferences: OK';
  ELSE
    RAISE NOTICE '❌ Tabla user_preferences: FALTA';
  END IF;
  
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    RAISE NOTICE '✅ Bucket avatars: OK';
  ELSE
    RAISE NOTICE '❌ Bucket avatars: FALTA';
  END IF;
  
  RAISE NOTICE '🎯 Configuración completada - La aplicación está lista para usar';
END $$;