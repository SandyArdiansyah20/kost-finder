import { Link } from 'react-router-dom'
import { rupiah } from '../lib/supabaseClient'

export default function ListingCard({ listing, isFav, onToggleFav, rating, reviews }) {
  const images = [...(listing.listing_images ?? [])].sort((a, b) => a.position - b.position)
  const cover = images[0]?.image_url
  const isFull = listing.status === 'full' || listing.room_available <= 0

  return (
    <article className="overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md">
      <div className="relative">
        <Link to={`/kos/${listing.id}`}>
          {cover
            ? <img src={cover} alt={listing.title} className="h-44 w-full object-cover" loading="lazy" />
            : <div className="grid h-44 place-items-center bg-slate-200 text-sm text-slate-500">Belum ada foto</div>}
        </Link>

        {onToggleFav && (
          <button
            type="button"
            onClick={() => onToggleFav(listing.id)}
            aria-label="Simpan ke favorit"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-2xl leading-none text-brass"
          >
            <span className="-translate-y-[1px] translate-x-[0.5px]">
              {isFav ? '★' : '☆'}
            </span>
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/kos/${listing.id}`} className="font-bold leading-snug text-slate-900 hover:underline">
            {listing.title}
          </Link>
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-slate-700">
            <svg className="h-4 w-4 text-brass" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
            </svg>
            {listing.city}
          </span>
        </div>

        <p className="mt-0.5 text-xs capitalize text-slate-500">
          Kost {listing.gender_type}
        </p>

        {reviews > 0 && (
          <p className="mt-1.5 text-xs font-medium text-brass">
            ★ {rating.toFixed(1)} <span className="text-slate-500">({reviews} ulasan)</span>
          </p>
        )}

        <p className="mt-2 font-extrabold text-pine">
          {rupiah(listing.price_monthly)}
          <span className="text-xs font-medium text-slate-500"> /bulan</span>
        </p>

        <div className={`mt-2.5 flex items-center gap-1.5 text-xs font-medium ${isFull ? 'text-red-600' : 'text-emerald-700'}`}>
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v11m0-4h18m0 4v-8a2 2 0 0 0-2-2H9v6m-6 0h6m-3-3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
          </svg>
          <span>{isFull ? 'Kamar Penuh' : `${listing.room_available} Tersedia`}</span>
        </div>
      </div>
    </article>
  )
}