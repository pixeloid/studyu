-- Add image_url column to extras table
ALTER TABLE extras ADD COLUMN image_url TEXT;

-- Create storage bucket for extra images
INSERT INTO storage.buckets (id, name, public)
VALUES ('extras', 'extras', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to extras bucket
CREATE POLICY "Public read access for extras images"
ON storage.objects FOR SELECT
USING (bucket_id = 'extras');

-- Allow authenticated users to upload (admin check done at app level)
CREATE POLICY "Authenticated upload for extras images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'extras');

CREATE POLICY "Authenticated update for extras images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'extras');

CREATE POLICY "Authenticated delete for extras images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'extras');
