import { useEffect, useState } from 'react'
import ListingCard from './ListingCard.jsx'
import { fetchRecommended } from '../lib/recommendations.js'

export default function SimilarListings({ city, excludeId }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    fetchRecommended(city, 3, excludeId).then(setItems)
  }, [city, excludeId])

  if (!items.length) return null
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-extrabold">Kos lain di {city}</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ listing, rating, reviews }) => (
          <ListingCard key={listing.id} listing={listing} rating={rating} reviews={reviews} />
        ))}
      </div>
    </section>
  )
}
