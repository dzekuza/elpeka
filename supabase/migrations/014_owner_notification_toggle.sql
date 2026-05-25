-- Admin can mute service contract reminder emails per owner
-- Use when internal blockers prevent the owner from signing (avoids sending unhelpful reminders)
ALTER TABLE unit_owners
  ADD COLUMN IF NOT EXISTS notifications_enabled boolean NOT NULL DEFAULT true;
