/*
  # Crear tabla para la actividad "Nombra tus Emociones"

  1. Nueva tabla
    - `emotion_matches`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `emotion_name` (text, nombre de la emoción)
      - `is_correct` (boolean, si el match fue correcto)
      - `explanation_shown` (boolean, si se mostró la explicación)
      - `created_at` (timestamp)

  2. Seguridad
    - Enable RLS on `emotion_matches` table
    - Add policies for users to manage their own emotion matches

  3. Índices
    - Index on user_id for better performance
    - Index on emotion_name for filtering
*/

-- Crear tabla emotion_matches si no existe
CREATE TABLE IF NOT EXISTS emotion_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  emotion_name text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  explanation_shown boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS emotion_matches_user_id_idx ON emotion_matches(user_id);
CREATE INDEX IF NOT EXISTS emotion_matches_emotion_name_idx ON emotion_matches(emotion_name);
CREATE INDEX IF NOT EXISTS emotion_matches_created_at_idx ON emotion_matches(created_at);
CREATE INDEX IF NOT EXISTS emotion_matches_is_correct_idx ON emotion_matches(is_correct);

-- Habilitar RLS
ALTER TABLE emotion_matches ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view own emotion matches" ON emotion_matches;
DROP POLICY IF EXISTS "Users can insert own emotion matches" ON emotion_matches;

-- Crear políticas RLS
CREATE POLICY "Users can view own emotion matches" ON emotion_matches
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emotion matches" ON emotion_matches
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Verificación
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emotion_matches') THEN
    RAISE NOTICE '✅ Tabla emotion_matches creada correctamente';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '✅ Índices creados para mejor rendimiento';
    RAISE NOTICE '🎯 Lista para guardar resultados de "Nombra tus Emociones"';
  ELSE
    RAISE NOTICE '❌ Error: Tabla emotion_matches no se creó';
  END IF;
END $$;