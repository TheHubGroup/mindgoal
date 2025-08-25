/*
  # Create tables for "Problema Resuelto" activity

  1. New Tables
    - `problema_resuelto_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `completed_at` (timestamp, when session was completed)
      - `total_problems` (integer, total number of problems)
      - `completed_problems` (integer, number of completed problems)
      - `resilient_responses` (integer, number of resilient responses)
      - `impulsive_responses` (integer, number of impulsive responses)
      - `resilience_score` (numeric, calculated resilience percentage)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `problema_resuelto_responses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `session_id` (uuid, foreign key to problema_resuelto_sessions)
      - `problem_id` (text, identifier for the problem)
      - `problem_title` (text, title of the problem)
      - `problem_type` (text, 'conflicto_otros' or 'conflicto_personal')
      - `user_choice` (text, 'resiliente' or 'impulsiva')
      - `is_resilient` (boolean, true if choice was resilient)
      - `feedback_shown` (boolean, if feedback was displayed)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own data

  3. Indexes
    - Index on user_id for better performance
    - Index on session_id for joining tables
*/

-- Create problema_resuelto_sessions table
CREATE TABLE IF NOT EXISTS problema_resuelto_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at timestamptz,
  total_problems integer NOT NULL DEFAULT 4,
  completed_problems integer NOT NULL DEFAULT 0,
  resilient_responses integer NOT NULL DEFAULT 0,
  impulsive_responses integer NOT NULL DEFAULT 0,
  resilience_score numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create problema_resuelto_responses table
CREATE TABLE IF NOT EXISTS problema_resuelto_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES problema_resuelto_sessions(id) ON DELETE CASCADE,
  problem_id text NOT NULL,
  problem_title text NOT NULL,
  problem_type text NOT NULL CHECK (problem_type IN ('conflicto_otros', 'conflicto_personal')),
  user_choice text NOT NULL CHECK (user_choice IN ('resiliente', 'impulsiva')),
  is_resilient boolean NOT NULL,
  feedback_shown boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS problema_resuelto_sessions_user_id_idx ON problema_resuelto_sessions(user_id);
CREATE INDEX IF NOT EXISTS problema_resuelto_sessions_created_at_idx ON problema_resuelto_sessions(created_at);

CREATE INDEX IF NOT EXISTS problema_resuelto_responses_user_id_idx ON problema_resuelto_responses(user_id);
CREATE INDEX IF NOT EXISTS problema_resuelto_responses_session_id_idx ON problema_resuelto_responses(session_id);
CREATE INDEX IF NOT EXISTS problema_resuelto_responses_problem_id_idx ON problema_resuelto_responses(problem_id);

-- Enable RLS
ALTER TABLE problema_resuelto_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE problema_resuelto_responses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sessions
CREATE POLICY "Users can view own problema resuelto sessions" ON problema_resuelto_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own problema resuelto sessions" ON problema_resuelto_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own problema resuelto sessions" ON problema_resuelto_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own problema resuelto sessions" ON problema_resuelto_sessions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for responses
CREATE POLICY "Users can view own problema resuelto responses" ON problema_resuelto_responses
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own problema resuelto responses" ON problema_resuelto_responses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own problema resuelto responses" ON problema_resuelto_responses
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own problema resuelto responses" ON problema_resuelto_responses
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION handle_problema_resuelto_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_problema_resuelto_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_problema_resuelto_sessions_updated_at ON problema_resuelto_sessions;
CREATE TRIGGER handle_problema_resuelto_sessions_updated_at
  BEFORE UPDATE ON problema_resuelto_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_problema_resuelto_sessions_updated_at();

DROP TRIGGER IF EXISTS handle_problema_resuelto_responses_updated_at ON problema_resuelto_responses;
CREATE TRIGGER handle_problema_resuelto_responses_updated_at
  BEFORE UPDATE ON problema_resuelto_responses
  FOR EACH ROW
  EXECUTE FUNCTION handle_problema_resuelto_responses_updated_at();

-- Verification
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'problema_resuelto_sessions') THEN
    RAISE NOTICE '✅ Tabla problema_resuelto_sessions creada correctamente';
  ELSE
    RAISE NOTICE '❌ Error: Tabla problema_resuelto_sessions no se creó';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'problema_resuelto_responses') THEN
    RAISE NOTICE '✅ Tabla problema_resuelto_responses creada correctamente';
  ELSE
    RAISE NOTICE '❌ Error: Tabla problema_resuelto_responses no se creó';
  END IF;

  RAISE NOTICE '✅ Políticas RLS configuradas';
  RAISE NOTICE '✅ Índices creados para mejor rendimiento';
  RAISE NOTICE '🧠 Sistema "Problema Resuelto" listo para usar';
END $$;