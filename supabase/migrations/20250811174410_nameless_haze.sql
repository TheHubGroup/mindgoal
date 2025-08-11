/*
  # Crear tabla para la actividad "La Comunicación"

  1. Nueva tabla
    - `communication_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `messages` (jsonb, array de mensajes de la conversación)
      - `current_step` (integer, paso actual en la conversación)
      - `completed_at` (timestamp, cuándo se completó)
      - `ai_evaluation` (text, evaluación generada por IA)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Enable RLS on `communication_sessions` table
    - Add policies for users to manage their own sessions

  3. Índices
    - Index on user_id for better performance
    - Index on completed_at for filtering
*/

-- Crear tabla communication_sessions si no existe
CREATE TABLE IF NOT EXISTS communication_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_step integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  ai_evaluation text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS communication_sessions_user_id_idx ON communication_sessions(user_id);
CREATE INDEX IF NOT EXISTS communication_sessions_completed_at_idx ON communication_sessions(completed_at);
CREATE INDEX IF NOT EXISTS communication_sessions_created_at_idx ON communication_sessions(created_at);

-- Habilitar RLS
ALTER TABLE communication_sessions ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view own communication sessions" ON communication_sessions;
DROP POLICY IF EXISTS "Users can insert own communication sessions" ON communication_sessions;
DROP POLICY IF EXISTS "Users can update own communication sessions" ON communication_sessions;
DROP POLICY IF EXISTS "Users can delete own communication sessions" ON communication_sessions;

-- Crear políticas RLS
CREATE POLICY "Users can view own communication sessions" ON communication_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own communication sessions" ON communication_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own communication sessions" ON communication_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own communication sessions" ON communication_sessions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION handle_communication_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_communication_sessions_updated_at ON communication_sessions;
CREATE TRIGGER handle_communication_sessions_updated_at
  BEFORE UPDATE ON communication_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_communication_sessions_updated_at();

-- Verificación
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'communication_sessions') THEN
    RAISE NOTICE '✅ Tabla communication_sessions creada correctamente';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '✅ Índices creados para mejor rendimiento';
    RAISE NOTICE '💬 Lista para guardar sesiones de "La Comunicación"';
  ELSE
    RAISE NOTICE '❌ Error: Tabla communication_sessions no se creó';
  END IF;
END $$;