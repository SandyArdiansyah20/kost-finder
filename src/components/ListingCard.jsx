import { Link } from 'react-router-dom'
import { rupiah } from '../lib/supabaseClient'

export default function ListingCard({ listing, isFav, onToggleFav, rating, reviews }) {
  const images = [...(listing.listing_images ?? [])].sort((a, b) => a.position - b.position)
  const cover = images[0]?.image_url

  return (
    <article className="overflow-hidden rounded-xl bg-white shadow-sm">
      <Link to={`/kos/${listing.id}`}>
        {cover
          ? <img src={cover} alt={listing.title} className="h-44 w-full object-cover" loading="lazy" />
          : <div className="grid h-44 place-items-center bg-slate-200 text-sm text-slate-500">Belum ada foto</div>}
      </Link>
      <div className="space-y-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/kos/${listing.id}`} className="font-bold leading-snug hover:underline">{listing.title}</Link>
          {onToggleFav && (
            <button onClick={() => onToggleFav(listing.id)} aria-label="Simpan ke favorit"
              className="text-xl leading-none text-brass">{isFav ? '★' : '☆'}</button>
          )}
        </div>
        <p className="text-sm text-slate-600">{listing.city} · Kos {listing.gender_type}</p>
        {reviews > 0 && <p className="text-sm text-brass">★ {rating.toFixed(1)} <span className="text-slate-500">({reviews} ulasan)</span></p>}
        <p className="font-extrabold text-pine">{rupiah(listing.price_monthly)}<span className="text-xs font-medium text-slate-500"> /bulan</span></p>
        <div className="mt-2">
          {listing.status === 'full' || listing.room_available <= 0 ? (
            <span className="text-xs font-medium text-red-600">
              Kamar Penuh
            </span>
          ) : (
            <span className="text-xs font-medium text-emerald-700">
              Kamar Tersedia {listing.room_available}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
