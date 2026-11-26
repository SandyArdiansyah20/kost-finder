import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import FilterBar from '../components/FilterBar.jsx'
import ListingCard from '../components/ListingCard.jsx'
import CityRecommendations from '../components/CityRecommendations.jsx'
import HeroCarousel from '../components/HeroCarousel.jsx'
import { Icon } from '../components/Icons.jsx'
import { useFavorites } from '../hooks/useFavorites.js'
import { useAuth } from '../hooks/useAuth.jsx'

const EMPTY = { city: '', gender: '', min: '', max: '' }
const TYPES = [['', 'Semua'], ['putra', 'Putra'], ['putri', 'Putri'], ['campur', 'Campur']]
const BENEFITS = [
  ['calendar', 'Booking online', 'Pilih durasi dan tanggal masuk, lalu pemilik mengonfirmasi langsung di aplikasi.'],
  ['tag', 'Harga jelas di depan', 'Diskon durasi dan kode promo terhitung sebelum kamu menekan booking.'],
  ['star', 'Ulasan dari penghuni', 'Baca pengalaman penyewa sebelumnya sebelum memutuskan.'],
]

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/80" aria-hidden="true">
      <div className="skeleton aspect-[4/3]" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="skeleton h-6 w-1/3 rounded" />
      </div>
    </div>
  )
}

export default function Home() {
  const [filters, setFilters] = useState(EMPTY)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [discounts, setDiscounts] = useState([])
  const { ids, toggle } = useFavorites()
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('duration_discounts').select('*').order('months')
      .then(({ data }) => setDiscounts((data ?? []).filter((d) => Number(d.percent) > 0)))
  }, [])

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true)
      let q = supabase.from('listings')
        .select('*, listing_images(image_url, position), listing_facilities(facilities(name))')
        .in('status', ['published', 'full'])
        .order('created_at', { ascending: false })
      if (filters.city) q = q.ilike('city', `%${filters.city}%`)
      if (filters.gender) q = q.eq('gender_type', filters.gender)
      if (filters.min) q = q.gte('price_monthly', Number(filters.min))
      if (filters.max) q = q.lte('price_monthly', Number(filters.max))
      const { data, error } = await q
      if (error) setError(error.message)
      else { setError(''); setListings(data) }
      setLoading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [filters])

  const onFav = (id) => (user ? toggle(id) : navigate('/login'))
  const noFilter = !filters.city && !filters.gender && !filters.min && !filters.max
  const toResults = () => document.getElementById('hasil')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <>
      <HeroCarousel discounts={discounts} />

      <div className="relative z-10 mx-auto -mt-12 max-w-6xl px-4">
        <FilterBar filters={filters} onChange={setFilters} onSubmit={toResults} />
      </div>

      <div className="mx-auto max-w-6xl space-y-12 px-4 pt-8">
        {discounts.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-pine-soft px-5 py-4">
            <span className="flex items-center gap-2 font-bold text-pine"><Icon name="tag" />Sewa lebih lama, bayar lebih hemat</span>
            <ul className="flex flex-wrap gap-2 text-sm font-semibold">
              {discounts.map((d) => (
                <li key={d.months} className="rounded-full bg-white px-3 py-1 text-pine">{d.months} bulan hemat {Number(d.percent)}%</li>
              ))}
            </ul>
          </div>
        )}

        {noFilter && (
          <CityRecommendations
            onPickCity={(city) => { setFilters({ ...filters, city }); toResults() }}
            isFav={(id) => ids.has(id)}
            onToggleFav={onFav}
          />
        )}

        <section id="hasil" className="scroll-mt-24 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-extrabold">{noFilter ? 'Semua kos' : 'Hasil pencarian'}</h2>
            {!loading && <p className="text-sm text-slate-600">{listings.length} kos ditemukan</p>}
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter tipe kos">
            {TYPES.map(([v, t]) => (
              <button key={v} type="button" className="chip" aria-pressed={filters.gender === v}
                onClick={() => setFilters({ ...filters, gender: v })}>{t}</button>
            ))}
          </div>

          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">Gagal memuat data: {error}</p>}

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-2xl bg-white px-6 py-14 text-center ring-1 ring-slate-200/80">
              <Icon name="search" className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 font-bold">Belum ada kos yang cocok</p>
              <p className="mt-1 text-sm text-slate-600">Coba ganti kota, tipe, atau naikkan batas harga.</p>
              <button className="btn mt-4" onClick={() => setFilters(EMPTY)}>Hapus semua filter</button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => <ListingCard key={l.id} listing={l} isFav={ids.has(l.id)} onToggleFav={onFav} />)}
            </div>
          )}
        </section>

        {noFilter && (
          <section className="space-y-5">
            <h2 className="text-2xl font-extrabold">Kenapa pakai KostFinder</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {BENEFITS.map(([icon, title, text]) => (
                <div key={title} className="flex gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-pine-soft text-pine"><Icon name={icon} /></span>
                  <div>
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
