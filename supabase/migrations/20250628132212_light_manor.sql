/*
  # Create Public Dashboard Table with Automatic Updates
  
  This migration creates a comprehensive dashboard table that:
  1. Stores user activity data across all platform features
  2. Updates automatically when users interact with any activity
  3. Includes user profile information for easy reporting
  4. Calculates and stores scores for each activity type
  
  ## Table Structure:
  - user_id: Links to auth.users
  - profile_info: User profile details (JSON)
  - timeline_stats: Timeline activity statistics
  - responses_stats: "Cuéntame quien eres" statistics
  - letters_stats: "Carta a mí mismo" statistics
  - meditation_stats: Meditation activity statistics
  - emotion_matches_stats: "Nombra tus Emociones" statistics
  - emotion_logs_stats: "Calculadora de Emociones" statistics
  - anger_stats: "Menú de la Ira" statistics
  - total_score: Combined score across all activities
  - last_updated: Timestamp of last update
*/

-- Create the dashboard table
CREATE TABLE IF NOT EXISTS public_dashboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  profile_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  timeline_stats jsonb NOT NULL DEFAULT '{
    "count": 0,
    "chars": 0,
    "last_activity": null,
    "score": 0
  }'::jsonb,
  responses_stats jsonb NOT NULL DEFAULT '{
    "count": 0,
    "chars": 0,
    "last_activity": null,
    "score": 0
  }'::jsonb,
  letters_stats jsonb NOT NULL DEFAULT '{
    "count": 0,
    "chars": 0,
    "last_activity": null,
    "score": 0
  }'::jsonb,
  meditation_stats jsonb NOT NULL DEFAULT '{
    "count": 0,
    "completed": 0,
    "duration": 0,
    "reflection_chars": 0,
    "last_activity": null,
    "score": 0
  }'::jsonb,
  emotion_matches_stats jsonb NOT NULL DEFAULT '{
    "attempts": 0,
    "correct": 0,
    "completed": 0,
    "last_activity": null,
    "score": 0
  }'::jsonb,
  emotion_logs_stats jsonb NOT NULL DEFAULT '{
    "count": 0,
    "notes_chars": 0,
    "last_activity": null,
    "score": 0
  }'::jsonb,
  anger_stats jsonb NOT NULL DEFAULT '{
    "count": 0,
    "completed": 0,
    "duration": 0,
    "reflection_chars": 0,
    "techniques_count": 0,
    "last_activity": null,
    "score": 0
  }'::jsonb,
  total_score integer NOT NULL DEFAULT 0,
  level text NOT NULL DEFAULT 'Principiante',
  created_at timestamptz DEFAULT now(),
  last_updated timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS public_dashboard_user_id_idx ON public_dashboard(user_id);
CREATE INDEX IF NOT EXISTS public_dashboard_total_score_idx ON public_dashboard(total_score);
CREATE INDEX IF NOT EXISTS public_dashboard_level_idx ON public_dashboard(level);
CREATE INDEX IF NOT EXISTS public_dashboard_last_updated_idx ON public_dashboard(last_updated);

-- Enable RLS
ALTER TABLE public_dashboard ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public can view dashboard data" ON public_dashboard
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update own dashboard data" ON public_dashboard
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own dashboard data" ON public_dashboard
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to determine level based on score
CREATE OR REPLACE FUNCTION get_dashboard_level(score integer)
RETURNS text AS $$
BEGIN
  IF score >= 2000 THEN
    RETURN 'Maestro';
  ELSIF score >= 1000 THEN
    RETURN 'Experto';
  ELSIF score >= 500 THEN
    RETURN 'Avanzado';
  ELSIF score >= 200 THEN
    RETURN 'Intermedio';
  ELSE
    RETURN 'Principiante';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate and update dashboard data for a user
