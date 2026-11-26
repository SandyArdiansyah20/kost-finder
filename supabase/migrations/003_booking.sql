-- =====================================================
-- Booking dengan durasi sewa, diskon, dan kode promo
-- Jalankan di SQL Editor setelah 001 dan 002
-- Aman dijalankan ulang (idempotent)
-- =====================================================

-- 1. TABEL ------------------------------------------------
create table if not exists public.duration_discounts (
  months integer primary key check (months > 0),
  percent numeric(5,2) not null check (percent between 0 and 100)
);

create table if not exists public.promos (
  code text primary key check (code = upper(code)),
  description text,
  discount_percent numeric(5,2) not null check (discount_percent between 0 and 100),
  max_discount integer check (max_discount >= 0),      -- null = tanpa batas
  min_months integer not null default 1,
  valid_until date,                                     -- null = tanpa kedaluwarsa
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  tenant_id uuid not null references public.profiles(id) on delete cascade,
  start_date date not null,
  months integer not null check (months in (1,3,6,12)),
  monthly_price integer not null,
  duration_percent numeric(5,2) not null default 0,
  duration_discount integer not null default 0,
  promo_code text,
  promo_discount integer not null default 0,
  total_price integer not null,
  note text,
  status text not null default 'pending'
    check (status in ('pending','confirmed','rejected','cancelled','completed')),
  created_at timestamptz not null default now()
);
create index if not exists bookings_tenant_idx on public.bookings (tenant_id);
create index if not exists bookings_listing_idx on public.bookings (listing_id);

-- 2. DATA AWAL --------------------------------------------
insert into public.duration_discounts (months, percent) values (3, 5), (6, 8), (12, 11)
on conflict (months) do nothing;

insert into public.promos (code, description, discount_percent, max_discount, min_months, valid_until)
values ('HEMAT10', 'Diskon tambahan 10% (maks Rp200.000) untuk sewa minimal 3 bulan', 10, 200000, 3, '2027-12-31')
on conflict (code) do nothing;

-- 3. HITUNG HARGA (dipakai preview di UI dan saat booking) --
create or replace function public.calc_booking_price(
  p_listing_id uuid, p_months integer, p_promo_code text default null)
returns table (
  monthly_price integer, subtotal integer, duration_percent numeric, duration_discount integer,
  promo_code text, promo_discount integer, total integer, promo_error text)
language plpgsql stable security definer set search_path = public as $$
declare
  v_price integer;
  v_dp numeric := 0;
  v_sub integer;
  v_dd integer;
  v_after integer;
  v_code text := nullif(upper(trim(coalesce(p_promo_code, ''))), '');
  v_pd integer := 0;
  v_err text := null;
  pr public.promos%rowtype;
begin
  select l.price_monthly into v_price
  from public.listings l
  where l.id = p_listing_id and l.status in ('published', 'full');
  if v_price is null then raise exception 'Kos tidak ditemukan'; end if;
  if p_months is null or p_months not in (1, 3, 6, 12) then
    raise exception 'Durasi sewa tidak valid';
  end if;

  select d.percent into v_dp from public.duration_discounts d where d.months = p_months;
  v_dp := coalesce(v_dp, 0);
  v_sub := v_price * p_months;
  v_dd := round(v_sub * v_dp / 100);
  v_after := v_sub - v_dd;

  if v_code is not null then
    select * into pr from public.promos p where p.code = v_code;
    if not found or not pr.is_active then
      v_err := 'Kode promo tidak ditemukan';
    elsif pr.valid_until is not null and pr.valid_until < current_date then
      v_err := 'Kode promo sudah kedaluwarsa';
    elsif p_months < pr.min_months then
      v_err := 'Kode promo berlaku untuk sewa minimal ' || pr.min_months || ' bulan';
    else
      v_pd := round(v_after * pr.discount_percent / 100);
      if pr.max_discount is not null then v_pd := least(v_pd, pr.max_discount); end if;
    end if;
  end if;

  return query select v_price, v_sub, v_dp, v_dd, v_code, v_pd, v_after - v_pd, v_err;
end $$;

