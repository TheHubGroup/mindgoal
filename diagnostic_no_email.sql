-- =====================================================
-- DIAGNÓSTICO SIN COLUMNA EMAIL
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. VER ESTRUCTURA REAL DE LA TABLA
SELECT 
  '=== ESTRUCTURA REAL ===' as seccion;

SELECT 
  column_name as "Columna",
  data_type as "Tipo",
  is_nullable as "Nullable",
  COALESCE(column_default, 'Sin default') as "Default"
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. VERIFICAR POLÍTICAS RLS
SELECT 
  '=== POLÍTICAS RLS ===' as seccion;

SELECT 
  policyname as "Nombre Política",
  cmd as "Operación",
  CASE 
    WHEN qual IS NULL THEN 'Sin restricción'
    ELSE qual 
  END as "Condición USING"
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd;

-- 3. VERIFICAR DATOS EXISTENTES
SELECT 
  '=== DATOS EXISTENTES ===' as seccion;

SELECT COUNT(*) as "Total Profiles" FROM profiles;

-- 4. TEST DE INSERT BÁSICO (solo con columnas que existen)
SELECT 
  '=== TEST INSERT BÁSICO ===' as seccion;

DO $$
DECLARE
  test_id uuid := '12345678-1234-1234-1234-123456789012';
  error_msg text;
BEGIN
  -- Test con solo ID (mínimo requerido)
  BEGIN
    INSERT INTO profiles (id) VALUES (test_id);
    RAISE NOTICE '✅ INSERT solo ID: EXITOSO';
    DELETE FROM profiles WHERE id = test_id;
  EXCEPTION
    WHEN OTHERS THEN
      error_msg := SQLERRM;
      RAISE NOTICE '❌ INSERT solo ID FALLÓ: %', error_msg;
  END;
END $$;

-- 5. VERIFICAR SI LA TABLA EXISTE
SELECT 
  '=== VERIFICAR TABLA ===' as seccion;

SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'profiles';

-- =====================================================
-- EJECUTA ESTO PARA VER LA ESTRUCTURA REAL
-- =====================================================
