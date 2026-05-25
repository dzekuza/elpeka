-- Add parking identifier field to units (e.g. P-12A)
ALTER TABLE units
  ADD COLUMN IF NOT EXISTS parking text;

-- No RLS change needed — units already has admin_all + owner_select policies
