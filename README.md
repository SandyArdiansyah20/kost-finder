# KostFinder

Aplikasi pencari kos. React + Vite + Tailwind v4 + Supabase.

## Mulai cepat
1. Buat project di https://supabase.com
2. Buka **SQL Editor**, tempel isi `supabase/migrations/001_schema.sql`, lalu **Run**
3. Salin `.env.example` menjadi `.env`, isi URL dan anon key (Project Settings > API)
4. Jalankan:
   ```
   npm install
   npm run dev
   ```
5. (Opsional saat development) Authentication > Providers > Email: matikan "Confirm email" agar bisa langsung login.

## Membuat akun admin
Daftar seperti biasa, lalu jalankan di SQL Editor:
```sql
update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'email-kamu@contoh.com');
```

## Kerja berdua
- Branch: `main`, `dev`, dan `feat/nama-fitur` lalu Pull Request
- Perubahan database: tambah file baru `supabase/migrations/002_xxx.sql`, jangan edit file lama
- Jangan commit `.env`

## Ide pengembangan lanjutan
- Peta Leaflet di halaman detail (kolom latitude/longitude sudah ada)
- Rata-rata rating di kartu (view `listing_ratings` sudah ada)
- Verifikasi listing oleh admin
- Pagination dan full-text search

## Rekomendasi per kota
Jalankan `supabase/migrations/002_recommendations.sql` di SQL Editor. Skor = rating x ln(1 + jumlah ulasan) + 0,5 x jumlah favorit.

## Booking dengan durasi dan diskon
Jalankan `supabase/migrations/003_booking.sql` di SQL Editor.
- Durasi 1/3/6/12 bulan; diskon durasi ada di tabel `duration_discounts` (3 bln 5%, 6 bln 8%, 12 bln 11%)
- Kode promo ada di tabel `promos` (contoh `HEMAT10`). Tambah promo lewat SQL Editor:
  `insert into promos (code, discount_percent, max_discount, min_months) values ('KOSTBARU', 15, 300000, 6);`
- Harga dihitung di database (`calc_booking_price`), jadi tidak bisa dimanipulasi dari browser
- Alur: penyewa booking (pending) -> pemilik Terima/Tolak -> kamar berkurang saat diterima
