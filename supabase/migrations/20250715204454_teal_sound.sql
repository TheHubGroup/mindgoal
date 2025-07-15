/*
  # Corregir políticas duplicadas para user_emotion_log
  
  Este script corrige el error "policy already exists" verificando
  primero si las políticas existen antes de intentar crearlas.
  
  ## Cambios:
  - Verifica si cada política existe antes de crearla
  - Mantiene la misma funcionalidad que las políticas originales
  - Evita errores de duplicación
*/

-- Eliminar políticas solo si existen
DROP POLICY IF EXISTS "Users can view own emotion logs" ON user_emotion_log;
DROP POLICY IF EXISTS "Users can insert own emotion logs" ON user_emotion_log;
DROP POLICY IF EXISTS "Users can update own emotion logs" ON user_emotion_log;
DROP POLICY IF EXISTS "Users can delete own emotion logs" ON user_emotion_log;

-- Crear políticas RLS solo si no existen
DO $$
BEGIN
  -- Política para SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_emotion_log' 
    AND policyname = 'Users can view own emotion logs'
  ) THEN
    CREATE POLICY "Users can view own emotion logs" ON user_emotion_log
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Política SELECT creada';
  ELSE
    RAISE NOTICE 'Política SELECT ya existe, omitiendo';
  END IF;

  -- Política para INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_emotion_log' 
    AND policyname = 'Users can insert own emotion logs'
  ) THEN
    CREATE POLICY "Users can insert own emotion logs" ON user_emotion_log
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE 'Política INSERT creada';
  ELSE
    RAISE NOTICE 'Política INSERT ya existe, omitiendo';
  END IF;

  -- Política para UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_emotion_log' 
    AND policyname = 'Users can update own emotion logs'
  ) THEN
    CREATE POLICY "Users can update own emotion logs" ON user_emotion_log
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE 'Política UPDATE creada';
  ELSE
    RAISE NOTICE 'Política UPDATE ya existe, omitiendo';
  END IF;

  -- Política para DELETE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_emotion_log' 
    AND policyname = 'Users can delete own emotion logs'
  ) THEN
    CREATE POLICY "Users can delete own emotion logs" ON user_emotion_log
      FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Política DELETE creada';
  ELSE
    RAISE NOTICE 'Política DELETE ya existe, omitiendo';
  END IF;
END $$;

-- Verificación
DO $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'user_emotion_log';
  
  RAISE NOTICE '✅ Tabla user_emotion_log tiene % políticas', policy_count;
  RAISE NOTICE '✅ Problema de políticas duplicadas resuelto';
  RAISE NOTICE '🎯 La tabla user_emotion_log está lista para su uso';
END $$;