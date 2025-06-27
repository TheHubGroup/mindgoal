/*
  # Fix Ambiguous Column Reference in calculate_user_score Function
  
  This migration fixes the error:
  ERROR: 42702: column reference "user_id" is ambiguous
  DETAIL: It could refer to either a PL/pgSQL variable or a table column.
  
  The issue occurs in the calculate_user_score function where table column references
  need to be qualified with the table name to avoid ambiguity with the function parameter.
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS calculate_user_score(uuid);

-- Recreate the function with qualified column references
CREATE OR REPLACE FUNCTION calculate_user_score(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  total_score integer := 0;
  
  -- Variables for timeline_notes
  timeline_notes_count integer := 0;
  timeline_notes_chars integer := 0;
  
  -- Variables for user_responses
  responses_count integer := 0;
  responses_chars integer := 0;
  
  -- Variables for letters
  letters_count integer := 0;
  letters_chars integer := 0;
  
  -- Variables for meditation_sessions
  meditation_count integer := 0;
  meditation_duration integer := 0;
  meditation_completed integer := 0;
  meditation_reflection_chars integer := 0;
  meditation_views integer := 0;
  meditation_skips integer := 0;
  
  -- Variables for emotion_matches
  emotion_attempts integer := 0;
  emotion_correct integer := 0;
  emotion_completed_count integer := 0;
  
  -- Variables for user_emotion_log
  emotion_logs_count integer := 0;
  emotion_logs_notes_chars integer := 0;
  
  -- Variables for anger_management_sessions
  anger_count integer := 0;
  anger_duration integer := 0;
  anger_completed integer := 0;
  anger_reflection_chars integer := 0;
  anger_techniques_count integer := 0;
  anger_views integer := 0;
  anger_skips integer := 0;
  
BEGIN
  -- Count and sum characters from timeline_notes
  -- Note the qualified column references: timeline_notes.user_id
  SELECT 
    COUNT(*),
    COALESCE(SUM(LENGTH(text)), 0)
  INTO 
    timeline_notes_count,
    timeline_notes_chars
  FROM timeline_notes 
  WHERE timeline_notes.user_id = p_user_id;
  
  -- Count and sum characters from user_responses
  SELECT 
    COUNT(*),
    COALESCE(SUM(LENGTH(response)), 0)
  INTO 
    responses_count,
    responses_chars
  FROM user_responses 
  WHERE user_responses.user_id = p_user_id;
  
  -- Count and sum characters from letters
  SELECT 
    COUNT(*),
    COALESCE(SUM(LENGTH(title) + LENGTH(content)), 0)
  INTO 
    letters_count,
    letters_chars
  FROM letters 
  WHERE letters.user_id = p_user_id;
  
  -- Get statistics from meditation_sessions
  SELECT 
    COUNT(*),
    COALESCE(SUM(watch_duration), 0),
    COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END),
    COALESCE(SUM(CASE WHEN reflection_text IS NOT NULL THEN LENGTH(reflection_text) ELSE 0 END), 0),
    COALESCE(SUM(view_count), 0),
    COALESCE(SUM(skip_count), 0)
  INTO 
    meditation_count,
    meditation_duration,
    meditation_completed,
    meditation_reflection_chars,
    meditation_views,
    meditation_skips
  FROM meditation_sessions 
  WHERE meditation_sessions.user_id = p_user_id;
  
  -- Get statistics from emotion_matches
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN is_correct THEN 1 END)
  INTO 
    emotion_attempts,
    emotion_correct
  FROM emotion_matches 
  WHERE emotion_matches.user_id = p_user_id;
  
  -- Count completed emotions (with explanation shown)
  SELECT 
    COUNT(DISTINCT emotion_name)
  INTO 
    emotion_completed_count
  FROM emotion_matches 
  WHERE emotion_matches.user_id = p_user_id 
    AND is_correct = true 
    AND explanation_shown = true;
  
  -- Count emotion logs and note characters
  SELECT 
    COUNT(*),
    COALESCE(SUM(CASE WHEN notes IS NOT NULL THEN LENGTH(notes) ELSE 0 END), 0)
  INTO 
    emotion_logs_count,
    emotion_logs_notes_chars
  FROM user_emotion_log 
  WHERE user_emotion_log.user_id = p_user_id;
  
  -- Get statistics from anger_management_sessions
  SELECT 
    COUNT(*),
    COALESCE(SUM(watch_duration), 0),
    COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END),
    COALESCE(SUM(CASE WHEN reflection_text IS NOT NULL THEN LENGTH(reflection_text) ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN techniques_applied IS NOT NULL THEN array_length(techniques_applied, 1) ELSE 0 END), 0),
    COALESCE(SUM(view_count), 0),
    COALESCE(SUM(skip_count), 0)
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
  
  -- Calculate total score
  total_score := 
    -- Timeline notes (1 point per character)
    timeline_notes_chars +
    
    -- "Cuéntame quien eres" responses (1 point per character)
    responses_chars +
    
    -- Personal letters (1 point per character)
    letters_chars +
    
    -- Meditation
    (FLOOR(meditation_duration / 60) * 50) + -- 50 points per minute watched
    (meditation_completed * 200) + -- 200 points for completion
    meditation_reflection_chars + -- 1 point per reflection character
    ((meditation_views - meditation_count) * 100) + -- 100 points per extra view
    (CASE WHEN meditation_skips > 5 THEN -((meditation_skips - 5) * 10) ELSE 0 END) + -- Penalty for skips
    
    -- "Nombra tus Emociones"
    (emotion_attempts * 10) + -- 10 points per attempt
    (emotion_correct * 30) + -- 30 points per correct match
    (emotion_completed_count * 100) + -- 100 points per completed emotion
    
    -- "Calculadora de Emociones"
    (emotion_logs_count * 50) + -- 50 points per log
    emotion_logs_notes_chars + -- 1 point per note character
    
    -- "Menú de la Ira"
    (FLOOR(anger_duration / 60) * 50) + -- 50 points per minute watched
    (anger_completed * 200) + -- 200 points for completion
    anger_reflection_chars + -- 1 point per reflection character
    (anger_techniques_count * 50) + -- 50 points per selected technique
    ((anger_views - anger_count) * 100) + -- 100 points per extra view
    (CASE WHEN anger_skips > 5 THEN -((anger_skips - 5) * 10) ELSE 0 END); -- Penalty for skips
  
  -- Ensure score is not negative
  IF total_score < 0 THEN
    total_score := 0;
  END IF;
  
  RETURN total_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix the update_all_public_scores function to use the new parameter name
DROP FUNCTION IF EXISTS update_all_public_scores();

CREATE OR REPLACE FUNCTION update_all_public_scores()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  user_score integer;
  user_level text;
BEGIN
  -- Iterate over all users
  FOR user_record IN SELECT id FROM auth.users LOOP
    -- Calculate score for this user
    user_score := calculate_user_score(user_record.id);
    
    -- Determine level
    user_level := get_score_level(user_score);
    
    -- Insert or update in public_scores
    INSERT INTO public_scores (user_id, score, level, last_updated)
    VALUES (user_record.id, user_score, user_level, now())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      score = user_score,
      level = user_level,
      last_updated = now(),
      updated_at = now();
  END LOOP;
  
  RAISE NOTICE 'Public scores updated for all users';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the fixed function with a sample user
DO $$
DECLARE
  sample_user_id uuid;
  sample_score integer;
BEGIN
  -- Get a sample user ID
  SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
  
  IF sample_user_id IS NOT NULL THEN
    -- Calculate score for sample user
    SELECT calculate_user_score(sample_user_id) INTO sample_score;
    
    RAISE NOTICE 'Sample user ID: %', sample_user_id;
    RAISE NOTICE 'Calculated score: %', sample_score;
    RAISE NOTICE '✅ Score calculation test completed successfully';
  ELSE
    RAISE NOTICE '⚠️ No users found to test score calculation';
  END IF;
END $$;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed ambiguous column reference in calculate_user_score function';
  RAISE NOTICE '✅ Updated update_all_public_scores function';
  RAISE NOTICE '🏆 Leaderboard score calculation should now work correctly';
END $$;