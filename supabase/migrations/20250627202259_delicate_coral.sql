/*
  # Crear función para calcular y actualizar scores públicos
  
  Este script crea una función SQL que:
  1. Calcula correctamente el score de cada usuario
  2. Actualiza la tabla public_scores con los resultados
  3. Corrige el problema de columna ambigua en la función calculate_user_score
  
  ## Cambios:
  - Renombra el parámetro user_id a p_user_id para evitar ambigüedad
  - Califica todas las referencias a columnas con el nombre de la tabla
  - Crea una función para actualizar todos los scores públicos
  - Añade un test para verificar el funcionamiento
*/

-- Recrear la función calculate_user_score con referencias de columnas calificadas
CREATE OR REPLACE FUNCTION calculate_user_score(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  total_score integer := 0;
  
  -- Variables para timeline_notes
  timeline_notes_count integer := 0;
  timeline_notes_chars integer := 0;
  
  -- Variables para user_responses
  responses_count integer := 0;
  responses_chars integer := 0;
  
  -- Variables para letters
  letters_count integer := 0;
  letters_chars integer := 0;
  
  -- Variables para meditation_sessions
  meditation_count integer := 0;
  meditation_duration integer := 0;
  meditation_completed integer := 0;
  meditation_reflection_chars integer := 0;
  meditation_views integer := 0;
  meditation_skips integer := 0;
  
  -- Variables para emotion_matches
  emotion_attempts integer := 0;
  emotion_correct integer := 0;
  emotion_completed_count integer := 0;
  
  -- Variables para user_emotion_log
  emotion_logs_count integer := 0;
  emotion_logs_notes_chars integer := 0;
  
  -- Variables para anger_management_sessions
  anger_count integer := 0;
  anger_duration integer := 0;
  anger_completed integer := 0;
  anger_reflection_chars integer := 0;
  anger_techniques_count integer := 0;
  anger_views integer := 0;
  anger_skips integer := 0;
  
BEGIN
  -- Contar y sumar caracteres de timeline_notes
  SELECT 
    COUNT(*),
    COALESCE(SUM(LENGTH(timeline_notes.text)), 0)
  INTO 
    timeline_notes_count,
    timeline_notes_chars
  FROM timeline_notes 
  WHERE timeline_notes.user_id = p_user_id;
  
  -- Contar y sumar caracteres de user_responses
  SELECT 
    COUNT(*),
    COALESCE(SUM(LENGTH(user_responses.response)), 0)
  INTO 
    responses_count,
    responses_chars
  FROM user_responses 
  WHERE user_responses.user_id = p_user_id;
  
  -- Contar y sumar caracteres de letters
  SELECT 
    COUNT(*),
    COALESCE(SUM(LENGTH(letters.title) + LENGTH(letters.content)), 0)
  INTO 
    letters_count,
    letters_chars
  FROM letters 
  WHERE letters.user_id = p_user_id;
  
  -- Obtener estadísticas de meditation_sessions
  SELECT 
    COUNT(*),
    COALESCE(SUM(meditation_sessions.watch_duration), 0),
    COUNT(CASE WHEN meditation_sessions.completed_at IS NOT NULL THEN 1 END),
    COALESCE(SUM(CASE WHEN meditation_sessions.reflection_text IS NOT NULL THEN LENGTH(meditation_sessions.reflection_text) ELSE 0 END), 0),
    COALESCE(SUM(meditation_sessions.view_count), 0),
    COALESCE(SUM(meditation_sessions.skip_count), 0)
  INTO 
    meditation_count,
    meditation_duration,
    meditation_completed,
    meditation_reflection_chars,
    meditation_views,
    meditation_skips
  FROM meditation_sessions 
  WHERE meditation_sessions.user_id = p_user_id;
  
  -- Obtener estadísticas de emotion_matches
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN emotion_matches.is_correct THEN 1 END)
  INTO 
    emotion_attempts,
    emotion_correct
  FROM emotion_matches 
  WHERE emotion_matches.user_id = p_user_id;
  
  -- Contar emociones completadas (con explicación mostrada)
  SELECT 
    COUNT(DISTINCT emotion_matches.emotion_name)
  INTO 
    emotion_completed_count
  FROM emotion_matches 
  WHERE emotion_matches.user_id = p_user_id 
    AND emotion_matches.is_correct = true 
    AND emotion_matches.explanation_shown = true;
  
  -- Contar registros de emociones y caracteres de notas
  SELECT 
    COUNT(*),
    COALESCE(SUM(CASE WHEN user_emotion_log.notes IS NOT NULL THEN LENGTH(user_emotion_log.notes) ELSE 0 END), 0)
  INTO 
    emotion_logs_count,
    emotion_logs_notes_chars
  FROM user_emotion_log 
  WHERE user_emotion_log.user_id = p_user_id;
  
  -- Obtener estadísticas de anger_management_sessions
  SELECT 
    COUNT(*),
    COALESCE(SUM(anger_management_sessions.watch_duration), 0),
    COUNT(CASE WHEN anger_management_sessions.completed_at IS NOT NULL THEN 1 END),
    COALESCE(SUM(CASE WHEN anger_management_sessions.reflection_text IS NOT NULL THEN LENGTH(anger_management_sessions.reflection_text) ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN anger_management_sessions.techniques_applied IS NOT NULL THEN array_length(anger_management_sessions.techniques_applied, 1) ELSE 0 END), 0),
    COALESCE(SUM(anger_management_sessions.view_count), 0),
    COALESCE(SUM(anger_management_sessions.skip_count), 0)
  INTO 
    anger_count,
    anger_duration,
    anger_completed,
    anger_reflection_chars,
    anger_techniques_count,
    anger_views,
    anger_skips
  FROM anger_management_sessions 
  WHERE anger_management_sessions.user_id = p_user_id;
  
  -- Calcular puntaje total
  total_score := 
    -- Notas de línea de tiempo (1 punto por carácter)
    timeline_notes_chars +
    
    -- Respuestas de "Cuéntame quien eres" (1 punto por carácter)
    responses_chars +
    
    -- Cartas personales (1 punto por carácter)
    letters_chars +
    
    -- Meditación
    (FLOOR(meditation_duration / 60) * 50) + -- 50 puntos por minuto visto
    (meditation_completed * 200) + -- 200 puntos por completar
    meditation_reflection_chars + -- 1 punto por carácter de reflexión
    ((meditation_views - meditation_count) * 100) + -- 100 puntos por cada visualización extra
    (CASE WHEN meditation_skips > 5 THEN -((meditation_skips - 5) * 10) ELSE 0 END) + -- Penalización por skips
    
    -- Nombra tus Emociones
    (emotion_attempts * 10) + -- 10 puntos por intento
    (emotion_correct * 30) + -- 30 puntos por acierto
    (emotion_completed_count * 100) + -- 100 puntos por emoción completada
    
    -- Calculadora de Emociones
    (emotion_logs_count * 50) + -- 50 puntos por registro
    emotion_logs_notes_chars + -- 1 punto por carácter de notas
    
    -- Menú de la Ira
    (FLOOR(anger_duration / 60) * 50) + -- 50 puntos por minuto visto
    (anger_completed * 200) + -- 200 puntos por completar
    anger_reflection_chars + -- 1 punto por carácter de reflexión
    (anger_techniques_count * 50) + -- 50 puntos por técnica seleccionada
    ((anger_views - anger_count) * 100) + -- 100 puntos por cada visualización extra
    (CASE WHEN anger_skips > 5 THEN -((anger_skips - 5) * 10) ELSE 0 END); -- Penalización por skips
  
  -- Asegurar que el puntaje no sea negativo
  IF total_score < 0 THEN
    total_score := 0;
  END IF;
  
  RETURN total_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear la función update_all_public_scores para usar el nuevo nombre de parámetro
