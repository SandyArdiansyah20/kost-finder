-- =====================================================
-- KostFinder: schema, trigger, RLS, storage
-- Jalankan di Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. TABEL ------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'seeker' check (role in ('seeker','owner','admin')),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  price_monthly integer not null check (price_monthly >= 0),
  city text not null,
  address text,
  latitude double precision,
  longitude double precision,
  gender_type text not null default 'campur' check (gender_type in ('putra','putri','campur')),
  room_available integer not null default 1,
  status text not null default 'draft' check (status in ('draft','published','full')),
  created_at timestamptz not null default now()
);
create index listings_city_idx on public.listings (lower(city));
create index listings_price_idx on public.listings (price_monthly);

create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  image_url text not null,
  position integer not null default 0
);

create table public.facilities (
  id serial primary key,
  name text not null unique
);

create table public.listing_facilities (
  listing_id uuid references public.listings(id) on delete cascade,
  facility_id integer references public.facilities(id) on delete cascade,
  primary key (listing_id, facility_id)
);

create table public.favorites (
  user_id uuid references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (listing_id, user_id)
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  seeker_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

-- 2. VIEW RATING ------------------------------------------
create view public.listing_ratings with (security_invoker = true) as
select listing_id, round(avg(rating)::numeric, 1) as avg_rating, count(*) as review_count
from public.reviews group by listing_id;

-- 3. TRIGGER: buat profile otomatis saat register ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    case when new.raw_user_meta_data->>'role' = 'owner' then 'owner' else 'seeker' end
  );
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 4. HELPER ------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_owner()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('owner','admin'));
$$;

-- 5. ROW LEVEL SECURITY ------------------------------------
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.facilities enable row level security;
alter table public.listing_facilities enable row level security;
alter table public.favorites enable row level security;
alter table public.reviews enable row level security;
alter table public.inquiries enable row level security;

-- profiles
create policy "profiles_read" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- listings
create policy "listings_read" on public.listings for select
  using (status in ('published','full') or owner_id = auth.uid() or public.is_admin());
create policy "listings_insert" on public.listings for insert
  with check (owner_id = auth.uid() and public.is_owner());
create policy "listings_update" on public.listings for update
  using (owner_id = auth.uid() or public.is_admin());
create policy "listings_delete" on public.listings for delete
  using (owner_id = auth.uid() or public.is_admin());

-- listing_images
create policy "images_read" on public.listing_images for select
  using (exists (select 1 from public.listings l where l.id = listing_id));
create policy "images_write" on public.listing_images for all
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid()))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid()));

-- facilities
create policy "facilities_read" on public.facilities for select using (true);

-- listing_facilities
create policy "lf_read" on public.listing_facilities for select using (true);
create policy "lf_write" on public.listing_facilities for all
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid()))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid()));

-- favorites
create policy "fav_own" on public.favorites for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- reviews
create policy "reviews_read" on public.reviews for select using (true);
create policy "reviews_insert" on public.reviews for insert with check (user_id = auth.uid());
create policy "reviews_update" on public.reviews for update using (user_id = auth.uid());
create policy "reviews_delete" on public.reviews for delete using (user_id = auth.uid());

-- inquiries
create policy "inq_insert" on public.inquiries for insert with check (seeker_id = auth.uid());
create policy "inq_read" on public.inquiries for select
  using (seeker_id = auth.uid()
    or exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid()));

-- 6. STORAGE -----------------------------------------------
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

create policy "storage_public_read" on storage.objects for select
  using (bucket_id = 'listing-images');
create policy "storage_owner_upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "storage_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- 7. DATA AWAL FASILITAS -----------------------------------
insert into public.facilities (name) values
  ('AC'),('WiFi'),('Kamar mandi dalam'),('Kasur'),('Lemari'),
  ('Parkir motor'),('Parkir mobil'),('Dapur bersama'),('Laundry'),('CCTV')
on conflict do nothing;

-- 8. FILTER DENGA LISTING TAG-------------------------------
create or replace view public.listings_with_facilities with (security_invoker = true) as
select 
  l.*,
  coalesce(
    (
      select array_agg(f.name)
      from public.listing_facilities lf
      join public.facilities f on f.id = lf.facility_id
      where lf.listing_id = l.id
    ),
    '{}'
  ) as facility_names,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object('image_url', li.image_url, 'position', li.position)
        order by li.position asc
      )
      from public.listing_images li
      where li.listing_id = l.id
    ),
    '[]'::jsonb
  ) as listing_images
from public.listings l;