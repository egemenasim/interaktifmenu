-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;

-- Allow authenticated users to upload to their own folder in product-images bucket
CREATE POLICY "Users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view all product images
CREATE POLICY "Users can view product images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'product-images');

-- Allow public to view product images (for public menu)
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'product-images');

-- Allow users to update their own images
CREATE POLICY "Users can update own product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
