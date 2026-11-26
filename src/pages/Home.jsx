import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import FilterBar from '../components/FilterBar.jsx'
import FacilityFilter from '../components/FacilityFilter.jsx'
import ListingCard from '../components/ListingCard.jsx'
import { useFavorites } from '../hooks/useFavorites.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { useNavigate } from 'react-router-dom'
import CityRecommendations from '../components/CityRecommendations.jsx'

export default function Home() {
  const [filters, setFilters] = useState({ city: '', gender: '', min: '', max: '' })
  const [facilityFilter, setFacilityFilter] = useState({ include: [], exclude: [] })
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { ids, toggle } = useFavorites()
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true)
      let q = supabase
        .from('listings_with_facilities')
        .select('*')
        .in('status', ['published', 'full'])
        .order('created_at', { ascending: false })

      if (filters.city) q = q.ilike('city', `%${filters.city}%`)
      if (filters.gender) q = q.eq('gender_type', filters.gender)
      if (filters.min) q = q.gte('price_monthly', Number(filters.min))
      if (filters.max) q = q.lte('price_monthly', Number(filters.max))

      if (facilityFilter.include.length > 0) {
        q = q.contains('facility_names', facilityFilter.include)
      }

      for (const name of facilityFilter.exclude) {
        q = q.not('facility_names', 'cs', `{"${name}"}`)
      }

      const { data, error } = await q
      if (error) setError(error.message)
      else {
        setError('')
        setListings(data)
      }
      setLoading(false)
    }, 300) // debounce
    return () => clearTimeout(t)
  }, [filters, facilityFilter])

  const onFav = (id) => (user ? toggle(id) : navigate('/login'))
  const noFilter = !filters.city && !filters.gender && !filters.min && !filters.max

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Cari kos yang cocok untukmu</h1>
        <p className="mt-1 text-slate-600">Filter berdasarkan kota, tipe, rentang harga, dan fasilitas.</p>
      </div>

      <div className="space-y-4">
        <FilterBar filters={filters} onChange={setFilters} />
        {noFilter && (
          <>
            <CityRecommendations
              onPickCity={(city) => setFilters({ ...filters, city })}
              isFav={(id) => ids.has(id)}
              onToggleFav={onFav}
            />
            <h2 className="text-xl font-extrabold">Semua kos</h2>
          </>
        )}
        <FacilityFilter value={facilityFilter} onChange={setFacilityFilter} />
      </div>

      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">Gagal memuat data: {error}</p>}
      {loading ? <p className="text-slate-500">Memuat…</p>
        : listings.length === 0 ? <p className="py-10 text-center text-slate-500">Tidak ada kos yang cocok. Coba ubah filter.</p>
          : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => <ListingCard key={l.id} listing={l} isFav={ids.has(l.id)} onToggleFav={onFav} />)}
            </div>
          )}
    </div>
  )
}