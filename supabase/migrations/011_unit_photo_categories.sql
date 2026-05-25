-- Add photo_category column to documents table for categorising unit photos
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS photo_category text
  CHECK (photo_category IS NULL OR photo_category IN ('progress', 'final'));

-- Existing rows retain NULL (uncategorised); no RLS change needed
-- documents already has admin_all + owner_select policies via is_admin() / owner_unit_id()