CREATE OR REPLACE FUNCTION update_dashboard_for_user(p_user_id uuid)
RETURNS void AS $$
DECLARE
  -- Profile variables
  v_profile_info jsonb;
  
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
  -- Get profile info
  SELECT 
    jsonb_build_object(
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
      'username', username,
      'created_at', created_at
    )
  INTO v_profile_info
  FROM profiles
  WHERE id = p_user_id;
  
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update all users' dashboard data
CREATE OR REPLACE FUNCTION update_all_dashboards()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    PERFORM update_dashboard_for_user(user_record.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically update dashboard when data changes
-- Timeline notes trigger
CREATE OR REPLACE FUNCTION trigger_update_dashboard_timeline()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_dashboard_for_user(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_dashboard_timeline ON timeline_notes;
CREATE TRIGGER update_dashboard_timeline
  AFTER INSERT OR UPDATE OR DELETE ON timeline_notes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_dashboard_timeline();

-- User responses trigger
CREATE OR REPLACE FUNCTION trigger_update_dashboard_responses()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_dashboard_for_user(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_dashboard_responses ON user_responses;
CREATE TRIGGER update_dashboard_responses
  AFTER INSERT OR UPDATE OR DELETE ON user_responses
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_dashboard_responses();

-- Letters trigger
CREATE OR REPLACE FUNCTION trigger_update_dashboard_letters()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_dashboard_for_user(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_dashboard_letters ON letters;
CREATE TRIGGER update_dashboard_letters
  AFTER INSERT OR UPDATE OR DELETE ON letters
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_dashboard_letters();

-- Meditation sessions trigger
CREATE OR REPLACE FUNCTION trigger_update_dashboard_meditation()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_dashboard_for_user(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_dashboard_meditation ON meditation_sessions;
CREATE TRIGGER update_dashboard_meditation
  AFTER INSERT OR UPDATE OR DELETE ON meditation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_dashboard_meditation();

-- Emotion matches trigger
CREATE OR REPLACE FUNCTION trigger_update_dashboard_emotion_matches()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_dashboard_for_user(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_dashboard_emotion_matches ON emotion_matches;
CREATE TRIGGER update_dashboard_emotion_matches
  AFTER INSERT OR UPDATE OR DELETE ON emotion_matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_dashboard_emotion_matches();

-- Emotion logs trigger
CREATE OR REPLACE FUNCTION trigger_update_dashboard_emotion_logs()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_dashboard_for_user(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_dashboard_emotion_logs ON user_emotion_log;
CREATE TRIGGER update_dashboard_emotion_logs
  AFTER INSERT OR UPDATE OR DELETE ON user_emotion_log
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_dashboard_emotion_logs();

-- Anger management sessions trigger
CREATE OR REPLACE FUNCTION trigger_update_dashboard_anger()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_dashboard_for_user(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_dashboard_anger ON anger_management_sessions;
CREATE TRIGGER update_dashboard_anger
  AFTER INSERT OR UPDATE OR DELETE ON anger_management_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_dashboard_anger();

-- Profiles trigger (to update profile_info)
CREATE OR REPLACE FUNCTION trigger_update_dashboard_profile()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_dashboard_for_user(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_dashboard_profile ON profiles;
CREATE TRIGGER update_dashboard_profile
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_dashboard_profile();

-- Initial population of dashboard data
SELECT update_all_dashboards();

-- Verification
DO $$
DECLARE
  dashboard_count integer;
BEGIN
  -- Count dashboard records
  SELECT COUNT(*) INTO dashboard_count FROM public_dashboard;
  
  RAISE NOTICE '✅ Public dashboard table created successfully';
  RAISE NOTICE '✅ Dashboard populated with % user records', dashboard_count;
  RAISE NOTICE '✅ Automatic update triggers created for all activity tables';
  RAISE NOTICE '✅ Dashboard includes comprehensive user activity data';
  RAISE NOTICE '🎯 Dashboard is ready for use with external visualization tools';
END $$;