create extension if not exists "uuid-ossp";

create table estates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text not null,
  description text,
  created_at  timestamptz not null default now()
);

create table units (
  id               uuid primary key default gen_random_uuid(),
  estate_id        uuid not null references estates(id) on delete cascade,
  unit_number      text not null,
  floor            integer,
  area_sqm         numeric(8,2),
  technical_data   jsonb,
  financial_data   jsonb,
  created_at       timestamptz not null default now()
);

create table unit_owners (
  id          uuid primary key default gen_random_uuid(),
  unit_id     uuid not null references units(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  invited_at  timestamptz not null default now(),
  accepted_at timestamptz,
  unique(unit_id),
  unique(user_id)
);

create table defects (
  id           uuid primary key default gen_random_uuid(),
  unit_id      uuid not null references units(id) on delete cascade,
  submitted_by uuid not null references auth.users(id),
  title        text not null,
  description  text not null,
  status       text not null default 'pateikta'
                 check (status in ('pateikta', 'sprendziama', 'atlikta')),
  created_at   timestamptz not null default now()
);

create table defect_attachments (
  id           uuid primary key default gen_random_uuid(),
  defect_id    uuid not null references defects(id) on delete cascade,
  storage_path text not null,
  uploaded_by  uuid not null references auth.users(id),
  created_at   timestamptz not null default now()
);

create table defect_replies (
  id         uuid primary key default gen_random_uuid(),
  defect_id  uuid not null references defects(id) on delete cascade,
  author_id  uuid not null references auth.users(id),
  body       text not null,
  created_at timestamptz not null default now()
);

create table defect_reply_attachments (
  id           uuid primary key default gen_random_uuid(),
  reply_id     uuid not null references defect_replies(id) on delete cascade,
  storage_path text not null,
  created_at   timestamptz not null default now()
);

create table documents (
  id           uuid primary key default gen_random_uuid(),
  unit_id      uuid not null references units(id) on delete cascade,
  category     text not null,
  name         text not null,
  storage_path text not null,
  uploaded_by  uuid not null references auth.users(id),
  created_at   timestamptz not null default now()
);

create index on units(estate_id);
create index on unit_owners(unit_id);
create index on unit_owners(user_id);
create index on defects(unit_id);
create index on defects(status);
create index on defect_replies(defect_id);
create index on documents(unit_id);
