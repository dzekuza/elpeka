-- Allow multiple owners per unit (drop single-unit unique constraint)
ALTER TABLE unit_owners DROP CONSTRAINT IF EXISTS unit_owners_unit_id_key;

-- Add owner profile fields
ALTER TABLE unit_owners
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name  text,
  ADD COLUMN IF NOT EXISTS phone      text;
