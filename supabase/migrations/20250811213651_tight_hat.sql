/*
  # Create tables for "Semáforo de los Límites" activity

  1. New Tables
    - `semaforo_limites_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `completed_at` (timestamp, when session was completed)
      - `total_situations` (integer, total number of situations)
      - `completed_situations` (integer, number of completed situations)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `semaforo_limites_responses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `session_id` (uuid, foreign key to semaforo_limites_sessions)
      - `situation_id` (text, identifier for the situation)
      - `situation_title` (text, title of the situation)
      - `user_choice` (text, user's choice: rojo/amarillo/verde)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own data

  3. Indexes
    - Index on user_id for better performance
    - Index on session_id for joining tables
*/

-- Create semaforo_limites_sessions table
CREATE TABLE IF NOT EXISTS semaforo_limites_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at timestamptz,
  total_situations integer NOT NULL DEFAULT 8,
  completed_situations integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create semaforo_limites_responses table
CREATE TABLE IF NOT EXISTS semaforo_limites_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES semaforo_limites_sessions(id) ON DELETE CASCADE,
  situation_id text NOT NULL,
  situation_title text NOT NULL,
  user_choice text NOT NULL CHECK (user_choice IN ('rojo', 'amarillo', 'verde')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS semaforo_limites_sessions_user_id_idx ON semaforo_limites_sessions(user_id);
CREATE INDEX IF NOT EXISTS semaforo_limites_sessions_created_at_idx ON semaforo_limites_sessions(created_at);

CREATE INDEX IF NOT EXISTS semaforo_limites_responses_user_id_idx ON semaforo_limites_responses(user_id);
CREATE INDEX IF NOT EXISTS semaforo_limites_responses_session_id_idx ON semaforo_limites_responses(session_id);
CREATE INDEX IF NOT EXISTS semaforo_limites_responses_situation_id_idx ON semaforo_limites_responses(situation_id);

-- Enable RLS
ALTER TABLE semaforo_limites_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE semaforo_limites_responses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sessions
CREATE POLICY "Users can view own semaforo sessions" ON semaforo_limites_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own semaforo sessions" ON semaforo_limites_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own semaforo sessions" ON semaforo_limites_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own semaforo sessions" ON semaforo_limites_sessions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for responses
CREATE POLICY "Users can view own semaforo responses" ON semaforo_limites_responses
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own semaforo responses" ON semaforo_limites_responses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own semaforo responses" ON semaforo_limites_responses
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own semaforo responses" ON semaforo_limites_responses
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION handle_semaforo_limites_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_semaforo_limites_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_semaforo_limites_sessions_updated_at ON semaforo_limites_sessions;
CREATE TRIGGER handle_semaforo_limites_sessions_updated_at
  BEFORE UPDATE ON semaforo_limites_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_semaforo_limites_sessions_updated_at();

DROP TRIGGER IF EXISTS handle_semaforo_limites_responses_updated_at ON semaforo_limites_responses;
CREATE TRIGGER handle_semaforo_limites_responses_updated_at
  BEFORE UPDATE ON semaforo_limites_responses
  FOR EACH ROW
  EXECUTE FUNCTION handle_semaforo_limites_responses_updated_at();

-- Verification
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'semaforo_limites_sessions') THEN
    RAISE NOTICE '✅ Tabla semaforo_limites_sessions creada correctamente';
  ELSE
    RAISE NOTICE '❌ Error: Tabla semaforo_limites_sessions no se creó';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'semaforo_limites_responses') THEN
    RAISE NOTICE '✅ Tabla semaforo_limites_responses creada correctamente';
  ELSE
    RAISE NOTICE '❌ Error: Tabla semaforo_limites_responses no se creó';
  END IF;

  RAISE NOTICE '✅ Políticas RLS configuradas';
  RAISE NOTICE '✅ Índices creados para mejor rendimiento';
  RAISE NOTICE '🚦 Sistema "Semáforo de los Límites" listo para usar';
END $$;