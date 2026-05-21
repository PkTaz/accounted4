-- Part 3: Receipts table + RLS + Storage bucket
-- Run in Supabase Dashboard → SQL Editor

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vendor text not null,
  receipt_date date not null,
  total numeric(10, 2) not null check (total >= 0),
  category text not null,
  notes text,
  image_url text,
  image_path text,
  ai_confidence numeric(5, 4),
  created_at timestamptz not null default now()
);

create index if not exists receipts_user_id_idx on public.receipts (user_id);
create index if not exists receipts_created_at_idx on public.receipts (created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.receipts enable row level security;

drop policy if exists "Users read own receipts" on public.receipts;
create policy "Users read own receipts"
  on public.receipts for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users insert own receipts" on public.receipts;
create policy "Users insert own receipts"
  on public.receipts for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update own receipts" on public.receipts;
create policy "Users update own receipts"
  on public.receipts for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own receipts" on public.receipts;
create policy "Users delete own receipts"
  on public.receipts for delete to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage bucket (private — use signed URLs in the app)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('receipt-images', 'receipt-images', false)
on conflict (id) do update set public = false;

drop policy if exists "Users upload receipt images" on storage.objects;
create policy "Users upload receipt images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'receipt-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users update own receipt images" on storage.objects;
create policy "Users update own receipt images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'receipt-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users read own receipt images" on storage.objects;
create policy "Users read own receipt images"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'receipt-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete own receipt images" on storage.objects;
create policy "Users delete own receipt images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'receipt-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
