INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-request-images',
  'product-request-images',
  FALSE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read product request images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated product request image access" ON storage.objects;

COMMENT ON COLUMN public.product_helper_requests.image_urls IS
  'Private object paths in the product-request-images bucket; APIs return short-lived signed URLs.';
