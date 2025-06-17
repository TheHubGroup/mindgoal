-- Crear tabla meditation_sessions para la actividad de meditación
CREATE TABLE IF NOT EXISTS meditation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id text NOT NULL,
  video_title text NOT NULL,
  started_at timestamptz,
  completed_at timestamptz,
  watch_duration numeric NOT NULL DEFAULT 0, -- en segundos
  total_duration numeric NOT NULL DEFAULT 0, -- duración total del video
  completion_percentage integer NOT NULL DEFAULT 0, -- porcentaje completado (0-100)
  reflection_text text, -- reflexión del usuario después de la meditación
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS meditation_sessions_user_id_idx ON meditation_sessions(user_id);
CREATE INDEX IF NOT EXISTS meditation_sessions_video_id_idx ON meditation_sessions(video_id);
CREATE INDEX IF NOT EXISTS meditation_sessions_created_at_idx ON meditation_sessions(created_at);
CREATE INDEX IF NOT EXISTS meditation_sessions_completion_idx ON meditation_sessions(completion_percentage);

-- Habilitar RLS
ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view own meditation sessions" ON meditation_sessions;
DROP POLICY IF EXISTS "Users can insert own meditation sessions" ON meditation_sessions;
DROP POLICY IF EXISTS "Users can update own meditation sessions" ON meditation_sessions;
DROP POLICY IF EXISTS "Users can delete own meditation sessions" ON meditation_sessions;

-- Crear políticas RLS
CREATE POLICY "Users can view own meditation sessions" ON meditation_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meditation sessions" ON meditation_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meditation sessions" ON meditation_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meditation sessions" ON meditation_sessions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION handle_meditation_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_meditation_sessions_updated_at ON meditation_sessions;
CREATE TRIGGER handle_meditation_sessions_updated_at
  BEFORE UPDATE ON meditation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_meditation_sessions_updated_at();

-- Verificación
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meditation_sessions') THEN
    RAISE NOTICE '✅ Tabla meditation_sessions creada correctamente';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '✅ Índices creados para mejor rendimiento';
    RAISE NOTICE '🧘‍♀️ Lista para guardar sesiones de "Meditación del Autoconocimiento"';
  ELSE
    RAISE NOTICE '❌ Error: Tabla meditation_sessions no se creó';
  END IF;
END $$;