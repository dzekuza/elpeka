-- Per-owner control over which onboarding steps are visible on the portal homepage
-- Allows hiding steps irrelevant to specific buyers (e.g. cash buyers skip bank contract step)
ALTER TABLE unit_owners
  ADD COLUMN IF NOT EXISTS visible_steps text[]
  DEFAULT ARRAY[
    'mokėjimai',
    'banko-sutartis',
    'kadastras',
    'notarinė-sutartis',
    'registrų-centras',
    'pakvitavimas',
    'papildomi'
  ]::text[];
