insert into storage.buckets (id, name, public)
values ('property-files', 'property-files', false);

create policy "admins_storage_all" on storage.objects for all
  using (
    bucket_id = 'property-files'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

create policy "owners_storage_insert" on storage.objects for insert
  with check (
    bucket_id = 'property-files'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner'
    and (storage.foldername(name))[1] = 'defects'
  );

create policy "owners_storage_select" on storage.objects for select
  using (
    bucket_id = 'property-files'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner'
  );
