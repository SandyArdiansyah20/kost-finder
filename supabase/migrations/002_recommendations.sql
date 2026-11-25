-- =====================================================
-- Rekomendasi per kota
-- Jalankan di SQL Editor setelah 001_schema.sql
-- =====================================================

-- Kota dengan listing terbanyak (hanya kos yang tayang)
create or replace function public.popular_cities(p_limit integer default 4)
returns table (city text, total bigint)
language sql stable security definer set search_path = public as $$
  select min(trim(l.city)) as city, count(*) as total
  from public.listings l
  where l.status in ('published','full')
  group by lower(trim(l.city))
  order by 2 desc, 1 asc
  limit greatest(p_limit, 1);
$$;

-- Kos terbaik, bisa difilter per kota.
-- Skor = rating rata-rata x ln(1 + jumlah ulasan) + 0,5 x jumlah favorit
-- (security definer agar jumlah favorit semua user bisa dihitung; hanya angka agregat yang keluar)
create or replace function public.recommended_listings(p_city text default null, p_limit integer default 6)
returns table (listing_id uuid, avg_rating numeric, review_count bigint, fav_count bigint, score numeric)
language sql stable security definer set search_path = public as $$
  select
    l.id,
    round(coalesce(r.avg_r, 0)::numeric, 1),
    coalesce(r.cnt, 0),
    coalesce(f.cnt, 0),
    round((coalesce(r.avg_r, 0)::float8 * ln(1 + coalesce(r.cnt, 0)::float8)
           + coalesce(f.cnt, 0)::float8 * 0.5)::numeric, 2)
  from public.listings l
  left join (select rv.listing_id as lid, avg(rv.rating) as avg_r, count(*) as cnt
             from public.reviews rv group by rv.listing_id) r on r.lid = l.id
  left join (select fv.listing_id as lid, count(*) as cnt
             from public.favorites fv group by fv.listing_id) f on f.lid = l.id
  where l.status in ('published','full')
    and (p_city is null or lower(trim(l.city)) = lower(trim(p_city)))
  order by 5 desc, l.created_at desc
  limit greatest(p_limit, 1);
$$;

grant execute on function public.popular_cities(integer) to anon, authenticated;
grant execute on function public.recommended_listings(text, integer) to anon, authenticated;
