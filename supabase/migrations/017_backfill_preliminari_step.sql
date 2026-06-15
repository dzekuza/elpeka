-- Prepend 'preliminari-sutartis' to any visible_steps array that doesn't already include it.
-- This fixes owners whose steps were saved before step 1 was added to the admin editor.
UPDATE unit_owners
SET visible_steps = ARRAY['preliminari-sutartis'] || visible_steps
WHERE visible_steps IS NOT NULL
  AND NOT ('preliminari-sutartis' = ANY(visible_steps));
