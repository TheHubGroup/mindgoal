/*
  # Fix Emotion Statistics View and Functions
  
  This migration corrects column names in the emotion_statistics view to match
  the actual structure of the profiles table in the database.
  
  ## Changes:
  - Uses proper column names (first_name, last_name, etc.) instead of Spanish names
  - Maintains all the same functionality as the previous version
*/

-- Create a view for emotion statistics analysis with correct column names
CREATE OR REPLACE VIEW emotion_statistics AS
SELECT 
  u.id AS user_id,
  p.first_name,
  p.last_name,
  p.email,
  p.grade,
  p.age,
  p.gender,
  p.school_name,
  p.city,
  p.country,
  el.emotion_name,
  COUNT(el.id) AS emotion_count,
  COALESCE(AVG(el.intensity), 0) AS avg_intensity,
  MIN(el.felt_at) AS first_felt_at,
  MAX(el.felt_at) AS last_felt_at
FROM 
  auth.users u
  JOIN profiles p ON u.id = p.id
  LEFT JOIN user_emotion_log el ON u.id = el.user_id
WHERE
  el.emotion_name IS NOT NULL
GROUP BY 
  u.id, p.first_name, p.last_name, p.email, p.grade, p.age, p.gender, p.school_name, p.city, p.country, el.emotion_name;

-- Create a function to find users with most occurrences of a specific emotion
CREATE OR REPLACE FUNCTION find_users_by_emotion(
  emotion_name_param text,
  min_occurrences integer DEFAULT 1
)
RETURNS TABLE (
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  emotion_count bigint,
  avg_intensity numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    es.user_id,
    es.first_name,
    es.last_name,
    es.email,
    es.emotion_count,
    es.avg_intensity
  FROM 
    emotion_statistics es
  WHERE 
    es.emotion_name = emotion_name_param
    AND es.emotion_count >= min_occurrences
  ORDER BY 
    es.emotion_count DESC, es.avg_intensity DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to find the most common emotion for each user
CREATE OR REPLACE FUNCTION get_users_top_emotions(limit_param integer DEFAULT 100)
RETURNS TABLE (
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  top_emotion text,
  emotion_count bigint,
  avg_intensity numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_emotions AS (
    SELECT 
      es.user_id,
      es.first_name,
      es.last_name,
      es.email,
      es.emotion_name,
      es.emotion_count,
      es.avg_intensity,
      ROW_NUMBER() OVER (PARTITION BY es.user_id ORDER BY es.emotion_count DESC, es.avg_intensity DESC) as rank
    FROM 
      emotion_statistics es
  )
  SELECT 
    re.user_id,
    re.first_name,
    re.last_name,
    re.email,
    re.emotion_name AS top_emotion,
    re.emotion_count,
    re.avg_intensity
  FROM 
    ranked_emotions re
  WHERE 
    re.rank = 1
  ORDER BY 
    re.emotion_count DESC, re.avg_intensity DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to analyze emotion trends by time period
CREATE OR REPLACE FUNCTION analyze_emotion_trends(
  period_type text DEFAULT 'month', -- 'day', 'week', 'month', 'year'
  start_date timestamptz DEFAULT NULL,
  end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
  period text,
  emotion_name text,
  emotion_count bigint,
  avg_intensity numeric,
  user_count bigint
) AS $$
DECLARE
  date_format text;
BEGIN
  -- Set default dates if not provided
  IF start_date IS NULL THEN
    start_date := NOW() - INTERVAL '1 year';
  END IF;
  
  IF end_date IS NULL THEN
    end_date := NOW();
  END IF;
  
  -- Set date format based on period type
  CASE period_type
    WHEN 'day' THEN date_format := 'YYYY-MM-DD';
    WHEN 'week' THEN date_format := 'IYYY-IW';
    WHEN 'month' THEN date_format := 'YYYY-MM';
    WHEN 'year' THEN date_format := 'YYYY';
    ELSE date_format := 'YYYY-MM';
  END CASE;
  
  RETURN QUERY
  SELECT 
    TO_CHAR(el.felt_at, date_format) AS period,
    el.emotion_name,
    COUNT(el.id) AS emotion_count,
    COALESCE(AVG(el.intensity), 0) AS avg_intensity,
    COUNT(DISTINCT el.user_id) AS user_count
  FROM 
    user_emotion_log el
  WHERE 
    el.felt_at BETWEEN start_date AND end_date
  GROUP BY 
    period, el.emotion_name
  ORDER BY 
    period, emotion_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to find users by emotion pattern over time
CREATE OR REPLACE FUNCTION find_users_by_emotion_pattern(
  emotion_name_param text,
  min_frequency integer DEFAULT 3,
  time_period interval DEFAULT '30 days'
)
RETURNS TABLE (
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  emotion_count bigint,
  frequency_per_week numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH user_emotion_stats AS (
    SELECT 
      p.id AS user_id,
      p.first_name,
      p.last_name,
      p.email,
      COUNT(el.id) AS emotion_count,
      COUNT(el.id)::numeric / (EXTRACT(EPOCH FROM time_period) / 604800) AS frequency_per_week
    FROM 
      profiles p
      JOIN user_emotion_log el ON p.id = el.user_id
    WHERE 
      el.emotion_name = emotion_name_param
      AND el.felt_at > NOW() - time_period
    GROUP BY 
      p.id, p.first_name, p.last_name, p.email
  )
  SELECT 
    ues.user_id,
    ues.first_name,
    ues.last_name,
    ues.email,
    ues.emotion_count,
    ues.frequency_per_week
  FROM 
    user_emotion_stats ues
  WHERE 
    ues.emotion_count >= min_frequency
  ORDER BY 
    ues.frequency_per_week DESC, ues.emotion_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Emotion statistics view created with correct column names';
  RAISE NOTICE '✅ User emotion analysis functions updated';
  RAISE NOTICE '🔍 Now you can filter users by emotion patterns';
END $$;