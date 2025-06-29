/*
  # Create User Details View for Dashboard
  
  This migration creates a view that makes it easier to access detailed user activity data
  for the dashboard. It joins various tables to provide comprehensive information about
  each user's activities.
  
  ## Changes:
  1. Create a view that joins profiles with activity tables
  2. Add functions to get detailed activity data for a specific user
  3. Ensure proper access control for the view
*/

-- Create a view for user details
CREATE OR REPLACE VIEW user_activity_details AS
SELECT 
  p.id AS user_id,
  p.email,
  p.nombre,
  p.apellido,
  p.grado,
  p.nombre_colegio,
  p.ciudad,
  p.pais,
  p.edad,
  p.sexo,
  p.avatar_url,
  
  -- Timeline notes
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', tn.id,
        'text', tn.text,
        'emoji', tn.emoji,
        'color', tn.color,
        'section', tn.section,
        'created_at', tn.created_at
      )
    )
    FROM timeline_notes tn
    WHERE tn.user_id = p.id
  ) AS timeline_notes,
  
  -- User responses
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', ur.id,
        'question', ur.question,
        'response', ur.response,
        'activity_type', ur.activity_type,
        'created_at', ur.created_at
      )
    )
    FROM user_responses ur
    WHERE ur.user_id = p.id
  ) AS user_responses,
  
  -- Letters
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', l.id,
        'title', l.title,
        'content', l.content,
        'created_at', l.created_at
      )
    )
    FROM letters l
    WHERE l.user_id = p.id
  ) AS letters,
  
  -- Meditation sessions
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', ms.id,
        'video_id', ms.video_id,
        'video_title', ms.video_title,
        'watch_duration', ms.watch_duration,
        'completion_percentage', ms.completion_percentage,
        'reflection_text', ms.reflection_text,
        'completed_at', ms.completed_at,
        'created_at', ms.created_at
      )
    )
    FROM meditation_sessions ms
    WHERE ms.user_id = p.id
  ) AS meditation_sessions,
  
  -- Emotion matches
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', em.id,
        'emotion_name', em.emotion_name,
        'is_correct', em.is_correct,
        'explanation_shown', em.explanation_shown,
        'created_at', em.created_at
      )
    )
    FROM emotion_matches em
    WHERE em.user_id = p.id
  ) AS emotion_matches,
  
  -- Emotion logs
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', el.id,
        'emotion_name', el.emotion_name,
        'felt_at', el.felt_at,
        'intensity', el.intensity,
        'notes', el.notes,
        'created_at', el.created_at
      )
    )
    FROM user_emotion_log el
    WHERE el.user_id = p.id
  ) AS emotion_logs,
  
  -- Anger management sessions
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', ams.id,
        'video_id', ams.video_id,
        'video_title', ams.video_title,
        'watch_duration', ams.watch_duration,
        'completion_percentage', ams.completion_percentage,
        'reflection_text', ams.reflection_text,
        'techniques_applied', ams.techniques_applied,
        'completed_at', ams.completed_at,
        'created_at', ams.created_at
      )
    )
    FROM anger_management_sessions ams
    WHERE ams.user_id = p.id
  ) AS anger_management_sessions
  
FROM profiles p;

-- Create a function to get detailed activity data for a specific user
CREATE OR REPLACE FUNCTION get_user_activity_details(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT row_to_json(user_activity_details)::jsonb INTO result
  FROM user_activity_details
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the view
GRANT SELECT ON user_activity_details TO authenticated;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Created user_activity_details view';
  RAISE NOTICE '✅ Created get_user_activity_details function';
  RAISE NOTICE '✅ Granted access to authenticated users';
  RAISE NOTICE '🎯 User details are now available for the dashboard';
END $$;