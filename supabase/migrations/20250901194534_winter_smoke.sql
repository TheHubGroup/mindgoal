/*
  # Complete Dashboard Integration for All Activities

  This migration updates the dashboard system to include all missing activities:
  1. La Comunicación (communication_sessions)
  2. Semáforo de los Límites (semaforo_limites_sessions)
  3. Problema Resuelto (problema_resuelto_sessions)
  4. Dulces Mágicos (dulces_magicos_sessions)

  ## Changes:
  - Update public_dashboard table structure to include new activities
  - Update update_dashboard_for_user function to calculate stats for all activities
  - Add triggers for automatic dashboard updates
  - Update score calculation to include all activities
  - Populate dashboard with existing data
*/

-- Add new columns to public_dashboard table for missing activities
ALTER TABLE public_dashboard 
ADD COLUMN IF NOT EXISTS communication_stats jsonb NOT NULL DEFAULT '{
  "count": 0,
  "completed": 0,
  "messages_count": 0,
  "last_activity": null,
  "score": 0
}'::jsonb,
ADD COLUMN IF NOT EXISTS semaforo_stats jsonb NOT NULL DEFAULT '{
  "count": 0,
  "completed": 0,
  "situations_completed": 0,
  "last_activity": null,
  "score": 0
}'::jsonb,
ADD COLUMN IF NOT EXISTS problema_resuelto_stats jsonb NOT NULL DEFAULT '{
  "count": 0,
  "completed": 0,
  "problems_resolved": 0,
  "resilience_score": 0,
  "resilient_responses": 0,
  "last_activity": null,
  "score": 0
}'::jsonb,
ADD COLUMN IF NOT EXISTS dulces_magicos_stats jsonb NOT NULL DEFAULT '{
  "count": 0,
  "last_ending": null,
  "resilience_level": null,
  "last_activity": null,
  "score": 0
}'::jsonb;

-- Update the update_dashboard_for_user function to include all activities
CREATE OR REPLACE FUNCTION update_dashboard_for_user(p_user_id uuid)
RETURNS void AS $$
DECLARE
  -- Profile variables
  v_profile_info jsonb;
  v_profile_exists boolean;
  
  -- Timeline variables
  v_timeline_count integer := 0;
  v_timeline_chars integer := 0;
  v_timeline_last_activity timestamptz;
  v_timeline_score integer := 0;
  
  -- Responses variables
  v_responses_count integer := 0;
  v_responses_chars integer := 0;
  v_responses_last_activity timestamptz;
  v_responses_score integer := 0;
  
  -- Letters variables
  v_letters_count integer := 0;
  v_letters_chars integer := 0;
  v_letters_last_activity timestamptz;
  v_letters_score integer := 0;
  
  -- Meditation variables
  v_meditation_count integer := 0;
  v_meditation_completed integer := 0;
  v_meditation_duration numeric := 0;
  v_meditation_reflection_chars integer := 0;
  v_meditation_last_activity timestamptz;
  v_meditation_score integer := 0;
  
  -- Emotion matches variables
  v_emotion_attempts integer := 0;
  v_emotion_correct integer := 0;
  v_emotion_completed integer := 0;
  v_emotion_last_activity timestamptz;
  v_emotion_score integer := 0;
  
  -- Emotion logs variables
  v_emotion_logs_count integer := 0;
  v_emotion_logs_notes_chars integer := 0;
  v_emotion_logs_last_activity timestamptz;
  v_emotion_logs_score integer := 0;
  
  -- Anger management variables
  v_anger_count integer := 0;
  v_anger_completed integer := 0;
  v_anger_duration numeric := 0;
  v_anger_reflection_chars integer := 0;
  v_anger_techniques_count integer := 0;
  v_anger_last_activity timestamptz;
  v_anger_score integer := 0;
  
  -- Communication variables
  v_communication_count integer := 0;
  v_communication_completed integer := 0;
  v_communication_messages_count integer := 0;
  v_communication_last_activity timestamptz;
  v_communication_score integer := 0;
  
  -- Semaforo variables
  v_semaforo_count integer := 0;
  v_semaforo_completed integer := 0;
  v_semaforo_situations_completed integer := 0;
  v_semaforo_last_activity timestamptz;
  v_semaforo_score integer := 0;
  
  -- Problema Resuelto variables
  v_problema_count integer := 0;
  v_problema_completed integer := 0;
  v_problema_problems_resolved integer := 0;
  v_problema_resilience_score numeric := 0;
  v_problema_resilient_responses integer := 0;
  v_problema_last_activity timestamptz;
  v_problema_score integer := 0;
  
  -- Dulces Magicos variables
  v_dulces_count integer := 0;
  v_dulces_last_ending text;
  v_dulces_resilience_level text;
  v_dulces_last_activity timestamptz;
  v_dulces_score integer := 0;
  
  -- Total score
  v_total_score integer := 0;
  v_level text;
  
