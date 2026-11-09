-- Ma Comptabilité Camion : à coller une seule fois dans Supabase > SQL Editor > Run
create table if not exists public.items (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  path text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, path)
);
alter table public.items enable row level security;
drop policy if exists "chacun ses donnees" on public.items;
create policy "chacun ses donnees" on public.items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public) values ('papiers', 'papiers', false)
  on conflict (id) do nothing;
drop policy if exists "chacun ses papiers" on storage.objects;
create policy "chacun ses papiers" on storage.objects for all to authenticated
  using (bucket_id = 'papiers' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'papiers' and (storage.foldername(name))[1] = auth.uid()::text);
