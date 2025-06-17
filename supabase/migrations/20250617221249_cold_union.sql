/*
  # Crear tabla para la actividad "Carta a mí mismo"

  1. Nueva tabla
    - `letters`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text, título de la carta)
      - `content` (text, contenido de la carta)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Enable RLS on `letters` table
    - Add policies for users to manage their own letters

  3. Índices
    - Index on user_id for better performance
*/

-- Crear tabla letters si no existe
CREATE TABLE IF NOT EXISTS letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS letters_user_id_idx ON letters(user_id);
CREATE INDEX IF NOT EXISTS letters_created_at_idx ON letters(created_at);

-- Habilitar RLS
ALTER TABLE letters ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view own letters" ON letters;
DROP POLICY IF EXISTS "Users can insert own letters" ON letters;
DROP POLICY IF EXISTS "Users can update own letters" ON letters;
DROP POLICY IF EXISTS "Users can delete own letters" ON letters;

-- Crear políticas RLS
CREATE POLICY "Users can view own letters" ON letters
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own letters" ON letters
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own letters" ON letters
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own letters" ON letters
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION handle_letters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_letters_updated_at ON letters;
CREATE TRIGGER handle_letters_updated_at
  BEFORE UPDATE ON letters
  FOR EACH ROW
  EXECUTE FUNCTION handle_letters_updated_at();

-- Verificación
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'letters') THEN
    RAISE NOTICE '✅ Tabla letters creada correctamente';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '✅ Índices creados para mejor rendimiento';
    RAISE NOTICE '🎯 Lista para guardar cartas de "Carta a mí mismo"';
  ELSE
    RAISE NOTICE '❌ Error: Tabla letters no se creó';
  END IF;
END $$;