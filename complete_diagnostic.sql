-- =====================================================
-- DIAGNÓSTICO COMPLETO - ANÁLISIS DETALLADO
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. VERIFICAR POLÍTICAS RLS ESPECÍFICAS
SELECT 
  '=== POLÍTICAS RLS ===' as seccion;

SELECT 
  policyname as "Nombre Política",
  cmd as "Operación",
  CASE 
    WHEN qual IS NULL THEN 'Sin restricción'
    ELSE qual 
  END as "Condición USING",
  CASE 
    WHEN with_check IS NULL THEN 'Sin restricción'
    ELSE with_check 
  END as "Condición WITH CHECK"
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd;

-- 2. VERIFICAR SI RLS ESTÁ HABILITADO
SELECT 
  '=== ESTADO RLS ===' as seccion;

SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Habilitado"
FROM pg_tables 
WHERE tablename = 'profiles';

-- 3. VERIFICAR TRIGGERS
SELECT 
  '=== TRIGGERS ===' as seccion;

SELECT 
  trigger_name as "Nombre Trigger",
  event_manipulation as "Evento",
  action_timing as "Momento",
  action_statement as "Acción"
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

-- 4. VERIFICAR CONSTRAINTS
SELECT 
  '=== CONSTRAINTS ===' as seccion;

SELECT 
  constraint_name as "Nombre Constraint",
  constraint_type as "Tipo"
FROM information_schema.table_constraints 
WHERE table_name = 'profiles';

-- 5. TEST DE INSERT CON USUARIO ESPECÍFICO
SELECT 
  '=== TEST INSERT ===' as seccion;

DO $$
DECLARE
  test_id uuid := '12345678-1234-1234-1234-123456789012';
  error_msg text;
BEGIN
  -- Test 1: INSERT básico
  BEGIN
    INSERT INTO profiles (id, email) 
    VALUES (test_id, 'test-insert@test.com');
    RAISE NOTICE '✅ INSERT básico: EXITOSO';
    DELETE FROM profiles WHERE id = test_id;
  EXCEPTION
    WHEN OTHERS THEN
      error_msg := SQLERRM;
      RAISE NOTICE '❌ INSERT básico FALLÓ: %', error_msg;
  END;

  -- Test 2: INSERT con todos los campos
  BEGIN
    INSERT INTO profiles (
      id, email, nombre, apellido, grado, 
      nombre_colegio, ciudad, pais, edad, sexo
    ) VALUES (
      test_id, 'test-complete@test.com', 'Test', 'User', '5°',
      'Test School', 'Test City', 'Colombia', 15, 'Masculino'
    );
    RAISE NOTICE '✅ INSERT completo: EXITOSO';
    DELETE FROM profiles WHERE id = test_id;
  EXCEPTION
    WHEN OTHERS THEN
      error_msg := SQLERRM;
      RAISE NOTICE '❌ INSERT completo FALLÓ: %', error_msg;
  END;

  -- Test 3: UPSERT
  BEGIN
    INSERT INTO profiles (id, email) 
    VALUES (test_id, 'test-upsert@test.com')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
    RAISE NOTICE '✅ UPSERT: EXITOSO';
    DELETE FROM profiles WHERE id = test_id;
  EXCEPTION
    WHEN OTHERS THEN
      error_msg := SQLERRM;
      RAISE NOTICE '❌ UPSERT FALLÓ: %', error_msg;
  END;
END $$;

-- 6. VERIFICAR PERMISOS ACTUALES
SELECT 
  '=== PERMISOS ===' as seccion;

SELECT 
  current_user as "Usuario Actual",
  session_user as "Usuario Sesión";

-- 7. VERIFICAR DATOS EXISTENTES
SELECT 
  '=== DATOS EXISTENTES ===' as seccion;

SELECT 
  COUNT(*) as "Total Profiles",
  COUNT(DISTINCT email) as "Emails Únicos"
FROM profiles;

-- 8. VERIFICAR ESTRUCTURA COMPLETA
SELECT 
  '=== ESTRUCTURA TABLA ===' as seccion;

SELECT 
  column_name as "Columna",
  data_type as "Tipo",
  is_nullable as "Nullable",
  COALESCE(column_default, 'Sin default') as "Default"
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- =====================================================
-- COPIA TODOS LOS RESULTADOS Y COMPÁRTELOS
-- =====================================================
