import { useEffect, useState } from 'react'
import ListingCard from './ListingCard.jsx'
import { fetchPopularCities, fetchRecommended } from '../lib/recommendations.js'

export default function CityRecommendations({ onPickCity, isFav, onToggleFav }) {
  const [sections, setSections] = useState([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const cities = await fetchPopularCities(4)
      const result = await Promise.all(
        cities.map(async (c) => ({ city: c.city, items: await fetchRecommended(c.city, 3) }))
      )
      if (!cancelled) setSections(result.filter((s) => s.items.length))
    })()
    return () => { cancelled = true }
  }, [])

  if (!sections.length) return null

  return (
    <section className="space-y-8">
      <h2 className="text-xl font-extrabold">Rekomendasi per kota</h2>
      {sections.map((s) => (
        <div key={s.city} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Pilihan terbaik di {s.city}</h3>
            <button onClick={() => onPickCity(s.city)} className="text-sm font-semibold text-pine hover:underline">
              Lihat semua di {s.city}
            </button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {s.items.map(({ listing, rating, reviews }) => (
              <ListingCard key={listing.id} listing={listing} rating={rating} reviews={reviews}
                isFav={isFav(listing.id)} onToggleFav={onToggleFav} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
