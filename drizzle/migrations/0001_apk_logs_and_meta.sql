
create table public.apk_meta (
  id int primary key default 1,
  filename text not null,
  size bigint,
  uploaded_at timestamptz not null default now(),
  constraint apk_meta_singleton check (id = 1)
);
grant select on public.apk_meta to anon, authenticated;
grant all on public.apk_meta to service_role;
alter table public.apk_meta enable row level security;
create policy "anyone reads meta" on public.apk_meta for select to anon, authenticated using (true);
create policy "anyone upserts meta" on public.apk_meta for all to anon, authenticated using (true) with check (true);

create table public.access_logs (
  id uuid primary key default gen_random_uuid(),
  ip text,
  user_agent text,
  device text,
  source text,
  created_at timestamptz not null default now()
);
grant select, insert on public.access_logs to anon, authenticated;
grant all on public.access_logs to service_role;
alter table public.access_logs enable row level security;
create policy "read access_logs" on public.access_logs for select to anon, authenticated using (true);
create policy "insert access_logs" on public.access_logs for insert to anon, authenticated with check (true);

create table public.download_logs (
  id uuid primary key default gen_random_uuid(),
  ip text,
  user_agent text,
  device text,
  filename text,
  created_at timestamptz not null default now()
);
grant select, insert on public.download_logs to anon, authenticated;
grant all on public.download_logs to service_role;
alter table public.download_logs enable row level security;
create policy "read download_logs" on public.download_logs for select to anon, authenticated using (true);
create policy "insert download_logs" on public.download_logs for insert to anon, authenticated with check (true);

create table public.counters (
  key text primary key,
  value bigint not null default 0
);
insert into public.counters (key, value) values ('access', 0), ('download', 0) on conflict do nothing;
grant select, update on public.counters to anon, authenticated;
grant all on public.counters to service_role;
alter table public.counters enable row level security;
create policy "read counters" on public.counters for select to anon, authenticated using (true);
create policy "update counters" on public.counters for update to anon, authenticated using (true) with check (true);

create or replace function public.increment_counter(_key text)
returns void language sql security definer set search_path = public as $$
  update public.counters set value = value + 1 where key = _key;
$$;
grant execute on function public.increment_counter(text) to anon, authenticated;

create or replace function public.reset_counter(_key text)
returns void language sql security definer set search_path = public as $$
  update public.counters set value = 0 where key = _key;
$$;
grant execute on function public.reset_counter(text) to anon, authenticated;

create policy "apks read via signed url" on storage.objects for select to anon, authenticated using (bucket_id = 'apks');
create policy "apks upload" on storage.objects for insert to anon, authenticated with check (bucket_id = 'apks');
create policy "apks update" on storage.objects for update to anon, authenticated using (bucket_id = 'apks') with check (bucket_id = 'apks');
create policy "apks delete" on storage.objects for delete to anon, authenticated using (bucket_id = 'apks');
