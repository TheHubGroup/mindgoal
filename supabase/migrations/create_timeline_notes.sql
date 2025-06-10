/*
  # Create timeline notes table

  1. New Tables
    - `timeline_notes`
      - `id` (uuid, primary key)
      - `text` (text, note content)
      - `emoji` (text, emoji character)
      - `color` (text, background color)
      - `shape` (text, border radius style)
      - `font` (text, font family)
      - `section` (text, timeline section: pasado/presente/futuro)
      - `position_x` (numeric, x coordinate)
      - `position_y` (numeric, y coordinate)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `timeline_notes` table
    - Add policy for public access (suitable for educational activity)
*/

CREATE TABLE IF NOT EXISTS timeline_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  emoji text NOT NULL DEFAULT '📝',
  color text NOT NULL DEFAULT '#FFE4E1',
  shape text NOT NULL DEFAULT 'rounded-lg',
  font text NOT NULL DEFAULT 'Comic Neue',
  section text NOT NULL CHECK (section IN ('pasado', 'presente', 'futuro')),
  position_x numeric NOT NULL DEFAULT 50,
  position_y numeric NOT NULL DEFAULT 50,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE timeline_notes ENABLE ROW LEVEL SECURITY;

-- Allow public access for educational activity
CREATE POLICY "Allow public access to timeline notes"
  ON timeline_notes
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_timeline_notes_updated_at
  BEFORE UPDATE ON timeline_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
