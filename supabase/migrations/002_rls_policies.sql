alter table estates enable row level security;
alter table units enable row level security;
alter table unit_owners enable row level security;
alter table defects enable row level security;
alter table defect_attachments enable row level security;
alter table defect_replies enable row level security;
alter table defect_reply_attachments enable row level security;
alter table documents enable row level security;

create or replace function is_admin()
returns boolean language sql security definer as $$
  select coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false);
$$;

create or replace function owner_unit_id()
returns uuid language sql security definer as $$
  select unit_id from unit_owners where user_id = auth.uid() limit 1;
$$;

-- ESTATES
create policy "admins_all_estates" on estates for all using (is_admin());
create policy "owners_read_estate" on estates for select
  using (id in (select estate_id from units where id = owner_unit_id()));

-- UNITS
create policy "admins_all_units" on units for all using (is_admin());
create policy "owners_read_own_unit" on units for select using (id = owner_unit_id());

-- UNIT_OWNERS
create policy "admins_all_unit_owners" on unit_owners for all using (is_admin());
create policy "owners_read_own_row" on unit_owners for select using (user_id = auth.uid());

-- DEFECTS
create policy "admins_all_defects" on defects for all using (is_admin());
create policy "owners_read_own_defects" on defects for select using (unit_id = owner_unit_id());
create policy "owners_insert_defects" on defects for insert
  with check (unit_id = owner_unit_id() and submitted_by = auth.uid());

-- DEFECT_ATTACHMENTS
create policy "admins_all_defect_attachments" on defect_attachments for all using (is_admin());
create policy "owners_read_own_defect_attachments" on defect_attachments for select
  using (defect_id in (select id from defects where unit_id = owner_unit_id()));
create policy "owners_insert_defect_attachments" on defect_attachments for insert
  with check (
    defect_id in (select id from defects where unit_id = owner_unit_id())
    and uploaded_by = auth.uid()
  );

-- DEFECT_REPLIES
create policy "admins_all_defect_replies" on defect_replies for all using (is_admin());
create policy "owners_read_own_defect_replies" on defect_replies for select
  using (defect_id in (select id from defects where unit_id = owner_unit_id()));

-- DEFECT_REPLY_ATTACHMENTS
create policy "admins_all_reply_attachments" on defect_reply_attachments for all using (is_admin());
create policy "owners_read_own_reply_attachments" on defect_reply_attachments for select
  using (
    reply_id in (
      select dr.id from defect_replies dr
      join defects d on d.id = dr.defect_id
      where d.unit_id = owner_unit_id()
    )
  );

-- DOCUMENTS
create policy "admins_all_documents" on documents for all using (is_admin());
create policy "owners_read_own_documents" on documents for select using (unit_id = owner_unit_id());
