/*
  # Fix Problema Resuelto Database Policies Conflict
  
  This migration fixes the policy conflict error by:
  1. Dropping existing policies if they exist
  2. Ensuring tables exist with proper structure
  3. Recreating policies with proper error handling
  
  ## Error Fixed:
  - "policy already exists" error for problema_resuelto_sessions table
  - Ensures all necessary tables and policies are properly configured
*/

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own problema resuelto sessions" ON problema_resuelto_sessions;
DROP POLICY IF EXISTS "Users can insert own problema resuelto sessions" ON problema_resuelto_sessions;
DROP POLICY IF EXISTS "Users can update own problema resuelto sessions" ON problema_resuelto_sessions;
DROP POLICY IF EXISTS "Users can delete own problema resuelto sessions" ON problema_resuelto_sessions;

DROP POLICY IF EXISTS "Users can view own problema resuelto responses" ON problema_resuelto_responses;
DROP POLICY IF EXISTS "Users can insert own problema resuelto responses" ON problema_resuelto_responses;
DROP POLICY IF EXISTS "Users can update own problema resuelto responses" ON problema_resuelto_responses;
DROP POLICY IF EXISTS "Users can delete own problema resuelto responses" ON problema_resuelto_responses;

-- Ensure tables exist with proper structure
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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS problema_resuelto_sessions_user_id_idx ON problema_resuelto_sessions(user_id);
CREATE INDEX IF NOT EXISTS problema_resuelto_sessions_created_at_idx ON problema_resuelto_sessions(created_at);
CREATE INDEX IF NOT EXISTS problema_resuelto_responses_user_id_idx ON problema_resuelto_responses(user_id);
CREATE INDEX IF NOT EXISTS problema_resuelto_responses_session_id_idx ON problema_resuelto_responses(session_id);

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

-- Create or replace triggers for updated_at
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
    RAISE NOTICE '✅ Tabla problema_resuelto_sessions verificada/creada correctamente';
  ELSE
    RAISE NOTICE '❌ Error: Tabla problema_resuelto_sessions no existe';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'problema_resuelto_responses') THEN
    RAISE NOTICE '✅ Tabla problema_resuelto_responses verificada/creada correctamente';
  ELSE
    RAISE NOTICE '❌ Error: Tabla problema_resuelto_responses no existe';
  END IF;

  RAISE NOTICE '✅ Políticas RLS configuradas sin conflictos';
  RAISE NOTICE '✅ Índices y triggers verificados';
  RAISE NOTICE '🧠 Sistema "Problema Resuelto" listo para usar';
END $$;