-- 4. BUAT BOOKING (harga dihitung di server, tidak bisa dimanipulasi client) --
create or replace function public.create_booking(
  p_listing_id uuid, p_start_date date, p_months integer,
  p_promo_code text default null, p_note text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  l public.listings%rowtype;
  r record;
  v_id uuid;
begin
  if v_uid is null then raise exception 'Silakan login terlebih dahulu'; end if;

  select * into l from public.listings where id = p_listing_id;
  if not found or l.status <> 'published' then
    raise exception 'Kos tidak tersedia untuk dibooking';
  end if;
  if l.owner_id = v_uid then raise exception 'Kamu tidak bisa membooking kos milikmu sendiri'; end if;
  if l.room_available < 1 then raise exception 'Kamar sudah penuh'; end if;
  if p_start_date is null or p_start_date < current_date then
    raise exception 'Tanggal masuk tidak valid';
  end if;

  if exists (
    select 1 from public.bookings b
    where b.listing_id = p_listing_id and b.tenant_id = v_uid
      and (b.status = 'pending'
           or (b.status = 'confirmed' and b.start_date + make_interval(months => b.months) >= current_date))
  ) then
    raise exception 'Kamu sudah punya booking aktif untuk kos ini';
  end if;

  select * into r from public.calc_booking_price(p_listing_id, p_months, p_promo_code);
  if r.promo_error is not null then raise exception '%', r.promo_error; end if;

  insert into public.bookings (
    listing_id, tenant_id, start_date, months, monthly_price,
    duration_percent, duration_discount, promo_code, promo_discount, total_price, note)
  values (
    p_listing_id, v_uid, p_start_date, p_months, r.monthly_price,
    r.duration_percent, r.duration_discount, r.promo_code, r.promo_discount, r.total, p_note)
  returning id into v_id;

  return v_id;
end $$;

-- 5. UBAH STATUS BOOKING --------------------------------------
--   penyewa : pending -> cancelled
--   pemilik : pending -> confirmed / rejected  (confirmed mengurangi jumlah kamar)
create or replace function public.update_booking_status(p_booking_id uuid, p_status text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  b public.bookings%rowtype;
  l public.listings%rowtype;
begin
  if v_uid is null then raise exception 'Silakan login terlebih dahulu'; end if;

  select * into b from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Booking tidak ditemukan'; end if;
  select * into l from public.listings where id = b.listing_id for update;

  if p_status = 'cancelled' then
    if b.tenant_id <> v_uid then raise exception 'Tidak diizinkan'; end if;
    if b.status <> 'pending' then
      raise exception 'Hanya booking yang menunggu konfirmasi yang bisa dibatalkan';
    end if;
  elsif p_status in ('confirmed', 'rejected') then
    if not (l.owner_id = v_uid or public.is_admin()) then raise exception 'Tidak diizinkan'; end if;
    if b.status <> 'pending' then raise exception 'Booking ini sudah diproses'; end if;
    if p_status = 'confirmed' then
      if l.room_available < 1 then raise exception 'Kamar sudah penuh'; end if;
      update public.listings
         set room_available = room_available - 1,
             status = case when room_available - 1 = 0 then 'full' else status end
       where id = l.id;
    end if;
  else
    raise exception 'Status tidak valid';
  end if;

  update public.bookings set status = p_status where id = p_booking_id;
end $$;

-- 6. RLS --------------------------------------------------
alter table public.duration_discounts enable row level security;
alter table public.promos enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "dd_read" on public.duration_discounts;
create policy "dd_read" on public.duration_discounts for select using (true);

-- promos: tidak ada policy baca, jadi kode tidak bisa dilihat dari client.
-- Validasi hanya lewat calc_booking_price(). Kelola promo lewat SQL Editor / dashboard.

-- bookings: hanya bisa DIBACA langsung. Tulis lewat fungsi di atas.
drop policy if exists "bookings_read" on public.bookings;
create policy "bookings_read" on public.bookings for select
  using (
    tenant_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid())
  );

-- 7. HAK EKSEKUSI ------------------------------------------
revoke execute on function public.create_booking(uuid, date, integer, text, text) from public, anon;
revoke execute on function public.update_booking_status(uuid, text) from public, anon;
grant execute on function public.create_booking(uuid, date, integer, text, text) to authenticated;
grant execute on function public.update_booking_status(uuid, text) to authenticated;
grant execute on function public.calc_booking_price(uuid, integer, text) to anon, authenticated;
