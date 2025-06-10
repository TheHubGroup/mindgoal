/*
  # Fix Avatar Storage RLS Policies

  This migration fixes the Row Level Security policies for the avatars storage bucket.
  The current policies are incorrectly extracting the user ID from the file path.
  
  ## Changes:
  1. Drop existing storage policies that are causing the RLS violation
  2. Create new policies with correct user ID extraction from filename
  
  ## Security:
  - Users can only upload/update/delete their own avatar files
  - Public can view all avatars
  - File naming convention: {user_id}.{extension}
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

-- Create corrected policies for avatar storage
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

-- Verify the bucket exists and policies are applied
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    RAISE NOTICE '✅ Avatar storage bucket exists';
    RAISE NOTICE '✅ Updated RLS policies for avatar uploads';
    RAISE NOTICE '📝 Users can now upload avatars with filename format: {user_id}.{extension}';
  ELSE
    RAISE NOTICE '❌ Avatar storage bucket not found';
  END IF;
END $$;