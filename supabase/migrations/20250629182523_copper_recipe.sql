/*
  # Mejorar función de detalles de actividad de usuario
  
  Este script crea una función mejorada para obtener todos los detalles
  de actividad de un usuario específico, incluyendo:
  
  1. Datos completos de cada actividad
  2. Respuestas detalladas para cada tipo de actividad
  3. Soporte para consultas específicas por tipo de actividad
  
  ## Cambios:
  - Crear función get_user_activity_details mejorada
  - Asegurar que devuelve datos completos de todas las actividades
  - Optimizar para consultas rápidas
*/

-- Crear función para obtener detalles completos de actividad de un usuario
CREATE OR REPLACE FUNCTION get_user_activity_details(p_user_id uuid)
RETURNS SETOF json AS $$
DECLARE
  user_profile json;
  timeline_data json;
  responses_data json;
  letters_data json;
  meditation_data json;
  emotion_matches_data json;
  emotion_logs_data json;
  anger_data json;
BEGIN
  -- Obtener datos del perfil
  SELECT json_build_object(
    'id', id,
    'email', email,
    'nombre', nombre,
    'apellido', apellido,
    'grado', grado,
    'nombre_colegio', nombre_colegio,
    'ciudad', ciudad,
    'pais', pais,
    'edad', edad,
    'sexo', sexo,
    'avatar_url', avatar_url,
    'created_at', created_at
  ) INTO user_profile
  FROM profiles
  WHERE id = p_user_id;
  
  -- Obtener notas de línea de tiempo
  SELECT json_agg(
    json_build_object(
      'id', id,
      'text', text,
      'emoji', emoji,
      'color', color,
      'shape', shape,
      'font', font,
      'section', section,
      'position_x', position_x,
      'position_y', position_y,
      'created_at', created_at
    )
  ) INTO timeline_data
  FROM timeline_notes
  WHERE user_id = p_user_id;
  
  -- Obtener respuestas de usuario
  SELECT json_agg(
    json_build_object(
      'id', id,
      'question', question,
      'response', response,
      'activity_type', activity_type,
      'created_at', created_at
    )
  ) INTO responses_data
  FROM user_responses
  WHERE user_id = p_user_id;
  
  -- Obtener cartas
  SELECT json_agg(
    json_build_object(
      'id', id,
      'title', title,
      'content', content,
      'created_at', created_at,
      'updated_at', updated_at
    )
  ) INTO letters_data
  FROM letters
  WHERE user_id = p_user_id;
  
  -- Obtener sesiones de meditación
  SELECT json_agg(
    json_build_object(
      'id', id,
      'video_id', video_id,
      'video_title', video_title,
      'started_at', started_at,
      'completed_at', completed_at,
      'watch_duration', watch_duration,
      'total_duration', total_duration,
      'completion_percentage', completion_percentage,
      'reflection_text', reflection_text,
      'skip_count', skip_count,
      'view_count', view_count,
      'created_at', created_at
    )
  ) INTO meditation_data
  FROM meditation_sessions
  WHERE user_id = p_user_id;
  
  -- Obtener matches de emociones
  SELECT json_agg(
    json_build_object(
      'id', id,
      'emotion_name', emotion_name,
      'is_correct', is_correct,
      'explanation_shown', explanation_shown,
      'created_at', created_at
    )
  ) INTO emotion_matches_data
  FROM emotion_matches
  WHERE user_id = p_user_id;
  
  -- Obtener logs de emociones
  SELECT json_agg(
    json_build_object(
      'id', id,
      'emotion_name', emotion_name,
      'felt_at', felt_at,
      'intensity', intensity,
      'notes', notes,
      'created_at', created_at
    )
  ) INTO emotion_logs_data
  FROM user_emotion_log
  WHERE user_id = p_user_id;
  
  -- Obtener sesiones de manejo de ira
  SELECT json_agg(
    json_build_object(
      'id', id,
      'video_id', video_id,
      'video_title', video_title,
      'started_at', started_at,
      'completed_at', completed_at,
      'watch_duration', watch_duration,
      'total_duration', total_duration,
      'completion_percentage', completion_percentage,
      'reflection_text', reflection_text,
      'techniques_applied', techniques_applied,
      'skip_count', skip_count,
      'view_count', view_count,
      'created_at', created_at
    )
  ) INTO anger_data
  FROM anger_management_sessions
  WHERE user_id = p_user_id;
  
  -- Construir y devolver el objeto completo
  RETURN QUERY SELECT json_build_object(
    'user_id', p_user_id,
    'email', (user_profile->>'email'),
    'nombre', (user_profile->>'nombre'),
    'apellido', (user_profile->>'apellido'),
    'grado', (user_profile->>'grado'),
    'nombre_colegio', (user_profile->>'nombre_colegio'),
    'ciudad', (user_profile->>'ciudad'),
    'pais', (user_profile->>'pais'),
    'edad', (user_profile->>'edad')::integer,
    'sexo', (user_profile->>'sexo'),
    'avatar_url', (user_profile->>'avatar_url'),
    'created_at', (user_profile->>'created_at'),
    'timeline_notes', COALESCE(timeline_data, '[]'::json),
    'user_responses', COALESCE(responses_data, '[]'::json),
    'letters', COALESCE(letters_data, '[]'::json),
    'meditation_sessions', COALESCE(meditation_data, '[]'::json),
    'emotion_matches', COALESCE(emotion_matches_data, '[]'::json),
    'emotion_logs', COALESCE(emotion_logs_data, '[]'::json),
    'anger_management_sessions', COALESCE(anger_data, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función para obtener respuestas de una actividad específica
CREATE OR REPLACE FUNCTION get_user_activity_responses(p_user_id uuid, p_activity_type text)
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY
  SELECT json_agg(
    json_build_object(
      'id', id,
      'question', question,
      'response', response,
      'activity_type', activity_type,
      'created_at', created_at,
      'updated_at', updated_at
    )
  )
  FROM user_responses
  WHERE user_id = p_user_id AND activity_type = p_activity_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificación
DO $$
BEGIN
  RAISE NOTICE '✅ Función get_user_activity_details mejorada creada';
  RAISE NOTICE '✅ Función get_user_activity_responses creada';
  RAISE NOTICE '🎯 Ahora es posible obtener detalles completos de actividad por usuario';
END $$;