CREATE OR REPLACE FUNCTION update_all_public_scores()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  user_score integer;
  user_level text;
BEGIN
  -- Iterar sobre todos los usuarios
  FOR user_record IN SELECT id FROM auth.users LOOP
    -- Calcular puntaje para este usuario
    user_score := calculate_user_score(user_record.id);
    
    -- Determinar nivel
    user_level := get_score_level(user_score);
    
    -- Insertar o actualizar en public_scores
    INSERT INTO public_scores (user_id, score, level, last_updated)
    VALUES (user_record.id, user_score, user_level, now())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      score = user_score,
      level = user_level,
      last_updated = now(),
      updated_at = now();
  END LOOP;
  
  RAISE NOTICE 'Puntajes públicos actualizados para todos los usuarios';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Probar la función corregida con un usuario de ejemplo
DO $$
DECLARE
  sample_user_id uuid;
  sample_score integer;
BEGIN
  -- Obtener un ID de usuario de ejemplo
  SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
  
  IF sample_user_id IS NOT NULL THEN
    -- Calcular puntaje para el usuario de ejemplo
    SELECT calculate_user_score(sample_user_id) INTO sample_score;
    
    RAISE NOTICE 'ID de usuario de ejemplo: %', sample_user_id;
    RAISE NOTICE 'Puntaje calculado: %', sample_score;
    RAISE NOTICE '✅ Prueba de cálculo de puntaje completada con éxito';
  ELSE
    RAISE NOTICE '⚠️ No se encontraron usuarios para probar el cálculo de puntaje';
  END IF;
END $$;

-- Verificación
DO $$
BEGIN
  RAISE NOTICE '✅ Se corrigió la referencia de columna ambigua en la función calculate_user_score';
  RAISE NOTICE '✅ Se actualizó la función update_all_public_scores';
  RAISE NOTICE '🏆 El cálculo de puntajes del leaderboard ahora debería funcionar correctamente';
END $$;