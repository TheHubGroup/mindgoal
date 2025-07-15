/*
  # Corregir vista de estadísticas de emociones para usar nombres de columnas en español
  
  Este script corrige la vista emotion_statistics y funciones relacionadas
  para usar los nombres de columnas correctos que existen en la tabla profiles.
  
  ## Cambios:
  - Cambia first_name a nombre, last_name a apellido, etc.
  - Mantiene toda la funcionalidad de la versión anterior
  - Asegura compatibilidad con la estructura actual de la base de datos
*/

-- Crear vista de estadísticas de emociones con nombres de columnas correctos
CREATE OR REPLACE VIEW emotion_statistics AS
SELECT 
  u.id AS user_id,
  p.nombre,
  p.apellido,
  p.email,
  p.grado,
  p.edad,
  p.sexo,
  p.nombre_colegio,
  p.ciudad,
  p.pais,
  el.emotion_name,
  COUNT(el.id) AS emotion_count,
  COALESCE(AVG(el.intensity), 0) AS avg_intensity,
  MIN(el.felt_at) AS first_felt_at,
  MAX(el.felt_at) AS last_felt_at
FROM 
  auth.users u
  JOIN profiles p ON u.id = p.id
  LEFT JOIN user_emotion_log el ON u.id = el.user_id
WHERE
  el.emotion_name IS NOT NULL
GROUP BY 
  u.id, p.nombre, p.apellido, p.email, p.grado, p.edad, p.sexo, p.nombre_colegio, p.ciudad, p.pais, el.emotion_name;

-- Crear función para encontrar usuarios con más ocurrencias de una emoción específica
CREATE OR REPLACE FUNCTION find_users_by_emotion(
  emotion_name_param text,
  min_occurrences integer DEFAULT 1
)
RETURNS TABLE (
  user_id uuid,
  nombre text,
  apellido text,
  email text,
  emotion_count bigint,
  avg_intensity numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    es.user_id,
    es.nombre,
    es.apellido,
    es.email,
    es.emotion_count,
    es.avg_intensity
  FROM 
    emotion_statistics es
  WHERE 
    es.emotion_name = emotion_name_param
    AND es.emotion_count >= min_occurrences
  ORDER BY 
    es.emotion_count DESC, es.avg_intensity DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función para encontrar la emoción más común para cada usuario
CREATE OR REPLACE FUNCTION get_users_top_emotions(limit_param integer DEFAULT 100)
RETURNS TABLE (
  user_id uuid,
  nombre text,
  apellido text,
  email text,
  top_emotion text,
  emotion_count bigint,
  avg_intensity numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_emotions AS (
    SELECT 
      es.user_id,
      es.nombre,
      es.apellido,
      es.email,
      es.emotion_name,
      es.emotion_count,
      es.avg_intensity,
      ROW_NUMBER() OVER (PARTITION BY es.user_id ORDER BY es.emotion_count DESC, es.avg_intensity DESC) as rank
    FROM 
      emotion_statistics es
  )
  SELECT 
    re.user_id,
    re.nombre,
    re.apellido,
    re.email,
    re.emotion_name AS top_emotion,
    re.emotion_count,
    re.avg_intensity
  FROM 
    ranked_emotions re
  WHERE 
    re.rank = 1
  ORDER BY 
    re.emotion_count DESC, re.avg_intensity DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función para analizar tendencias de emociones por período de tiempo
CREATE OR REPLACE FUNCTION analyze_emotion_trends(
  period_type text DEFAULT 'month', -- 'day', 'week', 'month', 'year'
  start_date timestamptz DEFAULT NULL,
  end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
  period text,
  emotion_name text,
  emotion_count bigint,
  avg_intensity numeric,
  user_count bigint
) AS $$
DECLARE
  date_format text;
BEGIN
  -- Establecer fechas predeterminadas si no se proporcionan
  IF start_date IS NULL THEN
    start_date := NOW() - INTERVAL '1 year';
  END IF;
  
  IF end_date IS NULL THEN
    end_date := NOW();
  END IF;
  
  -- Establecer formato de fecha según el tipo de período
  CASE period_type
    WHEN 'day' THEN date_format := 'YYYY-MM-DD';
    WHEN 'week' THEN date_format := 'IYYY-IW';
    WHEN 'month' THEN date_format := 'YYYY-MM';
    WHEN 'year' THEN date_format := 'YYYY';
    ELSE date_format := 'YYYY-MM';
  END CASE;
  
  RETURN QUERY
  SELECT 
    TO_CHAR(el.felt_at, date_format) AS period,
    el.emotion_name,
    COUNT(el.id) AS emotion_count,
    COALESCE(AVG(el.intensity), 0) AS avg_intensity,
    COUNT(DISTINCT el.user_id) AS user_count
  FROM 
    user_emotion_log el
  WHERE 
    el.felt_at BETWEEN start_date AND end_date
  GROUP BY 
    period, el.emotion_name
  ORDER BY 
    period, emotion_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función para encontrar usuarios por patrón de emociones a lo largo del tiempo
CREATE OR REPLACE FUNCTION find_users_by_emotion_pattern(
  emotion_name_param text,
  min_frequency integer DEFAULT 3,
  time_period interval DEFAULT '30 days'
)
RETURNS TABLE (
  user_id uuid,
  nombre text,
  apellido text,
  email text,
  emotion_count bigint,
  frequency_per_week numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH user_emotion_stats AS (
    SELECT 
      p.id AS user_id,
      p.nombre,
      p.apellido,
      p.email,
      COUNT(el.id) AS emotion_count,
      COUNT(el.id)::numeric / (EXTRACT(EPOCH FROM time_period) / 604800) AS frequency_per_week
    FROM 
      profiles p
      JOIN user_emotion_log el ON p.id = el.user_id
    WHERE 
      el.emotion_name = emotion_name_param
      AND el.felt_at > NOW() - time_period
    GROUP BY 
      p.id, p.nombre, p.apellido, p.email
  )
  SELECT 
    ues.user_id,
    ues.nombre,
    ues.apellido,
    ues.email,
    ues.emotion_count,
    ues.frequency_per_week
  FROM 
    user_emotion_stats ues
  WHERE 
    ues.emotion_count >= min_frequency
  ORDER BY 
    ues.frequency_per_week DESC, ues.emotion_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificación
DO $$
BEGIN
  RAISE NOTICE '✅ Vista de estadísticas de emociones creada con nombres de columnas correctos';
  RAISE NOTICE '✅ Funciones de análisis de emociones de usuario actualizadas';
  RAISE NOTICE '🔍 Ahora puedes filtrar usuarios por patrones de emociones';
END $$;