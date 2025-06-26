/*
  # Crear tabla para la actividad "Calculadora de Emociones"

  1. Nueva tabla
    - `user_emotion_log`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `emotion_name` (text, nombre de la emoción)
      - `felt_at` (timestamp, cuándo sintió la emoción)
      - `intensity` (integer, intensidad 1-5)
      - `notes` (text, notas adicionales)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Enable RLS on `user_emotion_log` table
    - Add policies for users to manage their own emotion logs

  3. Índices
    - Index on user_id for better performance
    - Index on felt_at for date filtering
    - Index on emotion_name for emotion filtering
*/

-- Crear tabla user_emotion_log si no existe
CREATE TABLE IF NOT EXISTS user_emotion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  emotion_name text NOT NULL,
  felt_at timestamptz DEFAULT now(),
  intensity integer CHECK (intensity >= 1 AND intensity <= 5),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS user_emotion_log_user_id_idx ON user_emotion_log(user_id);
CREATE INDEX IF NOT EXISTS user_emotion_log_felt_at_idx ON user_emotion_log(felt_at);
CREATE INDEX IF NOT EXISTS user_emotion_log_emotion_name_idx ON user_emotion_log(emotion_name);

-- Habilitar RLS
ALTER TABLE user_emotion_log ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view own emotion logs" ON user_emotion_log;
DROP POLICY IF EXISTS "Users can insert own emotion logs" ON user_emotion_log;
DROP POLICY IF EXISTS "Users can update own emotion logs" ON user_emotion_log;
DROP POLICY IF EXISTS "Users can delete own emotion logs" ON user_emotion_log;

-- Crear políticas RLS
CREATE POLICY "Users can view own emotion logs" ON user_emotion_log
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emotion logs" ON user_emotion_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emotion logs" ON user_emotion_log
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own emotion logs" ON user_emotion_log
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION handle_user_emotion_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_user_emotion_log_updated_at ON user_emotion_log;
CREATE TRIGGER handle_user_emotion_log_updated_at
  BEFORE UPDATE ON user_emotion_log
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_emotion_log_updated_at();

-- Verificación
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_emotion_log') THEN
    RAISE NOTICE '✅ Tabla user_emotion_log creada correctamente';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '✅ Índices creados para mejor rendimiento';
    RAISE NOTICE '🎯 Lista para guardar registros de emociones';
  ELSE
    RAISE NOTICE '❌ Error: Tabla user_emotion_log no se creó';
  END IF;
END $$;