/*
  # Fix Avatar Storage RLS Policies

  This migration fixes the Row Level Security policies for the avatars storage bucket.
  The current policies are incorrectly extracting the user ID from the file path.
  
  ## Changes:
  1. Drop existing storage policies for avatars bucket
  2. Create new policies with correct user ID extraction from filename
  
  ## Security:
  - Users can only upload/update/delete their own avatar files
  - Public can view all avatars
*/

-- Drop existing storage policies for avatars
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

-- Create new storage policies with correct user ID extraction
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = split_part(name, '.', 1)
  );

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = split_part(name, '.', 1)
  );

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = split_part(name, '.', 1)
  );

CREATE POLICY "Public can view avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');