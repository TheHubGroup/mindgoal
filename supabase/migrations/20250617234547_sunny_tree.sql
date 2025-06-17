/*
  # Actualizar tabla meditation_sessions con nuevas funcionalidades

  1. Nuevas columnas
    - `skip_count` (integer) - Contador de adelantos/skips forward
    - `last_position` (numeric) - Última posición vista en segundos
    - `view_count` (integer) - Número de veces que ha visto el video

  2. Índice único
    - Crear índice único en (user_id, video_id) para evitar duplicados
    - Solo un registro por usuario por video

  3. Limpieza
    - Eliminar registros duplicados existentes
    - Mantener solo el más reciente por usuario/video

  4. Políticas UPSERT
    - Permitir operaciones UPSERT para mantener un solo registro
*/

-- Agregar nuevas columnas si no existen
DO $$
BEGIN
  -- Agregar skip_count si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meditation_sessions' AND column_name = 'skip_count'
  ) THEN
    ALTER TABLE meditation_sessions ADD COLUMN skip_count integer NOT NULL DEFAULT 0;
  END IF;

  -- Agregar last_position si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meditation_sessions' AND column_name = 'last_position'
  ) THEN
    ALTER TABLE meditation_sessions ADD COLUMN last_position numeric NOT NULL DEFAULT 0;
  END IF;

  -- Agregar view_count si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meditation_sessions' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE meditation_sessions ADD COLUMN view_count integer NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Limpiar registros duplicados (mantener solo el más reciente por user_id, video_id)
DELETE FROM meditation_sessions 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, video_id) id
  FROM meditation_sessions
  ORDER BY user_id, video_id, updated_at DESC
);

-- Crear índice único para evitar futuros duplicados
DROP INDEX IF EXISTS meditation_sessions_user_video_unique_idx;
CREATE UNIQUE INDEX meditation_sessions_user_video_unique_idx 
ON meditation_sessions(user_id, video_id);

-- Agregar constraint de check para skip_count
ALTER TABLE meditation_sessions 
DROP CONSTRAINT IF EXISTS meditation_sessions_skip_count_check;
ALTER TABLE meditation_sessions 
ADD CONSTRAINT meditation_sessions_skip_count_check 
CHECK (skip_count >= 0);

-- Agregar constraint de check para view_count
ALTER TABLE meditation_sessions 
DROP CONSTRAINT IF EXISTS meditation_sessions_view_count_check;
ALTER TABLE meditation_sessions 
ADD CONSTRAINT meditation_sessions_view_count_check 
CHECK (view_count >= 1);

-- Agregar constraint de check para last_position
ALTER TABLE meditation_sessions 
DROP CONSTRAINT IF EXISTS meditation_sessions_last_position_check;
ALTER TABLE meditation_sessions 
ADD CONSTRAINT meditation_sessions_last_position_check 
CHECK (last_position >= 0);

-- Crear índices adicionales para mejor rendimiento
CREATE INDEX IF NOT EXISTS meditation_sessions_skip_count_idx ON meditation_sessions(skip_count);
CREATE INDEX IF NOT EXISTS meditation_sessions_view_count_idx ON meditation_sessions(view_count);

-- Verificación final
DO $$
DECLARE
  total_sessions integer;
  unique_user_video_pairs integer;
BEGIN
  -- Contar total de sesiones
  SELECT COUNT(*) INTO total_sessions FROM meditation_sessions;
  
  -- Contar pares únicos user_id, video_id
  SELECT COUNT(DISTINCT (user_id, video_id)) INTO unique_user_video_pairs FROM meditation_sessions;
  
  IF total_sessions = unique_user_video_pairs THEN
    RAISE NOTICE '✅ Tabla meditation_sessions actualizada correctamente';
    RAISE NOTICE '✅ Duplicados eliminados: % sesiones únicas', total_sessions;
    RAISE NOTICE '✅ Nuevas columnas agregadas: skip_count, last_position, view_count';
    RAISE NOTICE '✅ Índice único creado para evitar futuros duplicados';
    RAISE NOTICE '🧘‍♀️ Sistema de tracking mejorado implementado';
  ELSE
    RAISE NOTICE '⚠️ Advertencia: Aún existen % duplicados de % total', 
                 (total_sessions - unique_user_video_pairs), total_sessions;
  END IF;
END $$;