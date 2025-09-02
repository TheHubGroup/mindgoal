/*
  # Create tables for "Cumplir mi Sueño" activity

  1. New Tables
    - `cumplir_sueno_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `dream_title` (text, title of the dream)
      - `dream_description` (text, detailed description of the dream)
      - `ai_roadmap` (text, AI-generated roadmap)
      - `ai_generated_image_url` (text, URL of AI-generated image)
      - `completed_at` (timestamp, when session was completed)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `cumplir_sueno_steps`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to cumplir_sueno_sessions)
      - `step_number` (integer, order of the step)
      - `step_title` (text, title of the step)
      - `step_description` (text, detailed description)
      - `estimated_time` (text, estimated time to complete)
      - `resources` (text[], array of recommended resources)
      - `is_completed` (boolean, if user marked as completed)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own data

  3. Indexes
    - Index on user_id for better performance
    - Index on session_id for joining tables
*/

-- Create cumplir_sueno_sessions table
CREATE TABLE IF NOT EXISTS cumplir_sueno_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  dream_title text NOT NULL,
  dream_description text NOT NULL,
  ai_roadmap text,
  ai_generated_image_url text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create cumplir_sueno_steps table
CREATE TABLE IF NOT EXISTS cumplir_sueno_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES cumplir_sueno_sessions(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  step_title text NOT NULL,
  step_description text NOT NULL,
  estimated_time text,
  resources text[] DEFAULT '{}',
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS cumplir_sueno_sessions_user_id_idx ON cumplir_sueno_sessions(user_id);
CREATE INDEX IF NOT EXISTS cumplir_sueno_sessions_created_at_idx ON cumplir_sueno_sessions(created_at);

CREATE INDEX IF NOT EXISTS cumplir_sueno_steps_session_id_idx ON cumplir_sueno_steps(session_id);
CREATE INDEX IF NOT EXISTS cumplir_sueno_steps_step_number_idx ON cumplir_sueno_steps(step_number);

-- Enable RLS
ALTER TABLE cumplir_sueno_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cumplir_sueno_steps ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sessions
CREATE POLICY "Users can view own cumplir sueno sessions" ON cumplir_sueno_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cumplir sueno sessions" ON cumplir_sueno_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cumplir sueno sessions" ON cumplir_sueno_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cumplir sueno sessions" ON cumplir_sueno_sessions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for steps
CREATE POLICY "Users can view own cumplir sueno steps" ON cumplir_sueno_steps
  FOR SELECT TO authenticated
  USING (auth.uid() = (SELECT user_id FROM cumplir_sueno_sessions WHERE id = session_id));

CREATE POLICY "Users can insert own cumplir sueno steps" ON cumplir_sueno_steps
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = (SELECT user_id FROM cumplir_sueno_sessions WHERE id = session_id));

CREATE POLICY "Users can update own cumplir sueno steps" ON cumplir_sueno_steps
  FOR UPDATE TO authenticated
  USING (auth.uid() = (SELECT user_id FROM cumplir_sueno_sessions WHERE id = session_id))
  WITH CHECK (auth.uid() = (SELECT user_id FROM cumplir_sueno_sessions WHERE id = session_id));

CREATE POLICY "Users can delete own cumplir sueno steps" ON cumplir_sueno_steps
  FOR DELETE TO authenticated
  USING (auth.uid() = (SELECT user_id FROM cumplir_sueno_sessions WHERE id = session_id));

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION handle_cumplir_sueno_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_cumplir_sueno_steps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_cumplir_sueno_sessions_updated_at ON cumplir_sueno_sessions;
CREATE TRIGGER handle_cumplir_sueno_sessions_updated_at
  BEFORE UPDATE ON cumplir_sueno_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_cumplir_sueno_sessions_updated_at();

DROP TRIGGER IF EXISTS handle_cumplir_sueno_steps_updated_at ON cumplir_sueno_steps;
CREATE TRIGGER handle_cumplir_sueno_steps_updated_at
  BEFORE UPDATE ON cumplir_sueno_steps
  FOR EACH ROW
  EXECUTE FUNCTION handle_cumplir_sueno_steps_updated_at();

-- Verification
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cumplir_sueno_sessions') THEN
    RAISE NOTICE '✅ Tabla cumplir_sueno_sessions creada correctamente';
  ELSE
    RAISE NOTICE '❌ Error: Tabla cumplir_sueno_sessions no se creó';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cumplir_sueno_steps') THEN
    RAISE NOTICE '✅ Tabla cumplir_sueno_steps creada correctamente';
  ELSE
    RAISE NOTICE '❌ Error: Tabla cumplir_sueno_steps no se creó';
  END IF;

  RAISE NOTICE '✅ Políticas RLS configuradas';
  RAISE NOTICE '✅ Índices creados para mejor rendimiento';
  RAISE NOTICE '🌟 Sistema "Cumplir mi Sueño" listo para usar';
END $$;