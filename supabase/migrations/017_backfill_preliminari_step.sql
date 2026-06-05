-- Prepend 'preliminari-sutartis' to any visible_steps array that doesn't already include it.
-- This fixes owners whose steps were saved before step 1 was added to the admin editor.
UPDATE unit_owners
SET visible_steps = jsonb_build_array('preliminari-sutartis') || visible_steps::jsonb
WHERE visible_steps IS NOT NULL
  AND NOT (visible_steps::jsonb @> '["preliminari-sutartis"]'::jsonb);
