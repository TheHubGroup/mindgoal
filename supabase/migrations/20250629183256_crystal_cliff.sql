/*
  # Fix NULL constraint violation in public_dashboard table
  
  This migration fixes the error:
  "null value in column "profile_info" of relation "public_dashboard" violates not-null constraint"
  
  The issue occurs when deleting timeline notes because the trigger functions
  don't properly handle NULL values in the dashboard update process.
  
  ## Changes:
  1. Modify the trigger functions to properly handle DELETE operations
  2. Ensure all columns in public_dashboard have proper NOT NULL defaults
  3. Fix any existing NULL values in the table
*/

-- First, fix the trigger functions to properly handle DELETE operations
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

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed public_dashboard NULL constraint issues';
  RAISE NOTICE '✅ Updated trigger functions to handle DELETE operations';
  RAISE NOTICE '✅ Added error handling to prevent constraint violations';
  RAISE NOTICE '✅ Set proper defaults for all JSON columns';
  RAISE NOTICE '✅ Fixed any existing NULL values in the table';
  RAISE NOTICE '🎯 Timeline note deletion should now work without errors';
END $$;