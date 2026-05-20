ALTER TABLE unit_owners ADD CONSTRAINT unit_owners_unit_id_user_id_unique UNIQUE (unit_id, user_id);
