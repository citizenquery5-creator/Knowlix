
/*
# Supabase Storage Bucket Policies

Sets up RLS policies for all storage buckets:
- documents: public read, authenticated write (own files)
- ebooks: public read, authenticated write (own files)
- profile-images: public read, authenticated write (own files)
- payment-screenshots: private read (owner + admin), authenticated write

Also fixes any missing storage object policies.
*/

-- Documents bucket policies
DROP POLICY IF EXISTS "documents_public_read" ON storage.objects;
CREATE POLICY "documents_public_read" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "documents_auth_insert" ON storage.objects;
CREATE POLICY "documents_auth_insert" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "documents_auth_delete" ON storage.objects;
CREATE POLICY "documents_auth_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Ebooks bucket policies
DROP POLICY IF EXISTS "ebooks_public_read" ON storage.objects;
CREATE POLICY "ebooks_public_read" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'ebooks');

DROP POLICY IF EXISTS "ebooks_auth_insert" ON storage.objects;
CREATE POLICY "ebooks_auth_insert" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ebooks' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "ebooks_auth_delete" ON storage.objects;
CREATE POLICY "ebooks_auth_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ebooks' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Profile images bucket policies
DROP POLICY IF EXISTS "profile_images_public_read" ON storage.objects;
CREATE POLICY "profile_images_public_read" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "profile_images_auth_insert" ON storage.objects;
CREATE POLICY "profile_images_auth_insert" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "profile_images_auth_update" ON storage.objects;
CREATE POLICY "profile_images_auth_update" ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "profile_images_auth_delete" ON storage.objects;
CREATE POLICY "profile_images_auth_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Payment screenshots bucket policies (private)
DROP POLICY IF EXISTS "payment_screenshots_owner_read" ON storage.objects;
CREATE POLICY "payment_screenshots_owner_read" ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-screenshots'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

DROP POLICY IF EXISTS "payment_screenshots_auth_insert" ON storage.objects;
CREATE POLICY "payment_screenshots_auth_insert" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "payment_screenshots_admin_delete" ON storage.objects;
CREATE POLICY "payment_screenshots_admin_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'payment-screenshots'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );
