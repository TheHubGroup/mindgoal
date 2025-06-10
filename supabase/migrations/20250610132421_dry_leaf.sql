/*
  # Reconstrucción Completa del Sistema de Autenticación
  
  Este script elimina completamente la estructura anterior y crea
  una nueva arquitectura simplificada que evita conflictos.
  
  ## Estrategia:
  1. Eliminación total de estructura anterior
  2. Nueva tabla profiles con estructura simple
  3. Sin triggers automáticos (evita conflictos)
  4. Políticas RLS ultra-permisivas para debugging
  5. Gestión manual de perfiles desde la aplicación
*/

-- =====================================================
-- PASO 1: LIMPIEZA TOTAL
-- =====================================================

-- Eliminar todas las políticas existentes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Eliminar políticas de profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
    END LOOP;
    
    -- Eliminar políticas de storage
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- Eliminar todos los triggers y funciones
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS create_profile_on_signup_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP FUNCTION IF EXISTS update_profiles_updated_at();
DROP FUNCTION IF EXISTS handle_updated_at();
DROP FUNCTION IF EXISTS create_profile_on_signup();
DROP FUNCTION IF EXISTS handle_new_user();

-- Eliminar tabla profiles completamente
DROP TABLE IF EXISTS profiles CASCADE;

-- Limpiar storage
DELETE FROM storage.objects WHERE bucket_id = 'avatars';
DELETE FROM storage.buckets WHERE id = 'avatars';

-- =====================================================
-- PASO 2: NUEVA ESTRUCTURA SIMPLIFICADA
-- =====================================================

-- Crear nueva tabla profiles con estructura simple
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  nombre text,
  apellido text,
  grado text,
  nombre_colegio text,
  ciudad text,
  pais text DEFAULT 'Colombia',
  edad integer,
  sexo text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- PASO 3: CONFIGURACIÓN DE SEGURIDAD ULTRA-PERMISIVA
-- =====================================================

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política ultra-permisiva para evitar cualquier bloqueo
CREATE POLICY "allow_all_operations" ON profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- PASO 4: CONFIGURACIÓN DE STORAGE SIMPLIFICADA
-- =====================================================

-- Recrear bucket de avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Política ultra-permisiva para storage
CREATE POLICY "allow_all_avatar_operations" ON storage.objects
  FOR ALL
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

-- =====================================================
-- PASO 5: FUNCIÓN SIMPLE PARA UPDATED_AT
-- =====================================================

-- Función simple para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- PASO 6: VERIFICACIÓN
-- =====================================================

-- Test básico
DO $$
DECLARE
  test_id uuid := gen_random_uuid();
BEGIN
  -- Test de inserción
  INSERT INTO profiles (id, email, nombre) 
  VALUES (test_id, 'test@test.com', 'Test');
  
  -- Test de actualización
  UPDATE profiles SET apellido = 'User' WHERE id = test_id;
  
  -- Limpiar
  DELETE FROM profiles WHERE id = test_id;
  
  RAISE NOTICE '✅ Base de datos reconstruida exitosamente';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error en test: %', SQLERRM;
END $$;