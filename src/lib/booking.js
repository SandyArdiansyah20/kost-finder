import { supabase } from './supabaseClient'

export const DURATIONS = [1, 3, 6, 12]

export const STATUS = {
  pending:   { label: 'Menunggu konfirmasi', cls: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Dikonfirmasi',        cls: 'bg-emerald-100 text-emerald-800' },
  rejected:  { label: 'Ditolak',             cls: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Dibatalkan',          cls: 'bg-slate-200 text-slate-600' },
  completed: { label: 'Selesai',             cls: 'bg-sky-100 text-sky-800' },
}

// Tanggal lokal (bukan UTC) dalam format YYYY-MM-DD untuk <input type="date">
export function todayLocal() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export function endDate(start, months) {
  const d = new Date(`${start}T00:00:00`)
  d.setMonth(d.getMonth() + months)
  return d
}

export const fmtDate = (d) =>
  (typeof d === 'string' ? new Date(`${d}T00:00:00`) : d)
    .toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

// Harga dihitung di database supaya sama persis dengan yang disimpan saat booking
export async function previewBooking(listingId, months, promoCode) {
  const { data, error } = await supabase.rpc('calc_booking_price', {
    p_listing_id: listingId,
    p_months: months,
    p_promo_code: promoCode || null,
  })
  return { quote: data?.[0] ?? null, error }
}
