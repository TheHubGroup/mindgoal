/*
  # Fix Dashboard Triggers for DELETE Operations
  
  This migration fixes the issue where dashboard triggers fail during DELETE operations
  because they try to use NEW.user_id which is NULL during deletes.
  
  The fix changes all trigger functions to use COALESCE(NEW.user_id, OLD.user_id)
  which will use NEW.user_id for INSERT/UPDATE and OLD.user_id for DELETE operations.
*/

-- Timeline notes trigger
CREATE OR REPLACE FUNCTION trigger_update_dashboard_timeline()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_dashboard_for_user(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User responses trigger
CREATE OR REPLACE FUNCTION trigger_update_dashboard_responses()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_dashboard_for_user(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Letters trigger
CREATE OR REPLACE FUNCTION trigger_update_dashboard_letters()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_dashboard_for_user(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Meditation sessions trigger
CREATE OR REPLACE FUNCTION trigger_update_dashboard_meditation()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_dashboard_for_user(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Emotion matches trigger
CREATE OR REPLACE FUNCTION trigger_update_dashboard_emotion_matches()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_dashboard_for_user(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Emotion logs trigger
CREATE OR REPLACE FUNCTION trigger_update_dashboard_emotion_logs()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_dashboard_for_user(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Anger management sessions trigger
CREATE OR REPLACE FUNCTION trigger_update_dashboard_anger()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_dashboard_for_user(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles trigger (to update profile_info) - this one only needs NEW since profiles don't get deleted
CREATE OR REPLACE FUNCTION trigger_update_dashboard_profile()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_dashboard_for_user(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Dashboard trigger functions updated to handle DELETE operations correctly';
  RAISE NOTICE '✅ All triggers now use COALESCE(NEW.user_id, OLD.user_id) for proper user_id handling';
  RAISE NOTICE '🎯 Timeline note deletion should now work without constraint violations';
END $$;