/*
  # Crear tabla para respuestas de "Cuéntame quien eres"

  1. Nueva tabla
    - `user_responses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `question` (text, la pregunta respondida)
      - `response` (text, la respuesta del usuario)
      - `activity_type` (text, tipo de actividad)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Enable RLS on `user_responses` table
    - Add policies for users to manage their own responses

  3. Índices
    - Index on user_id for better performance
    - Index on activity_type for filtering
*/

-- Crear tabla user_responses si no existe
CREATE TABLE IF NOT EXISTS user_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  response text NOT NULL,
  activity_type text NOT NULL DEFAULT 'cuentame_quien_eres',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS user_responses_user_id_idx ON user_responses(user_id);
CREATE INDEX IF NOT EXISTS user_responses_activity_type_idx ON user_responses(activity_type);
CREATE INDEX IF NOT EXISTS user_responses_created_at_idx ON user_responses(created_at);

-- Habilitar RLS
ALTER TABLE user_responses ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view own responses" ON user_responses;
DROP POLICY IF EXISTS "Users can insert own responses" ON user_responses;
DROP POLICY IF EXISTS "Users can update own responses" ON user_responses;
DROP POLICY IF EXISTS "Users can delete own responses" ON user_responses;

-- Crear políticas RLS
CREATE POLICY "Users can view own responses" ON user_responses
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own responses" ON user_responses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own responses" ON user_responses
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own responses" ON user_responses
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION handle_user_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_user_responses_updated_at ON user_responses;
CREATE TRIGGER handle_user_responses_updated_at
  BEFORE UPDATE ON user_responses
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_responses_updated_at();

-- Verificación
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_responses') THEN
    RAISE NOTICE '✅ Tabla user_responses creada correctamente';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '✅ Índices creados para mejor rendimiento';
    RAISE NOTICE '🎯 Lista para guardar respuestas de "Cuéntame quien eres"';
  ELSE
    RAISE NOTICE '❌ Error: Tabla user_responses no se creó';
  END IF;
END $$;