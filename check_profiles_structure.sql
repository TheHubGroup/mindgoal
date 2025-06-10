-- =====================================================
-- VERIFICAR ESTRUCTURA COMPLETA DE PROFILES
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. VER TODAS LAS COLUMNAS DE LA TABLA PROFILES
SELECT 
  column_name as "Columna",
  data_type as "Tipo de Dato",
  is_nullable as "Permite NULL",
  COALESCE(column_default, 'Sin default') as "Valor Default",
  character_maximum_length as "Longitud Máxima"
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VER CONSTRAINTS DE LA TABLA (consulta corregida)
SELECT 
  tc.constraint_name as "Nombre Constraint",
  tc.constraint_type as "Tipo",
  ccu.column_name as "Columna"
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'profiles' 
  AND tc.table_schema = 'public';

-- 3. CONTAR REGISTROS EXISTENTES
SELECT COUNT(*) as "Total de Profiles Existentes" FROM profiles;

-- 4. VER PRIMEROS REGISTROS (si existen)
SELECT * FROM profiles LIMIT 3;
