-- 016: Allow video MIME types in unit-files bucket
-- The bucket was configured via the dashboard without video types.
-- Set allowed_mime_types to NULL to permit all types (access is enforced via RLS).
UPDATE storage.buckets
SET allowed_mime_types = NULL
WHERE id = 'unit-files';
