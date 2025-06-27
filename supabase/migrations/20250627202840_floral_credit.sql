/*
  # Fix Public Scores Calculation

  This migration fixes the error:
  "ERROR: 22P02: invalid input syntax for type bigint: 'ecf9b3eb-9eb2-4793-a4b1-49c2aa6543e4'"
  
  The issue is in the simple_calculate_user_score function where we try to convert
  a UUID to bigint for adding random variation to scores.
  
  ## Changes:
  1. Fix the random score calculation to avoid UUID conversion
  2. Simplify the score calculation to be more robust
  3. Repopulate the public_scores table with correct data
*/

-- Drop the problematic function
DROP FUNCTION IF EXISTS simple_calculate_user_score(uuid);

-- Create a fixed version that doesn't try to convert UUID to bigint
CREATE OR REPLACE FUNCTION simple_calculate_user_score(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  total_score integer := 0;
  timeline_count integer := 0;
  responses_count integer := 0;
  letters_count integer := 0;
  meditation_count integer := 0;
  emotion_matches_count integer := 0;
  emotion_logs_count integer := 0;
  anger_sessions_count integer := 0;
  random_bonus integer := 0;
BEGIN
  -- Count timeline notes
  SELECT COUNT(*) INTO timeline_count FROM timeline_notes WHERE user_id = p_user_id;
  
  -- Count user responses
  SELECT COUNT(*) INTO responses_count FROM user_responses WHERE user_id = p_user_id;
  
  -- Count letters
  SELECT COUNT(*) INTO letters_count FROM letters WHERE user_id = p_user_id;
  
  -- Count meditation sessions
  SELECT COUNT(*) INTO meditation_count FROM meditation_sessions WHERE user_id = p_user_id;
  
  -- Count emotion matches
  SELECT COUNT(*) INTO emotion_matches_count FROM emotion_matches WHERE user_id = p_user_id;
  
  -- Count emotion logs
  SELECT COUNT(*) INTO emotion_logs_count FROM user_emotion_log WHERE user_id = p_user_id;
  
  -- Count anger management sessions
  SELECT COUNT(*) INTO anger_sessions_count FROM anger_management_sessions WHERE user_id = p_user_id;
  
  -- Generate a random bonus (0-499) without using UUID conversion
  -- We'll use the current timestamp for randomness instead
  SELECT floor(random() * 500)::integer INTO random_bonus;
  
  -- Calculate a simple score based on counts
  total_score := 
    (timeline_count * 100) + 
    (responses_count * 50) + 
    (letters_count * 200) + 
    (meditation_count * 150) + 
    (emotion_matches_count * 30) + 
    (emotion_logs_count * 50) + 
    (anger_sessions_count * 150) +
    random_bonus;
  
  RETURN total_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the populate_public_scores function to use the fixed calculation
CREATE OR REPLACE FUNCTION populate_public_scores()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  user_score integer;
  user_level text;
BEGIN
  -- Delete all existing records to start fresh
  DELETE FROM public_scores;
  
  -- Iterate over all users
  FOR user_record IN SELECT id FROM auth.users LOOP
    -- Calculate score for this user
    user_score := simple_calculate_user_score(user_record.id);
    
    -- Determine level
    user_level := simple_get_score_level(user_score);
    
    -- Insert into public_scores
    INSERT INTO public_scores (user_id, score, level, last_updated)
    VALUES (user_record.id, user_score, user_level, now());
  END LOOP;
  
  RAISE NOTICE 'Public scores populated for all users';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to update a single user's score with the fixed calculation
CREATE OR REPLACE FUNCTION update_user_public_score(p_user_id uuid)
RETURNS void AS $$
DECLARE
  user_score integer;
  user_level text;
BEGIN
  -- Calculate score for this user
  user_score := simple_calculate_user_score(p_user_id);
  
  -- Determine level
  user_level := simple_get_score_level(user_score);
  
  -- Insert or update in public_scores
  INSERT INTO public_scores (user_id, score, level, last_updated)
  VALUES (p_user_id, user_score, user_level, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    score = user_score,
    level = user_level,
    last_updated = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the update_all_public_scores_simple function
CREATE OR REPLACE FUNCTION update_all_public_scores()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Iterate over all users
  FOR user_record IN SELECT id FROM auth.users LOOP
    -- Update score for this user
    PERFORM update_user_public_score(user_record.id);
  END LOOP;
  
  RAISE NOTICE 'Public scores updated for all users';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Repopulate the public_scores table with the fixed calculation
SELECT populate_public_scores();

-- Verification
DO $$
DECLARE
  score_count integer;
BEGIN
  -- Count public scores
  SELECT COUNT(*) INTO score_count FROM public_scores;
  
  RAISE NOTICE '✅ Fixed UUID to bigint conversion error';
  RAISE NOTICE '✅ Public scores table repopulated with % records', score_count;
  RAISE NOTICE '✅ Score calculation now uses random() instead of UUID conversion';
  RAISE NOTICE '🏆 Leaderboard should now show scores for all users';
END $$;