import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, rupiah } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth.jsx'
import { STATUS, endDate, fmtDate } from '../../lib/booking.js'

export default function OwnerBookings() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    const { data, error } = await supabase.from('bookings')
      .select('*, listings!inner(id, title, owner_id), profiles:tenant_id(full_name, phone)')
      .eq('listings.owner_id', user.id)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    // yang menunggu konfirmasi ditampilkan paling atas
    setItems((data ?? []).sort((a, b) => (b.status === 'pending') - (a.status === 'pending')))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const act = async (id, status) => {
    setError('')
    const { error } = await supabase.rpc('update_booking_status', { p_booking_id: id, p_status: status })
    if (error) setError(error.message); else load()
  }

  if (loading) return <p className="text-slate-500">Memuat…</p>
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Booking masuk</h1>
        <Link to="/owner" className="btn-ghost">Kembali</Link>
      </div>
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {items.length === 0 && <p className="py-10 text-center text-slate-500">Belum ada booking.</p>}
      {items.map((b) => {
        const s = STATUS[b.status]
        const phone = b.profiles?.phone?.replace(/\D/g, '')
        return (
          <div key={b.id} className="space-y-2 rounded-xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold">{b.profiles?.full_name ?? 'Penyewa'} <span className="font-normal text-slate-500">untuk</span> {b.listings.title}</p>
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>
            </div>
            <p className="text-sm">{fmtDate(b.start_date)} – {fmtDate(endDate(b.start_date, b.months))} ({b.months} bulan)</p>
            <p className="font-extrabold text-pine">{rupiah(b.total_price)}
              {b.promo_code && <span className="ml-2 text-xs font-medium text-slate-500">promo {b.promo_code}</span>}
            </p>
            {b.note && <p className="rounded bg-mist p-2 text-sm">“{b.note}”</p>}
            <div className="flex flex-wrap gap-2 pt-1">
              {b.status === 'pending' && (
                <>
                  <button className="btn" onClick={() => act(b.id, 'confirmed')}>Terima</button>
                  <button className="btn-ghost text-red-600" onClick={() => act(b.id, 'rejected')}>Tolak</button>
                </>
              )}
              {phone && <a className="btn-ghost" target="_blank" rel="noreferrer"
                href={`https://wa.me/${phone}?text=${encodeURIComponent(`Halo ${b.profiles.full_name}, terkait booking ${b.listings.title} di KostFinder.`)}`}>WhatsApp penyewa</a>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
