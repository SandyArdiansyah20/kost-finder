import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth.jsx'
import ListingCard from '../components/ListingCard.jsx'

export default function Favorites() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const { data } = await supabase.from('favorites')
      .select('listing_id, listings(*, listing_images(image_url, position))')
      .eq('user_id', user.id)
    setItems((data ?? []).map((r) => r.listings).filter(Boolean))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const remove = async (id) => {
    await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', id)
    setItems((prev) => prev.filter((l) => l.id !== id))
  }

  if (loading) return <p className="text-slate-500">Memuat…</p>
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Kos favorit</h1>
      {items.length === 0
        ? <p className="text-slate-500">Belum ada favorit. Tekan ☆ pada kos yang kamu suka.</p>
        : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((l) => <ListingCard key={l.id} listing={l} isFav onToggleFav={remove} />)}
          </div>}
    </div>
  )
}
