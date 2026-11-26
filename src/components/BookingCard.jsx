import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, rupiah } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth.jsx'
import { DURATIONS, previewBooking, todayLocal } from '../lib/booking.js'

export default function BookingCard({ listing }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [months, setMonths] = useState(3)
  const [start, setStart] = useState(todayLocal())
  const [codeInput, setCodeInput] = useState('')
  const [applied, setApplied] = useState('')
  const [note, setNote] = useState('')
  const [discounts, setDiscounts] = useState({})
  const [quote, setQuote] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const unavailable = listing.status !== 'published' || listing.room_available < 1
  const isOwner = user?.id === listing.owner_id

  useEffect(() => {
    supabase.from('duration_discounts').select('*').then(({ data }) =>
      setDiscounts(Object.fromEntries((data ?? []).map((d) => [d.months, Number(d.percent)])))
    )
  }, [])

  useEffect(() => {
    let cancelled = false
    previewBooking(listing.id, months, applied).then(({ quote, error }) => {
      if (cancelled) return
      if (error) setError(error.message)
      else { setQuote(quote); setError('') }
    })
    return () => { cancelled = true }
  }, [listing.id, months, applied])

  const submit = async () => {
    if (!user) return navigate('/login')
    setBusy(true); setError('')
    const { error } = await supabase.rpc('create_booking', {
      p_listing_id: listing.id,
      p_start_date: start,
      p_months: months,
      p_promo_code: applied || null,
      p_note: note || null,
    })
    setBusy(false)
    if (error) setError(error.message)
    else navigate('/bookings')
  }

  const q = quote && {
    price: Number(quote.monthly_price), sub: Number(quote.subtotal),
    dPct: Number(quote.duration_percent), dDisc: Number(quote.duration_discount),
    pDisc: Number(quote.promo_discount), total: Number(quote.total),
  }

  return (
    <div className="space-y-4 border-t border-slate-200 pt-4">
      <div>
        <p className="mb-2 text-sm font-semibold">Durasi sewa</p>
        <div className="grid grid-cols-4 gap-2">
          {DURATIONS.map((m) => (
            <button key={m} type="button" onClick={() => setMonths(m)} aria-pressed={months === m}
              className={`rounded-lg border px-1 py-2 text-center text-sm ${months === m ? 'border-pine bg-pine text-white' : 'border-slate-300 bg-white hover:bg-slate-50'}`}>
              <span className="block font-bold">{m} bln</span>
              <span className={`block text-[11px] ${months === m ? 'text-white/80' : 'text-brass'}`}>
                {discounts[m] ? `Hemat ${discounts[m]}%` : '\u00A0'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <label className="block text-sm font-semibold">Tanggal masuk
        <input type="date" className="input mt-1" min={todayLocal()} value={start} onChange={(e) => setStart(e.target.value)} />
      </label>

      <div>
        <label htmlFor="promo" className="text-sm font-semibold">Kode promo</label>
        <div className="mt-1 flex gap-2">
          <input id="promo" className="input uppercase" placeholder="mis. HEMAT10" value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)} />
          <button type="button" className="btn-ghost" onClick={() => setApplied(codeInput.trim().toUpperCase())}>Pakai</button>
        </div>
        {quote?.promo_error && <p className="mt-1 text-xs text-red-600">{quote.promo_error}</p>}
        {applied && q && !quote.promo_error && q.pDisc > 0 && (
          <p className="mt-1 text-xs text-emerald-700">Kode {applied} dipakai.</p>
        )}
      </div>

      {q && (
        <dl className="space-y-1 rounded-lg bg-mist p-3 text-sm">
          <div className="flex justify-between"><dt>{rupiah(q.price)} × {months} bulan</dt><dd>{rupiah(q.sub)}</dd></div>
          {q.dDisc > 0 && <div className="flex justify-between text-emerald-700"><dt>Diskon durasi ({q.dPct}%)</dt><dd>−{rupiah(q.dDisc)}</dd></div>}
          {q.pDisc > 0 && <div className="flex justify-between text-emerald-700"><dt>Diskon promo</dt><dd>−{rupiah(q.pDisc)}</dd></div>}
          <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-extrabold">
            <dt>Total</dt><dd>{rupiah(q.total)}</dd>
          </div>
          <p className="text-xs text-slate-500">≈ {rupiah(Math.round(q.total / months))} per bulan</p>
        </dl>
      )}

      <textarea className="input" rows="2" placeholder="Catatan untuk pemilik (opsional)" value={note} onChange={(e) => setNote(e.target.value)} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isOwner ? <p className="text-sm text-slate-500">Ini kos milikmu sendiri.</p>
        : unavailable ? <p className="text-sm font-semibold text-red-600">Kamar sedang penuh.</p>
        : <button className="btn w-full" onClick={submit} disabled={busy || !q}>
            {busy ? 'Memproses…' : user ? 'Booking sekarang' : 'Masuk untuk booking'}
          </button>}
      <p className="text-xs text-slate-500">Booking menunggu konfirmasi pemilik. Pembayaran dilakukan langsung dengan pemilik.</p>
    </div>
  )
}
