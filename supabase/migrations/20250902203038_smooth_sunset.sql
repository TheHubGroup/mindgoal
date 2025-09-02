/*
  # Create dream_images storage bucket for AI-generated images

  1. Storage
    - Create `dream_images` bucket for AI-generated inspirational images
    - Set public access for viewing images
    - Add RLS policies for image management

  2. Security
    - Authenticated users can upload images
    - Public can view all images
    - Proper file size and type restrictions
*/

-- Create dream_images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dream_images', 
  'dream_images', 
  true, 
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload dream images
CREATE POLICY "Users can upload dream images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dream_images');

-- Allow public access to view dream images
CREATE POLICY "Public can view dream images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'dream_images');

-- Allow authenticated users to delete dream images
CREATE POLICY "Users can delete dream images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'dream_images');