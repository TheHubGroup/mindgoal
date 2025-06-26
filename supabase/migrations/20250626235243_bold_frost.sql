/*
  # Create anger_management_sessions table

  1. New Table
    - `anger_management_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `video_id` (text, Vimeo video ID)
      - `video_title` (text, title of the video)
      - `started_at` (timestamp, when session started)
      - `completed_at` (timestamp, when session completed)
      - `watch_duration` (numeric, seconds watched)
      - `total_duration` (numeric, total video duration)
      - `completion_percentage` (integer, 0-100)
      - `reflection_text` (text, user's reflection)
      - `techniques_applied` (text[], array of selected techniques)
      - `skip_count` (integer, number of skips)
      - `last_position` (numeric, last watched position)
      - `view_count` (integer, number of times viewed)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `anger_management_sessions` table
    - Add policies for users to manage their own sessions

  3. Indexes
    - Index on user_id for better performance
    - Index on video_id for filtering
    - Unique index on (user_id, video_id) to prevent duplicates
*/

-- Create anger_management_sessions table
CREATE TABLE IF NOT EXISTS anger_management_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id text NOT NULL,
  video_title text NOT NULL,
  started_at timestamptz,
  completed_at timestamptz,
  watch_duration numeric NOT NULL DEFAULT 0, -- in seconds
  total_duration numeric NOT NULL DEFAULT 0, -- total video duration
  completion_percentage integer NOT NULL DEFAULT 0, -- percentage completed (0-100)
  reflection_text text, -- user's reflection after the session
  techniques_applied text[], -- array of selected techniques
  skip_count integer NOT NULL DEFAULT 0, -- number of times skipped forward
  last_position numeric NOT NULL DEFAULT 0, -- last watched position in seconds
  view_count integer NOT NULL DEFAULT 1, -- number of times viewed
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS anger_management_sessions_user_id_idx ON anger_management_sessions(user_id);
CREATE INDEX IF NOT EXISTS anger_management_sessions_video_id_idx ON anger_management_sessions(video_id);
CREATE INDEX IF NOT EXISTS anger_management_sessions_created_at_idx ON anger_management_sessions(created_at);
CREATE INDEX IF NOT EXISTS anger_management_sessions_completion_idx ON anger_management_sessions(completion_percentage);
CREATE INDEX IF NOT EXISTS anger_management_sessions_skip_count_idx ON anger_management_sessions(skip_count);
CREATE INDEX IF NOT EXISTS anger_management_sessions_view_count_idx ON anger_management_sessions(view_count);

-- Create unique index to prevent duplicates
CREATE UNIQUE INDEX anger_management_sessions_user_video_unique_idx 
ON anger_management_sessions(user_id, video_id);

-- Enable RLS
ALTER TABLE anger_management_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own anger management sessions" ON anger_management_sessions;
DROP POLICY IF EXISTS "Users can insert own anger management sessions" ON anger_management_sessions;
DROP POLICY IF EXISTS "Users can update own anger management sessions" ON anger_management_sessions;
DROP POLICY IF EXISTS "Users can delete own anger management sessions" ON anger_management_sessions;

-- Create RLS policies
CREATE POLICY "Users can view own anger management sessions" ON anger_management_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own anger management sessions" ON anger_management_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own anger management sessions" ON anger_management_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own anger management sessions" ON anger_management_sessions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION handle_anger_management_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_anger_management_sessions_updated_at ON anger_management_sessions;
CREATE TRIGGER handle_anger_management_sessions_updated_at
  BEFORE UPDATE ON anger_management_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_anger_management_sessions_updated_at();

-- Verification
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'anger_management_sessions') THEN
    RAISE NOTICE '✅ Tabla anger_management_sessions creada correctamente';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '✅ Índices creados para mejor rendimiento';
    RAISE NOTICE '🧘‍♀️ Lista para guardar sesiones de "Menú de la Ira"';
  ELSE
    RAISE NOTICE '❌ Error: Tabla anger_management_sessions no se creó';
  END IF;
END $$;