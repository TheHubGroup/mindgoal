-- Crear tabla anger_menu_sessions para la actividad "Menú de la Ira"
CREATE TABLE IF NOT EXISTS anger_menu_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id text NOT NULL,
  video_title text NOT NULL,
  started_at timestamptz,
  completed_at timestamptz,
  watch_duration numeric NOT NULL DEFAULT 0, -- en segundos
  total_duration numeric NOT NULL DEFAULT 0, -- duración total del video
  completion_percentage integer NOT NULL DEFAULT 0, -- porcentaje completado (0-100)
  reflection_text text, -- reflexión del usuario después del video
  selected_techniques text[] DEFAULT '{}', -- técnicas seleccionadas por el usuario
  skip_count integer NOT NULL DEFAULT 0, -- número de veces que hizo skip forward
  last_position numeric NOT NULL DEFAULT 0, -- última posición vista en segundos
  view_count integer NOT NULL DEFAULT 1, -- número de veces que ha visto el video
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS anger_menu_sessions_user_id_idx ON anger_menu_sessions(user_id);
CREATE INDEX IF NOT EXISTS anger_menu_sessions_video_id_idx ON anger_menu_sessions(video_id);
CREATE INDEX IF NOT EXISTS anger_menu_sessions_created_at_idx ON anger_menu_sessions(created_at);
CREATE INDEX IF NOT EXISTS anger_menu_sessions_completion_idx ON anger_menu_sessions(completion_percentage);

-- Crear índice único para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS anger_menu_sessions_user_video_unique_idx 
ON anger_menu_sessions(user_id, video_id);

-- Habilitar RLS
ALTER TABLE anger_menu_sessions ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view own anger menu sessions" ON anger_menu_sessions;
DROP POLICY IF EXISTS "Users can insert own anger menu sessions" ON anger_menu_sessions;
DROP POLICY IF EXISTS "Users can update own anger menu sessions" ON anger_menu_sessions;
DROP POLICY IF EXISTS "Users can delete own anger menu sessions" ON anger_menu_sessions;

-- Crear políticas RLS
CREATE POLICY "Users can view own anger menu sessions" ON anger_menu_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own anger menu sessions" ON anger_menu_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own anger menu sessions" ON anger_menu_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own anger menu sessions" ON anger_menu_sessions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Agregar constraints de check
ALTER TABLE anger_menu_sessions 
ADD CONSTRAINT anger_menu_sessions_skip_count_check 
CHECK (skip_count >= 0);

ALTER TABLE anger_menu_sessions 
ADD CONSTRAINT anger_menu_sessions_view_count_check 
CHECK (view_count >= 1);

ALTER TABLE anger_menu_sessions 
ADD CONSTRAINT anger_menu_sessions_last_position_check 
CHECK (last_position >= 0);

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION handle_anger_menu_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_anger_menu_sessions_updated_at ON anger_menu_sessions;
CREATE TRIGGER handle_anger_menu_sessions_updated_at
  BEFORE UPDATE ON anger_menu_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_anger_menu_sessions_updated_at();

-- Verificación
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'anger_menu_sessions') THEN
    RAISE NOTICE '✅ Tabla anger_menu_sessions creada correctamente';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '✅ Índices creados para mejor rendimiento';
    RAISE NOTICE '✅ Índice único para evitar duplicados';
    RAISE NOTICE '😡 Lista para guardar sesiones de "Menú de la Ira"';
  ELSE
    RAISE NOTICE '❌ Error: Tabla anger_menu_sessions no se creó';
  END IF;
END $$;