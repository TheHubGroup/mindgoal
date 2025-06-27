/*
  # Crear tabla pública para leaderboard

  1. Nueva tabla
    - `public_scores`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `score` (integer, puntaje del usuario)
      - `level` (text, nivel basado en el puntaje)
      - `last_updated` (timestamp, última actualización)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Enable RLS on `public_scores` table
    - Políticas permisivas para lectura pública
    - Políticas restrictivas para escritura (solo el propio usuario)

  3. Índices
    - Index on user_id for better performance
    - Index on score for sorting
*/

-- Crear tabla public_scores si no existe
CREATE TABLE IF NOT EXISTS public_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  score integer NOT NULL DEFAULT 0,
  level text NOT NULL DEFAULT 'Principiante',
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS public_scores_user_id_idx ON public_scores(user_id);
CREATE INDEX IF NOT EXISTS public_scores_score_idx ON public_scores(score);
CREATE INDEX IF NOT EXISTS public_scores_level_idx ON public_scores(level);

-- Habilitar RLS
ALTER TABLE public_scores ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Anyone can read public scores" ON public_scores;
DROP POLICY IF EXISTS "Users can update own public score" ON public_scores;
DROP POLICY IF EXISTS "Users can insert own public score" ON public_scores;

-- Crear políticas RLS
CREATE POLICY "Anyone can read public scores" ON public_scores
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update own public score" ON public_scores
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own public score" ON public_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION handle_public_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_public_scores_updated_at ON public_scores;
CREATE TRIGGER handle_public_scores_updated_at
  BEFORE UPDATE ON public_scores
  FOR EACH ROW
  EXECUTE FUNCTION handle_public_scores_updated_at();

-- Verificación
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'public_scores') THEN
    RAISE NOTICE '✅ Tabla public_scores creada correctamente';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '✅ Índices creados para mejor rendimiento';
    RAISE NOTICE '🏆 Lista para almacenar puntajes públicos del leaderboard';
  ELSE
    RAISE NOTICE '❌ Error: Tabla public_scores no se creó';
  END IF;
END $$;