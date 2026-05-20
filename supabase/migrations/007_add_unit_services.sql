CREATE TABLE unit_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('electrical', 'water', 'heating', 'waste')),
  meter_number text,
  description text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(unit_id, category)
);

ALTER TABLE unit_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_unit_services" ON unit_services
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "owner_select_unit_services" ON unit_services
  FOR SELECT TO authenticated
  USING (unit_id = owner_unit_id());

CREATE POLICY "owner_complete_unit_services" ON unit_services
  FOR UPDATE TO authenticated
  USING (unit_id = owner_unit_id())
  WITH CHECK (unit_id = owner_unit_id());
