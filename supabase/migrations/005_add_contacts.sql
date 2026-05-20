create table contacts (
  id           uuid primary key default gen_random_uuid(),
  category     text not null check (category in (
                 'windows','heating','water','electrical',
                 'waste','internet','general','construction')),
  title        text not null,
  company_name text,
  phone        text,
  email        text,
  description  text,
  footnote     text,
  created_at   timestamptz not null default now()
);

create table contact_documents (
  id           uuid primary key default gen_random_uuid(),
  contact_id   uuid not null references contacts(id) on delete cascade,
  name         text not null,
  storage_path text not null,
  created_at   timestamptz not null default now()
);

create table estate_contacts (
  id         uuid primary key default gen_random_uuid(),
  estate_id  uuid not null references estates(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(estate_id, contact_id)
);

-- RLS
alter table contacts enable row level security;
alter table contact_documents enable row level security;
alter table estate_contacts enable row level security;

-- contacts: admins full CRUD
create policy "admins_all_contacts" on contacts
  for all using (is_admin());

-- contacts: owners can read contacts assigned to their estate
create policy "owners_read_assigned_contacts" on contacts
  for select using (
    id in (
      select contact_id from estate_contacts
      where estate_id = (
        select estate_id from units where id = owner_unit_id()
      )
    )
  );

-- contact_documents: admins full CRUD
create policy "admins_all_contact_documents" on contact_documents
  for all using (is_admin());

-- contact_documents: owners can read docs for contacts assigned to their estate
create policy "owners_read_assigned_contact_docs" on contact_documents
  for select using (
    contact_id in (
      select contact_id from estate_contacts
      where estate_id = (
        select estate_id from units where id = owner_unit_id()
      )
    )
  );

-- estate_contacts: admins full CRUD
create policy "admins_all_estate_contacts" on estate_contacts
  for all using (is_admin());

-- estate_contacts: owners can read their estate's assignments
create policy "owners_read_own_estate_contacts" on estate_contacts
  for select using (
    estate_id = (
      select estate_id from units where id = owner_unit_id()
    )
  );
