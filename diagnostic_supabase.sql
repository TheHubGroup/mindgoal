-- =====================================================
-- DIAGNÓSTICO ESPECÍFICO - PROBLEMA LOGIN vs REGISTRO
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. VERIFICAR POLÍTICAS RLS ACTUALES
SELECT 
  policyname,
  cmd as operacion,
  qual as condicion_using,
  with_check as condicion_with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd;

-- 2. VERIFICAR TRIGGERS ACTIVOS
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

-- 3. VERIFICAR CONSTRAINTS
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'profiles';

-- 4. VERIFICAR ESTRUCTURA DE TABLA
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 5. CONTAR REGISTROS EXISTENTES
SELECT COUNT(*) as usuarios_existentes FROM profiles;

-- 6. TEST DE INSERT DIRECTO (SIN AUTH)
DO $$
DECLARE
  test_id uuid := gen_random_uuid();
  insert_success boolean := false;
BEGIN
  -- Intentar INSERT directo
  BEGIN
    INSERT INTO profiles (id, email, nombre, apellido) 
    VALUES (test_id, 'test-diagnostic@test.com', 'Test', 'Diagnostic');
    insert_success := true;
    RAISE NOTICE '✅ INSERT DIRECTO: EXITOSO';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ INSERT DIRECTO FALLÓ: %', SQLERRM;
  END;
  
  -- Limpiar si fue exitoso
  IF insert_success THEN
    DELETE FROM profiles WHERE id = test_id;
    RAISE NOTICE '🧹 Registro de prueba eliminado';
  END IF;
END $$;

-- 7. VERIFICAR PERMISOS DE USUARIO ACTUAL
SELECT 
  current_user as usuario_actual,
  session_user as usuario_sesion;

-- 8. VERIFICAR AUTH USERS (para ver si el problema es en auth o profiles)
SELECT COUNT(*) as total_auth_users FROM auth.users;

-- =====================================================
-- EJECUTA ESTO PRIMERO PARA VER QUÉ ESTÁ PASANDO
-- =====================================================
