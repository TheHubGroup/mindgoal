/*
  # Create table for the "Calculadora de Emociones" activity

  1. New Table
    - `user_emotion_log`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `emotion_name` (text, emotion name)
      - `felt_at` (timestamp, when the emotion was felt)
      - `intensity` (integer, scale 1-5)
      - `notes` (text, additional notes)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_emotion_log` table
    - Add policies for users to manage their own emotion logs

  3. Indexes
    - Index on user_id for better performance
    - Index on felt_at for date filtering
    - Index on emotion_name for emotion filtering
*/

-- Create user_emotion_log table if it doesn't exist
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_emotion_log_user_id_idx ON user_emotion_log(user_id);
CREATE INDEX IF NOT EXISTS user_emotion_log_felt_at_idx ON user_emotion_log(felt_at);
CREATE INDEX IF NOT EXISTS user_emotion_log_emotion_name_idx ON user_emotion_log(emotion_name);

-- Enable RLS
ALTER TABLE user_emotion_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Create trigger for updated_at
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

-- Verification
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