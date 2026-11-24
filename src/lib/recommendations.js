import { supabase } from './supabaseClient'

export async function fetchPopularCities(limit = 4) {
  const { data } = await supabase.rpc('popular_cities', { p_limit: limit })
  return data ?? []
}

// Mengembalikan [{ listing, rating, reviews }] urut dari skor tertinggi
export async function fetchRecommended(city, limit = 3, excludeId = null) {
  const { data: recs, error } = await supabase.rpc('recommended_listings', {
    p_city: city,
    p_limit: limit + (excludeId ? 1 : 0),
  })
  if (error || !recs?.length) return []

  const { data: rows } = await supabase
    .from('listings')
    .select('*, listing_images(image_url, position)')
    .in('id', recs.map((r) => r.listing_id))
  const byId = Object.fromEntries((rows ?? []).map((l) => [l.id, l]))

  return recs
    .filter((r) => byId[r.listing_id] && r.listing_id !== excludeId)
    .slice(0, limit)
    .map((r) => ({ listing: byId[r.listing_id], rating: Number(r.avg_rating), reviews: Number(r.review_count) }))
}