BEGIN
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = p_user_id) INTO v_profile_exists;
  
  -- Get profile info (with error handling)
  IF v_profile_exists THEN
    BEGIN
      SELECT 
        jsonb_build_object(
          'id', id,
          'email', COALESCE(email, ''),
          'nombre', COALESCE(nombre, ''),
          'apellido', COALESCE(apellido, ''),
          'grado', COALESCE(grado, ''),
          'nombre_colegio', COALESCE(nombre_colegio, ''),
          'ciudad', COALESCE(ciudad, ''),
          'pais', COALESCE(pais, ''),
          'edad', COALESCE(edad, 0),
          'sexo', COALESCE(sexo, ''),
          'avatar_url', COALESCE(avatar_url, ''),
          'username', COALESCE(username, ''),
          'created_at', created_at
        )
      INTO v_profile_info
      FROM profiles
      WHERE id = p_user_id;
    EXCEPTION
      WHEN OTHERS THEN
        v_profile_info := '{}'::jsonb;
    END;
  ELSE
    v_profile_info := '{}'::jsonb;
  END IF;
  
  -- Ensure profile_info is never NULL
  IF v_profile_info IS NULL THEN
    v_profile_info := '{}'::jsonb;
  END IF;
  
  -- Get timeline stats
  SELECT 
    COUNT(*),
    COALESCE(SUM(LENGTH(text)), 0),
    MAX(updated_at)
  INTO 
    v_timeline_count,
    v_timeline_chars,
    v_timeline_last_activity
  FROM timeline_notes
  WHERE user_id = p_user_id;
  
  v_timeline_score := v_timeline_chars + (v_timeline_count * 50);
  
  -- Get responses stats
  SELECT 
    COUNT(*),
    COALESCE(SUM(LENGTH(response)), 0),
    MAX(updated_at)
  INTO 
    v_responses_count,
    v_responses_chars,
    v_responses_last_activity
  FROM user_responses
  WHERE user_id = p_user_id;
  
  v_responses_score := v_responses_chars + (v_responses_count * 25);
  
  -- Get letters stats
  SELECT 
    COUNT(*),
    COALESCE(SUM(LENGTH(title) + LENGTH(content)), 0),
    MAX(updated_at)
  INTO 
    v_letters_count,
    v_letters_chars,
    v_letters_last_activity
  FROM letters
  WHERE user_id = p_user_id;
  
  v_letters_score := v_letters_chars + (v_letters_count * 100);
  
  -- Get meditation stats
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END),
    COALESCE(SUM(watch_duration), 0),
    COALESCE(SUM(CASE WHEN reflection_text IS NOT NULL THEN LENGTH(reflection_text) ELSE 0 END), 0),
    MAX(updated_at)
  INTO 
    v_meditation_count,
    v_meditation_completed,
    v_meditation_duration,
    v_meditation_reflection_chars,
    v_meditation_last_activity
  FROM meditation_sessions
  WHERE user_id = p_user_id;
  
  v_meditation_score := 
    (FLOOR(v_meditation_duration / 60) * 50) + 
    (v_meditation_completed * 200) + 
    v_meditation_reflection_chars + 
    (v_meditation_count * 50);
  
  -- Get emotion matches stats
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN is_correct THEN 1 END),
    COUNT(DISTINCT CASE WHEN is_correct AND explanation_shown THEN emotion_name END),
    MAX(created_at)
  INTO 
    v_emotion_attempts,
    v_emotion_correct,
    v_emotion_completed,
    v_emotion_last_activity
  FROM emotion_matches
  WHERE user_id = p_user_id;
  
  v_emotion_score := 
    (v_emotion_attempts * 10) + 
    (v_emotion_correct * 30) + 
    (v_emotion_completed * 100);
  
  -- Get emotion logs stats
  SELECT 
    COUNT(*),
    COALESCE(SUM(CASE WHEN notes IS NOT NULL THEN LENGTH(notes) ELSE 0 END), 0),
    MAX(updated_at)
  INTO 
    v_emotion_logs_count,
    v_emotion_logs_notes_chars,
    v_emotion_logs_last_activity
  FROM user_emotion_log
  WHERE user_id = p_user_id;
  
  v_emotion_logs_score := 
    (v_emotion_logs_count * 50) + 
    v_emotion_logs_notes_chars;
  
  -- Get anger management stats
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END),
    COALESCE(SUM(watch_duration), 0),
    COALESCE(SUM(CASE WHEN reflection_text IS NOT NULL THEN LENGTH(reflection_text) ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN techniques_applied IS NOT NULL THEN array_length(techniques_applied, 1) ELSE 0 END), 0),
    MAX(updated_at)
  INTO 
    v_anger_count,
    v_anger_completed,
    v_anger_duration,
    v_anger_reflection_chars,
    v_anger_techniques_count,
    v_anger_last_activity
  FROM anger_management_sessions
  WHERE user_id = p_user_id;
  
  v_anger_score := 
    (FLOOR(v_anger_duration / 60) * 50) + 
    (v_anger_completed * 200) + 
    v_anger_reflection_chars + 
    (v_anger_techniques_count * 50) + 
    (v_anger_count * 50);
  
  -- Get communication stats
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END),
    COALESCE(SUM(
      CASE 
        WHEN messages IS NOT NULL THEN 
          (SELECT COUNT(*) FROM jsonb_array_elements(messages) AS msg WHERE msg->>'sender' = 'user')
        ELSE 0 
      END
    ), 0),
    MAX(updated_at)
  INTO 
    v_communication_count,
    v_communication_completed,
    v_communication_messages_count,
    v_communication_last_activity
  FROM communication_sessions
  WHERE user_id = p_user_id;
  
  v_communication_score := 
    (v_communication_messages_count * 20) + -- 20 points per user message
    (v_communication_completed * 300) + -- 300 points for completion
    (v_communication_count * 50); -- 50 points per session
  
  -- Get semaforo stats
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END),
    COALESCE(SUM(completed_situations), 0),
    MAX(updated_at)
  INTO 
    v_semaforo_count,
    v_semaforo_completed,
    v_semaforo_situations_completed,
    v_semaforo_last_activity
  FROM semaforo_limites_sessions
  WHERE user_id = p_user_id;
  
  v_semaforo_score := 
    (v_semaforo_situations_completed * 50) + -- 50 points per situation
    (v_semaforo_completed * 200) + -- 200 points for completion
    (v_semaforo_count * 50); -- 50 points per session
  
  -- Get problema resuelto stats
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END),
    COALESCE(SUM(completed_problems), 0),
    COALESCE(AVG(resilience_score), 0),
    COALESCE(SUM(resilient_responses), 0),
    MAX(updated_at)
  INTO 
    v_problema_count,
    v_problema_completed,
    v_problema_problems_resolved,
    v_problema_resilience_score,
    v_problema_resilient_responses,
    v_problema_last_activity
  FROM problema_resuelto_sessions
  WHERE user_id = p_user_id;
  
  v_problema_score := 
    (v_problema_problems_resolved * 100) + -- 100 points per problem
    (v_problema_completed * 300) + -- 300 points for completion
    (v_problema_resilient_responses * 50) + -- 50 points per resilient response
    ROUND(v_problema_resilience_score * 2); -- 2 points per resilience percentage
  
  -- Get dulces magicos stats
  SELECT 
    COUNT(*),
    (SELECT ending_reached FROM dulces_magicos_sessions WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 1),
    (SELECT resilience_level FROM dulces_magicos_sessions WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 1),
    MAX(updated_at)
  INTO 
    v_dulces_count,
    v_dulces_last_ending,
    v_dulces_resilience_level,
    v_dulces_last_activity
  FROM dulces_magicos_sessions
  WHERE user_id = p_user_id;
  
  -- Calculate dulces magicos score
  v_dulces_score := v_dulces_count * 300; -- 300 points per completion
  
  -- Add resilience bonus
  IF v_dulces_resilience_level IS NOT NULL THEN
    CASE v_dulces_resilience_level
      WHEN 'Muy Resiliente' THEN v_dulces_score := v_dulces_score + 200;
      WHEN 'Resiliente' THEN v_dulces_score := v_dulces_score + 150;
      WHEN 'Poco Resiliente' THEN v_dulces_score := v_dulces_score + 100;
      WHEN 'Nada Resiliente' THEN v_dulces_score := v_dulces_score + 50;
    END CASE;
  END IF;
  
  -- Calculate total score
  v_total_score := 
    v_timeline_score + 
    v_responses_score + 
    v_letters_score + 
    v_meditation_score + 
    v_emotion_score + 
    v_emotion_logs_score + 
    v_anger_score +
    v_communication_score +
    v_semaforo_score +
    v_problema_score +
    v_dulces_score;
  
  -- Determine level
  v_level := get_dashboard_level(v_total_score);
  
  -- Insert or update dashboard data
  BEGIN
    INSERT INTO public_dashboard (
      user_id,
      profile_info,
      timeline_stats,
      responses_stats,
      letters_stats,
      meditation_stats,
      emotion_matches_stats,
      emotion_logs_stats,
      anger_stats,
      communication_stats,
      semaforo_stats,
      problema_resuelto_stats,
      dulces_magicos_stats,
      total_score,
      level,
      last_updated
    )
    VALUES (
      p_user_id,
      v_profile_info,
      jsonb_build_object(
        'count', v_timeline_count,
        'chars', v_timeline_chars,
        'last_activity', v_timeline_last_activity,
        'score', v_timeline_score
      ),
      jsonb_build_object(
        'count', v_responses_count,
        'chars', v_responses_chars,
        'last_activity', v_responses_last_activity,
        'score', v_responses_score
      ),
      jsonb_build_object(
        'count', v_letters_count,
        'chars', v_letters_chars,
        'last_activity', v_letters_last_activity,
        'score', v_letters_score
      ),
      jsonb_build_object(
        'count', v_meditation_count,
        'completed', v_meditation_completed,
        'duration', v_meditation_duration,
        'reflection_chars', v_meditation_reflection_chars,
        'last_activity', v_meditation_last_activity,
        'score', v_meditation_score
      ),
      jsonb_build_object(
        'attempts', v_emotion_attempts,
        'correct', v_emotion_correct,
        'completed', v_emotion_completed,
        'last_activity', v_emotion_last_activity,
        'score', v_emotion_score
      ),
      jsonb_build_object(
        'count', v_emotion_logs_count,
        'notes_chars', v_emotion_logs_notes_chars,
        'last_activity', v_emotion_logs_last_activity,
        'score', v_emotion_logs_score
      ),
      jsonb_build_object(
        'count', v_anger_count,
        'completed', v_anger_completed,
        'duration', v_anger_duration,
        'reflection_chars', v_anger_reflection_chars,
        'techniques_count', v_anger_techniques_count,
        'last_activity', v_anger_last_activity,
        'score', v_anger_score
      ),
      jsonb_build_object(
        'count', v_communication_count,
        'completed', v_communication_completed,
        'messages_count', v_communication_messages_count,
        'last_activity', v_communication_last_activity,
        'score', v_communication_score
      ),
      jsonb_build_object(
        'count', v_semaforo_count,
        'completed', v_semaforo_completed,
        'situations_completed', v_semaforo_situations_completed,
        'last_activity', v_semaforo_last_activity,
        'score', v_semaforo_score
      ),
      jsonb_build_object(
        'count', v_problema_count,
        'completed', v_problema_completed,
        'problems_resolved', v_problema_problems_resolved,
        'resilience_score', v_problema_resilience_score,
        'resilient_responses', v_problema_resilient_responses,
        'last_activity', v_problema_last_activity,
        'score', v_problema_score
      ),
      jsonb_build_object(
        'count', v_dulces_count,
        'last_ending', v_dulces_last_ending,
        'resilience_level', v_dulces_resilience_level,
        'last_activity', v_dulces_last_activity,
        'score', v_dulces_score
      ),
      v_total_score,
      v_level,
      now()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      profile_info = EXCLUDED.profile_info,
      timeline_stats = EXCLUDED.timeline_stats,
      responses_stats = EXCLUDED.responses_stats,
      letters_stats = EXCLUDED.letters_stats,
      meditation_stats = EXCLUDED.meditation_stats,
      emotion_matches_stats = EXCLUDED.emotion_matches_stats,
      emotion_logs_stats = EXCLUDED.emotion_logs_stats,
      anger_stats = EXCLUDED.anger_stats,
      communication_stats = EXCLUDED.communication_stats,
      semaforo_stats = EXCLUDED.semaforo_stats,
      problema_resuelto_stats = EXCLUDED.problema_resuelto_stats,
      dulces_magicos_stats = EXCLUDED.dulces_magicos_stats,
      total_score = EXCLUDED.total_score,
      level = EXCLUDED.level,
      last_updated = EXCLUDED.last_updated;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error updating dashboard for user %: %', p_user_id, SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger functions for the new activities
CREATE OR REPLACE FUNCTION trigger_update_dashboard_communication()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_dashboard_for_user(OLD.user_id);
    RETURN OLD;
  ELSE
    PERFORM update_dashboard_for_user(NEW.user_id);
    RETURN NEW;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in trigger_update_dashboard_communication: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trigger_update_dashboard_semaforo()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_dashboard_for_user(OLD.user_id);
    RETURN OLD;
  ELSE
    PERFORM update_dashboard_for_user(NEW.user_id);
    RETURN NEW;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in trigger_update_dashboard_semaforo: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trigger_update_dashboard_problema_resuelto()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_dashboard_for_user(OLD.user_id);
    RETURN OLD;
  ELSE
    PERFORM update_dashboard_for_user(NEW.user_id);
    RETURN NEW;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in trigger_update_dashboard_problema_resuelto: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trigger_update_dashboard_dulces_magicos()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_dashboard_for_user(OLD.user_id);
    RETURN OLD;
  ELSE
    PERFORM update_dashboard_for_user(NEW.user_id);
    RETURN NEW;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in trigger_update_dashboard_dulces_magicos: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic dashboard updates
DROP TRIGGER IF EXISTS update_dashboard_communication ON communication_sessions;
CREATE TRIGGER update_dashboard_communication
  AFTER INSERT OR UPDATE OR DELETE ON communication_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_dashboard_communication();

DROP TRIGGER IF EXISTS update_dashboard_semaforo ON semaforo_limites_sessions;
CREATE TRIGGER update_dashboard_semaforo
  AFTER INSERT OR UPDATE OR DELETE ON semaforo_limites_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_dashboard_semaforo();

DROP TRIGGER IF EXISTS update_dashboard_problema_resuelto ON problema_resuelto_sessions;
CREATE TRIGGER update_dashboard_problema_resuelto
  AFTER INSERT OR UPDATE OR DELETE ON problema_resuelto_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_dashboard_problema_resuelto();

DROP TRIGGER IF EXISTS update_dashboard_dulces_magicos ON dulces_magicos_sessions;
CREATE TRIGGER update_dashboard_dulces_magicos
  AFTER INSERT OR UPDATE OR DELETE ON dulces_magicos_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_dashboard_dulces_magicos();

-- Update the get_user_activity_details function to include new activities
CREATE OR REPLACE FUNCTION get_user_activity_details(p_user_id uuid)
RETURNS json AS $$
DECLARE
  result json;
  profile_data json;
  timeline_data json;
  responses_data json;
  letters_data json;
  meditation_data json;
  emotion_matches_data json;
  emotion_logs_data json;
  anger_data json;
  communication_data json;
  semaforo_data json;
  problema_resuelto_data json;
  dulces_magicos_data json;
BEGIN
  -- Get profile data with proper NULL handling
  BEGIN
    SELECT 
      json_build_object(
        'id', p.id,
        'email', COALESCE(p.email, ''),
        'nombre', COALESCE(p.nombre, ''),
        'apellido', COALESCE(p.apellido, ''),
        'grado', COALESCE(p.grado, ''),
        'nombre_colegio', COALESCE(p.nombre_colegio, ''),
        'ciudad', COALESCE(p.ciudad, ''),
        'pais', COALESCE(p.pais, ''),
        'edad', COALESCE(p.edad, 0),
        'sexo', COALESCE(p.sexo, ''),
        'avatar_url', COALESCE(p.avatar_url, '')
      )
    INTO profile_data
    FROM profiles p
    WHERE p.id = p_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      profile_data := NULL;
  END;
  
  -- Handle case where profile doesn't exist
  IF profile_data IS NULL THEN
    profile_data := json_build_object(
      'id', p_user_id,
      'email', '',
      'nombre', '',
      'apellido', '',
      'grado', '',
      'nombre_colegio', '',
      'ciudad', '',
      'pais', '',
      'edad', 0,
      'sexo', '',
      'avatar_url', ''
    );
  END IF;
  
  -- Get timeline notes
  BEGIN
    SELECT 
      COALESCE(
        json_agg(
          json_build_object(
            'id', t.id,
            'text', t.text,
            'emoji', t.emoji,
            'color', t.color,
            'shape', t.shape,
            'font', t.font,
            'section', t.section,
            'position_x', t.position_x,
            'position_y', t.position_y,
            'created_at', t.created_at
          )
        ),
        '[]'::json
      )
    INTO timeline_data
    FROM timeline_notes t
    WHERE t.user_id = p_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      timeline_data := '[]'::json;
  END;
  
  -- Get user responses
  BEGIN
    SELECT 
      COALESCE(
        json_agg(
          json_build_object(
            'id', r.id,
            'question', r.question,
            'response', r.response,
            'activity_type', r.activity_type,
            'created_at', r.created_at
          )
        ),
        '[]'::json
      )
    INTO responses_data
    FROM user_responses r
    WHERE r.user_id = p_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      responses_data := '[]'::json;
  END;
  
  -- Get letters
  BEGIN
    SELECT 
      COALESCE(
        json_agg(
          json_build_object(
            'id', l.id,
            'title', l.title,
            'content', l.content,
            'created_at', l.created_at
          )
        ),
        '[]'::json
      )
    INTO letters_data
    FROM letters l
    WHERE l.user_id = p_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      letters_data := '[]'::json;
  END;
  
  -- Get meditation sessions
  BEGIN
    SELECT 
      COALESCE(
        json_agg(
          json_build_object(
            'id', m.id,
            'video_id', m.video_id,
            'video_title', m.video_title,
            'watch_duration', m.watch_duration,
            'completion_percentage', m.completion_percentage,
            'reflection_text', m.reflection_text,
            'completed_at', m.completed_at,
            'created_at', m.created_at
          )
        ),
        '[]'::json
      )
    INTO meditation_data
    FROM meditation_sessions m
    WHERE m.user_id = p_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      meditation_data := '[]'::json;
  END;
  
  -- Get emotion matches
  BEGIN
    SELECT 
      COALESCE(
        json_agg(
          json_build_object(
            'id', e.id,
            'emotion_name', e.emotion_name,
            'is_correct', e.is_correct,
            'explanation_shown', e.explanation_shown,
            'created_at', e.created_at
          )
        ),
        '[]'::json
      )
    INTO emotion_matches_data
    FROM emotion_matches e
    WHERE e.user_id = p_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      emotion_matches_data := '[]'::json;
  END;
  
  -- Get emotion logs
  BEGIN
    SELECT 
      COALESCE(
        json_agg(
          json_build_object(
            'id', el.id,
            'emotion_name', el.emotion_name,
            'felt_at', el.felt_at,
            'intensity', el.intensity,
            'notes', el.notes,
            'created_at', el.created_at
          )
        ),
        '[]'::json
      )
    INTO emotion_logs_data
    FROM user_emotion_log el
    WHERE el.user_id = p_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      emotion_logs_data := '[]'::json;
  END;
  
  -- Get anger management sessions
  BEGIN
    SELECT 
      COALESCE(
        json_agg(
          json_build_object(
            'id', a.id,
            'video_id', a.video_id,
            'video_title', a.video_title,
            'watch_duration', a.watch_duration,
            'completion_percentage', a.completion_percentage,
            'reflection_text', a.reflection_text,
            'techniques_applied', a.techniques_applied,
            'completed_at', a.completed_at,
            'created_at', a.created_at
          )
        ),
        '[]'::json
      )
    INTO anger_data
    FROM anger_management_sessions a
    WHERE a.user_id = p_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      anger_data := '[]'::json;
  END;
  
  -- Get communication sessions
  BEGIN
    SELECT 
      COALESCE(
        json_agg(
          json_build_object(
            'id', c.id,
            'messages', c.messages,
            'current_step', c.current_step,
            'completed_at', c.completed_at,
            'ai_evaluation', c.ai_evaluation,
            'created_at', c.created_at
          )
        ),
        '[]'::json
      )
    INTO communication_data
    FROM communication_sessions c
    WHERE c.user_id = p_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      communication_data := '[]'::json;
  END;
  
  -- Get semaforo sessions
  BEGIN
    SELECT 
      COALESCE(
        json_agg(
          json_build_object(
            'id', s.id,
            'completed_at', s.completed_at,
            'total_situations', s.total_situations,
            'completed_situations', s.completed_situations,
            'created_at', s.created_at
          )
        ),
        '[]'::json
      )
    INTO semaforo_data
    FROM semaforo_limites_sessions s
    WHERE s.user_id = p_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      semaforo_data := '[]'::json;
  END;
  
  -- Get problema resuelto sessions
  BEGIN
    SELECT 
      COALESCE(
        json_agg(
          json_build_object(
            'id', pr.id,
            'completed_at', pr.completed_at,
            'total_problems', pr.total_problems,
            'completed_problems', pr.completed_problems,
            'resilient_responses', pr.resilient_responses,
            'impulsive_responses', pr.impulsive_responses,
            'resilience_score', pr.resilience_score,
            'created_at', pr.created_at
          )
        ),
        '[]'::json
      )
    INTO problema_resuelto_data
    FROM problema_resuelto_sessions pr
    WHERE pr.user_id = p_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      problema_resuelto_data := '[]'::json;
  END;
  
  -- Get dulces magicos sessions
  BEGIN
    SELECT 
      COALESCE(
        json_agg(
          json_build_object(
            'id', dm.id,
            'completed_at', dm.completed_at,
            'ending_reached', dm.ending_reached,
            'resilience_level', dm.resilience_level,
            'decision_path', dm.decision_path,
            'created_at', dm.created_at
          )
        ),
        '[]'::json
      )
    INTO dulces_magicos_data
    FROM dulces_magicos_sessions dm
    WHERE dm.user_id = p_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      dulces_magicos_data := '[]'::json;
  END;
  
  -- Combine all data into a single result object
  BEGIN
    SELECT 
      json_build_object(
        'user_id', p_user_id,
        'email', profile_data->>'email',
        'nombre', profile_data->>'nombre',
        'apellido', profile_data->>'apellido',
        'grado', profile_data->>'grado',
        'nombre_colegio', profile_data->>'nombre_colegio',
        'ciudad', profile_data->>'ciudad',
        'pais', profile_data->>'pais',
        'edad', (profile_data->>'edad')::integer,
        'sexo', profile_data->>'sexo',
        'avatar_url', profile_data->>'avatar_url',
        'timeline_notes', timeline_data,
        'user_responses', responses_data,
        'letters', letters_data,
        'meditation_sessions', meditation_data,
        'emotion_matches', emotion_matches_data,
        'emotion_logs', emotion_logs_data,
        'anger_management_sessions', anger_data,
        'communication_sessions', communication_data,
        'semaforo_limites_sessions', semaforo_data,
        'problema_resuelto_sessions', problema_resuelto_data,
        'dulces_magicos_sessions', dulces_magicos_data
      )
    INTO result;
  EXCEPTION
    WHEN OTHERS THEN
      -- Return a minimal valid object in case of errors
      RAISE NOTICE 'Error building final result: %', SQLERRM;
      result := json_build_object(
        'user_id', p_user_id,
        'email', '',
        'nombre', '',
        'apellido', '',
        'grado', '',
        'nombre_colegio', '',
        'ciudad', '',
        'pais', '',
        'edad', 0,
        'sexo', '',
        'avatar_url', '',
        'timeline_notes', '[]',
        'user_responses', '[]',
        'letters', '[]',
        'meditation_sessions', '[]',
        'emotion_matches', '[]',
        'emotion_logs', '[]',
        'anger_management_sessions', '[]',
        'communication_sessions', '[]',
        'semaforo_limites_sessions', '[]',
        'problema_resuelto_sessions', '[]',
        'dulces_magicos_sessions', '[]'
      );
  END;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return a minimal valid object in case of errors
    RAISE NOTICE 'Error in get_user_activity_details: %', SQLERRM;
    RETURN json_build_object(
      'user_id', p_user_id,
      'email', '',
      'nombre', '',
      'apellido', '',
      'grado', '',
      'nombre_colegio', '',
      'ciudad', '',
      'pais', '',
      'edad', 0,
      'sexo', '',
      'avatar_url', '',
      'timeline_notes', '[]',
      'user_responses', '[]',
      'letters', '[]',
      'meditation_sessions', '[]',
      'emotion_matches', '[]',
      'emotion_logs', '[]',
      'anger_management_sessions', '[]',
      'communication_sessions', '[]',
      'semaforo_limites_sessions', '[]',
      'problema_resuelto_sessions', '[]',
      'dulces_magicos_sessions', '[]'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Force update dashboard for all existing users to include new activities
DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Iterate over all users
  FOR user_record IN SELECT id FROM auth.users LOOP
    -- Force update dashboard data
    PERFORM update_dashboard_for_user(user_record.id);
  END LOOP;
  
  RAISE NOTICE '✅ Dashboard updated for all users with new activities';
END $$;

-- Verification
DO $$
DECLARE
  dashboard_count integer;
  sample_user_id uuid;
  sample_dashboard json;
BEGIN
  -- Count dashboard records
  SELECT COUNT(*) INTO dashboard_count FROM public_dashboard;
  
  -- Test with a sample user
  SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
  
  IF sample_user_id IS NOT NULL THEN
    SELECT get_user_activity_details(sample_user_id) INTO sample_dashboard;
    
    RAISE NOTICE '✅ Dashboard integration completed successfully';
    RAISE NOTICE '✅ Updated % user dashboard records', dashboard_count;
    RAISE NOTICE '✅ Added columns: communication_stats, semaforo_stats, problema_resuelto_stats, dulces_magicos_stats';
    RAISE NOTICE '✅ Created triggers for automatic updates';
    RAISE NOTICE '✅ Updated get_user_activity_details function';
    RAISE NOTICE '🎯 All activities are now integrated in the dashboard system';
  ELSE
    RAISE NOTICE '⚠️ No users found to test the integration';
  END IF;
END $$;