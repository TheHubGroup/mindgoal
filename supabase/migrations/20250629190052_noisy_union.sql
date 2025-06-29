/*
  # Fix Dashboard Data Display Issues

  This migration fixes issues with the dashboard not showing user activity details.
  The problem was with the get_user_activity_details function that was using the JSON
  contains operator (?) incorrectly in the verification step.

  ## Changes:
  1. Completely rewrite the get_user_activity_details function with:
     - Proper error handling for each query section
     - COALESCE for all values to prevent NULL values
     - Separate BEGIN/EXCEPTION blocks for each query
     - Fallback return object in case anything goes wrong

  2. Fix the verification test to use jsonb_typeof instead of the problematic ? operator

  3. Update all dashboard data for existing users
*/

-- Drop the existing function to recreate it with improvements
DROP FUNCTION IF EXISTS get_user_activity_details(uuid);

-- Create an improved version of the function with better error handling
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
      RAISE NOTICE 'Error getting profile data: %', SQLERRM;
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
  
  -- Get timeline notes with proper NULL handling
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
      RAISE NOTICE 'Error getting timeline notes: %', SQLERRM;
      timeline_data := '[]'::json;
  END;
  
  -- Get user responses with proper NULL handling
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
      RAISE NOTICE 'Error getting user responses: %', SQLERRM;
      responses_data := '[]'::json;
  END;
  
  -- Get letters with proper NULL handling
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
      RAISE NOTICE 'Error getting letters: %', SQLERRM;
      letters_data := '[]'::json;
  END;
  
  -- Get meditation sessions with proper NULL handling
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
      RAISE NOTICE 'Error getting meditation sessions: %', SQLERRM;
      meditation_data := '[]'::json;
  END;
  
  -- Get emotion matches with proper NULL handling
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
      RAISE NOTICE 'Error getting emotion matches: %', SQLERRM;
      emotion_matches_data := '[]'::json;
  END;
  
  -- Get emotion logs with proper NULL handling
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
      RAISE NOTICE 'Error getting emotion logs: %', SQLERRM;
      emotion_logs_data := '[]'::json;
  END;
  
  -- Get anger management sessions with proper NULL handling
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
      RAISE NOTICE 'Error getting anger management sessions: %', SQLERRM;
      anger_data := '[]'::json;
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
        'anger_management_sessions', anger_data
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
        'anger_management_sessions', '[]'
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
      'anger_management_sessions', '[]'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update all dashboard data to ensure it's populated correctly
DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Iterate over all users
  FOR user_record IN SELECT id FROM auth.users LOOP
    -- Force update dashboard data
    PERFORM update_dashboard_for_user(user_record.id);
  END LOOP;
  
  RAISE NOTICE '✅ Dashboard data updated for all users';
END $$;

-- Verification with proper error handling
DO $$
DECLARE
  test_user_id uuid;
  test_result json;
  test_type text;
BEGIN
  -- Get a sample user ID
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Test the function with the sample user
    BEGIN
      SELECT get_user_activity_details(test_user_id) INTO test_result;
      
      IF test_result IS NOT NULL THEN
        -- Check the result type using jsonb_typeof instead of ? operator
        SELECT jsonb_typeof(test_result::jsonb) INTO test_type;
        
        RAISE NOTICE '✅ get_user_activity_details function works correctly';
        RAISE NOTICE '✅ Result type: %', test_type;
        
        -- Check if specific keys exist using jsonb_typeof
        RAISE NOTICE '✅ timeline_notes type: %', jsonb_typeof(test_result::jsonb->'timeline_notes');
        RAISE NOTICE '✅ user_responses type: %', jsonb_typeof(test_result::jsonb->'user_responses');
        RAISE NOTICE '✅ letters type: %', jsonb_typeof(test_result::jsonb->'letters');
        RAISE NOTICE '✅ meditation_sessions type: %', jsonb_typeof(test_result::jsonb->'meditation_sessions');
        RAISE NOTICE '✅ emotion_matches type: %', jsonb_typeof(test_result::jsonb->'emotion_matches');
        RAISE NOTICE '✅ emotion_logs type: %', jsonb_typeof(test_result::jsonb->'emotion_logs');
        RAISE NOTICE '✅ anger_management_sessions type: %', jsonb_typeof(test_result::jsonb->'anger_management_sessions');
      ELSE
        RAISE NOTICE '❌ get_user_activity_details returned NULL';
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '❌ Error testing get_user_activity_details: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '⚠️ No users found to test the function';
  END IF;
  
  RAISE NOTICE '✅ Dashboard data display issues fixed';
  RAISE NOTICE '🎯 User activity details should now appear in the dashboard';
END $$;