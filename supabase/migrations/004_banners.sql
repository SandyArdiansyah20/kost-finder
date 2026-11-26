-- =====================================================
-- Banner promo bergerak di hero beranda
-- Jalankan di SQL Editor. Aman dijalankan ulang.
-- =====================================================

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  cta_label text,
  cta_link text,                      -- '/register', '#hasil', atau 'https://...'
  image_url text,                     -- opsional; kosong = latar warna
  theme text not null default 'pine' check (theme in ('pine','brass','ink')),
  position integer not null default 0,
  is_active boolean not null default true,
  starts_at date,                     -- null = langsung tayang
  ends_at date,                       -- null = tanpa batas
  created_at timestamptz not null default now()
);

alter table public.banners enable row level security;

-- Publik hanya melihat banner yang aktif dan sedang dalam masa tayang
drop policy if exists "banners_public_read" on public.banners;
create policy "banners_public_read" on public.banners for select
  using (is_active
         and (starts_at is null or starts_at <= current_date)
         and (ends_at is null or ends_at >= current_date));

-- Admin boleh melihat dan mengubah semuanya
drop policy if exists "banners_admin_all" on public.banners;
create policy "banners_admin_all" on public.banners for all
  using (public.is_admin()) with check (public.is_admin());

-- Bucket untuk gambar banner (unggah lewat Dashboard > Storage)
insert into storage.buckets (id, name, public) values ('banners', 'banners', true)
on conflict (id) do nothing;
