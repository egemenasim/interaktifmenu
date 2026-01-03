-- =====================================================
-- STORAGE POLICIES for product-images bucket
-- =====================================================
-- Run these in Supabase SQL Editor

-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to read images (public access)
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- STORAGE POLICIES for pdf-menus bucket
-- =====================================================

-- Allow authenticated users to upload PDFs to their own folder
CREATE POLICY "Users can upload their own PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pdf-menus'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to read PDFs (public access)
CREATE POLICY "Public can view PDFs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'pdf-menus');

-- Allow users to delete their own PDFs
CREATE POLICY "Users can delete own PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pdf-menus'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
