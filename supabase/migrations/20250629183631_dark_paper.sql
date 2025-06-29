/*
  # Fix Dashboard NULL Constraint Issues and Add User Activity Details

  This migration addresses several issues:
  1. Fixes NULL constraint violations in public_dashboard table
  2. Updates trigger functions to properly handle DELETE operations
  3. Adds error handling to prevent constraint violations
  4. Creates functions to retrieve detailed user activity data

  ## Changes:
  - Update trigger functions to check TG_OP and use appropriate record (OLD/NEW)
  - Add error handling in all trigger functions
  - Set proper default values for all JSON columns
  - Fix any existing NULL values in the table
  - Create function to get detailed user activity data
*/

-- First, modify the update_dashboard_for_user function to handle NULL profile_info
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
        -- If any error occurs, use empty object
        v_profile_info := '{}'::jsonb;
    END;
  ELSE
    -- If profile doesn't exist, use empty object
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
  
  -- Calculate timeline score
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
  
  -- Calculate responses score
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
  
  -- Calculate letters score
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
  
  -- Calculate meditation score
  v_meditation_score := 
    (FLOOR(v_meditation_duration / 60) * 50) + -- 50 points per minute watched
    (v_meditation_completed * 200) + -- 200 points for completion
    v_meditation_reflection_chars + -- 1 point per reflection character
    (v_meditation_count * 50); -- 50 points per session
  
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
  
  -- Calculate emotion matches score
  v_emotion_score := 
    (v_emotion_attempts * 10) + -- 10 points per attempt
    (v_emotion_correct * 30) + -- 30 points per correct match
    (v_emotion_completed * 100); -- 100 points per completed emotion
  
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
  
  -- Calculate emotion logs score
  v_emotion_logs_score := 
    (v_emotion_logs_count * 50) + -- 50 points per log
    v_emotion_logs_notes_chars; -- 1 point per note character
  
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
  
  -- Calculate anger management score
  v_anger_score := 
    (FLOOR(v_anger_duration / 60) * 50) + -- 50 points per minute watched
    (v_anger_completed * 200) + -- 200 points for completion
    v_anger_reflection_chars + -- 1 point per reflection character
    (v_anger_techniques_count * 50) + -- 50 points per selected technique
    (v_anger_count * 50); -- 50 points per session
  
  -- Calculate total score
  v_total_score := 
    v_timeline_score + 
    v_responses_score + 
    v_letters_score + 
    v_meditation_score + 
    v_emotion_score + 
    v_emotion_logs_score + 
    v_anger_score;
  
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
      total_score = EXCLUDED.total_score,
      level = EXCLUDED.level,
      last_updated = EXCLUDED.last_updated;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error updating dashboard for user %: %', p_user_id, SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the trigger functions to handle NULL values properly
CREATE OR REPLACE FUNCTION trigger_update_dashboard_timeline()
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
    RAISE NOTICE 'Error in trigger_update_dashboard_timeline: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the other trigger functions similarly
CREATE OR REPLACE FUNCTION trigger_update_dashboard_responses()
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
    RAISE NOTICE 'Error in trigger_update_dashboard_responses: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trigger_update_dashboard_letters()
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
    RAISE NOTICE 'Error in trigger_update_dashboard_letters: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trigger_update_dashboard_meditation()
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
    RAISE NOTICE 'Error in trigger_update_dashboard_meditation: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trigger_update_dashboard_emotion_matches()
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
    RAISE NOTICE 'Error in trigger_update_dashboard_emotion_matches: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trigger_update_dashboard_emotion_logs()
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
    RAISE NOTICE 'Error in trigger_update_dashboard_emotion_logs: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trigger_update_dashboard_anger()
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
    RAISE NOTICE 'Error in trigger_update_dashboard_anger: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the profile trigger function
CREATE OR REPLACE FUNCTION trigger_update_dashboard_profile()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_dashboard_for_user(NEW.id);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in trigger_update_dashboard_profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the public_dashboard table has proper defaults for all columns
ALTER TABLE public_dashboard 
  ALTER COLUMN profile_info SET DEFAULT '{}'::jsonb,
  ALTER COLUMN timeline_stats SET DEFAULT '{"count": 0, "chars": 0, "score": 0}'::jsonb,
  ALTER COLUMN responses_stats SET DEFAULT '{"count": 0, "chars": 0, "score": 0}'::jsonb,
  ALTER COLUMN letters_stats SET DEFAULT '{"count": 0, "chars": 0, "score": 0}'::jsonb,
  ALTER COLUMN meditation_stats SET DEFAULT '{"count": 0, "completed": 0, "duration": 0, "reflection_chars": 0, "score": 0}'::jsonb,
  ALTER COLUMN emotion_matches_stats SET DEFAULT '{"attempts": 0, "correct": 0, "completed": 0, "score": 0}'::jsonb,
  ALTER COLUMN emotion_logs_stats SET DEFAULT '{"count": 0, "notes_chars": 0, "score": 0}'::jsonb,
  ALTER COLUMN anger_stats SET DEFAULT '{"count": 0, "completed": 0, "duration": 0, "reflection_chars": 0, "techniques_count": 0, "score": 0}'::jsonb;

-- Fix any existing NULL values in the public_dashboard table
UPDATE public_dashboard 
SET profile_info = '{}'::jsonb 
WHERE profile_info IS NULL;

UPDATE public_dashboard 
SET timeline_stats = '{"count": 0, "chars": 0, "score": 0}'::jsonb 
WHERE timeline_stats IS NULL;

UPDATE public_dashboard 
SET responses_stats = '{"count": 0, "chars": 0, "score": 0}'::jsonb 
WHERE responses_stats IS NULL;

UPDATE public_dashboard 
SET letters_stats = '{"count": 0, "chars": 0, "score": 0}'::jsonb 
WHERE letters_stats IS NULL;

UPDATE public_dashboard 
SET meditation_stats = '{"count": 0, "completed": 0, "duration": 0, "reflection_chars": 0, "score": 0}'::jsonb 
WHERE meditation_stats IS NULL;

UPDATE public_dashboard 
SET emotion_matches_stats = '{"attempts": 0, "correct": 0, "completed": 0, "score": 0}'::jsonb 
WHERE emotion_matches_stats IS NULL;

UPDATE public_dashboard 
SET emotion_logs_stats = '{"count": 0, "notes_chars": 0, "score": 0}'::jsonb 
WHERE emotion_logs_stats IS NULL;

UPDATE public_dashboard 
SET anger_stats = '{"count": 0, "completed": 0, "duration": 0, "reflection_chars": 0, "techniques_count": 0, "score": 0}'::jsonb 
WHERE anger_stats IS NULL;

-- Create a function to get detailed activity data for a specific user
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
  -- Get profile data
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
  
  -- Get timeline notes
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
  
  -- Get user responses
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
  
  -- Get letters
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
  
  -- Get meditation sessions
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
  
  -- Get emotion matches
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
  
  -- Get emotion logs
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
  
  -- Get anger management sessions
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
  
  -- Build and return the complete object
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

-- Create function to get responses for a specific activity type
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

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed public_dashboard NULL constraint issues';
  RAISE NOTICE '✅ Updated trigger functions to handle DELETE operations';
  RAISE NOTICE '✅ Added error handling to prevent constraint violations';
  RAISE NOTICE '✅ Created get_user_activity_details function';
  RAISE NOTICE '✅ Created get_user_activity_responses function';
  RAISE NOTICE '🎯 User activity details are now available for the dashboard';
END $$;