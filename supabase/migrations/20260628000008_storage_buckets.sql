INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('product-videos', 'product-videos', true, 104857600, ARRAY['video/mp4', 'video/webm']),
  ('exchange-images', 'exchange-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('loyalty-qr-codes', 'loyalty-qr-codes', false, 1048576, ARRAY['image/png', 'image/webp']),
  ('exchange-qr-codes', 'exchange-qr-codes', false, 1048576, ARRAY['image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "public_read_product_media"
  ON storage.objects
  FOR SELECT
  USING (bucket_id IN ('product-images', 'product-videos'));
