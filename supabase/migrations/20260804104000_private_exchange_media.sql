UPDATE storage.buckets
SET public = FALSE,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
WHERE id = 'exchange-images';

UPDATE public.exchange_request_images
SET url = 'exchange-images/' || regexp_replace(
  split_part(url, '?', 1),
  '^.*/exchange-images/',
  ''
)
WHERE url ~ '^https?://.*/exchange-images/';

ALTER TABLE public.exchange_request_images
  DROP CONSTRAINT IF EXISTS exchange_request_images_private_path_check;

ALTER TABLE public.exchange_request_images
  ADD CONSTRAINT exchange_request_images_private_path_check
  CHECK (url ~ '^exchange-images/[A-Za-z0-9][A-Za-z0-9._/-]{0,1023}$') NOT VALID;

COMMENT ON COLUMN public.exchange_request_images.url IS
  'Private storage object key (exchange-images/<path>), never a permanent public URL.';
