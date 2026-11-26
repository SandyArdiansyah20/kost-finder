import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, rupiah } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth.jsx'
import { STATUS, endDate, fmtDate } from '../lib/booking.js'

export default function MyBookings() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    const { data, error } = await supabase.from('bookings')
      .select('*, listings(id, title, city, listing_images(image_url, position))')
      .eq('tenant_id', user.id).order('created_at', { ascending: false })
    if (error) setError(error.message)
    setItems(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const cancel = async (id) => {
    if (!confirm('Batalkan booking ini?')) return
    const { error } = await supabase.rpc('update_booking_status', { p_booking_id: id, p_status: 'cancelled' })
    if (error) setError(error.message); else load()
  }

  if (loading) return <p className="text-slate-500">Memuat…</p>
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Booking saya</h1>
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {items.length === 0 && (
        <p className="py-10 text-center text-slate-500">Belum ada booking. <Link to="/" className="font-semibold text-pine">Cari kos</Link></p>
      )}
      {items.map((b) => {
        const s = STATUS[b.status]
        const cover = [...(b.listings?.listing_images ?? [])].sort((a, c) => a.position - c.position)[0]?.image_url
        return (
          <div key={b.id} className="flex flex-wrap gap-4 rounded-xl bg-white p-4 shadow-sm">
            {cover ? <img src={cover} alt="" className="h-24 w-32 rounded-lg object-cover" />
              : <div className="grid h-24 w-32 place-items-center rounded-lg bg-slate-200 text-xs text-slate-500">Tanpa foto</div>}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {b.listings ? <Link to={`/kos/${b.listings.id}`} className="font-bold hover:underline">{b.listings.title}</Link> : <span className="font-bold">Kos tidak tersedia</span>}
                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>
              </div>
              <p className="text-sm text-slate-600">{b.listings?.city}</p>
              <p className="text-sm">{fmtDate(b.start_date)} – {fmtDate(endDate(b.start_date, b.months))} ({b.months} bulan)</p>
              <p className="font-extrabold text-pine">{rupiah(b.total_price)}
                {(b.duration_discount + b.promo_discount) > 0 && <span className="ml-2 text-xs font-medium text-emerald-700">hemat {rupiah(b.duration_discount + b.promo_discount)}</span>}
              </p>
              {b.promo_code && <p className="text-xs text-slate-500">Kode promo: {b.promo_code}</p>}
            </div>
            {b.status === 'pending' && <button className="btn-ghost self-start text-red-600" onClick={() => cancel(b.id)}>Batalkan</button>}
          </div>
        )
      })}
    </div>
  )
}
