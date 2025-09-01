/*
  # Create tables for "Dulces Mágicos" activity

  1. New Tables
    - `dulces_magicos_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `completed_at` (timestamp, when session was completed)
      - `ending_reached` (text, which ending the user reached)
      - `resilience_level` (text, resilience assessment)
      - `decision_path` (text[], array of decisions made)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on the table
    - Add policies for users to manage their own sessions

  3. Indexes
    - Index on user_id for better performance
    - Index on ending_reached for analytics
    - Index on resilience_level for filtering
*/

-- Create dulces_magicos_sessions table
CREATE TABLE IF NOT EXISTS dulces_magicos_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  ending_reached text NOT NULL CHECK (ending_reached IN ('ending_sad', 'ending_resilient', 'ending_sharing', 'ending_control')),
  resilience_level text NOT NULL CHECK (resilience_level IN ('Nada Resiliente', 'Poco Resiliente', 'Resiliente', 'Muy Resiliente')),
  decision_path text[] NOT NULL DEFAULT '{}', -- Array of decisions: ['A', 'A1'] or ['B', 'B1'], etc.
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS dulces_magicos_sessions_user_id_idx ON dulces_magicos_sessions(user_id);
CREATE INDEX IF NOT EXISTS dulces_magicos_sessions_ending_idx ON dulces_magicos_sessions(ending_reached);
CREATE INDEX IF NOT EXISTS dulces_magicos_sessions_resilience_idx ON dulces_magicos_sessions(resilience_level);
CREATE INDEX IF NOT EXISTS dulces_magicos_sessions_created_at_idx ON dulces_magicos_sessions(created_at);

-- Enable RLS
ALTER TABLE dulces_magicos_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own dulces magicos sessions" ON dulces_magicos_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dulces magicos sessions" ON dulces_magicos_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dulces magicos sessions" ON dulces_magicos_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dulces magicos sessions" ON dulces_magicos_sessions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION handle_dulces_magicos_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_dulces_magicos_sessions_updated_at ON dulces_magicos_sessions;
CREATE TRIGGER handle_dulces_magicos_sessions_updated_at
  BEFORE UPDATE ON dulces_magicos_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_dulces_magicos_sessions_updated_at();

-- Verification
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dulces_magicos_sessions') THEN
    RAISE NOTICE '✅ Tabla dulces_magicos_sessions creada correctamente';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '✅ Índices creados para mejor rendimiento';
    RAISE NOTICE '🍭 Sistema "Dulces Mágicos" listo para guardar sesiones';
  ELSE
    RAISE NOTICE '❌ Error: Tabla dulces_magicos_sessions no se creó';
  END IF;
END $$;