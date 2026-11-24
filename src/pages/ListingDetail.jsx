import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase, rupiah } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth.jsx'

export default function ListingDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [l, setL] = useState(null)
  const [reviews, setReviews] = useState([])
  const [active, setActive] = useState(0)
  const [msg, setMsg] = useState('')
  const [notice, setNotice] = useState('')
  const [rev, setRev] = useState({ rating: 5, comment: '' })
  const [notFound, setNotFound] = useState(false)

  const loadReviews = async () => {
    const { data } = await supabase.from('reviews')
      .select('*, profiles(full_name)').eq('listing_id', id).order('created_at', { ascending: false })
    setReviews(data ?? [])
  }

  useEffect(() => {
    supabase.from('listings')
      .select('*, listing_images(image_url, position), listing_facilities(facilities(name)), profiles:owner_id(full_name, phone)')
      .eq('id', id).single()
      .then(({ data, error }) => (error ? setNotFound(true) : setL(data)))
    loadReviews()
  }, [id])

  const sendInquiry = async (e) => {
    e.preventDefault()
    if (!user) return navigate('/login')
    const { error } = await supabase.from('inquiries').insert({ listing_id: id, seeker_id: user.id, message: msg })
    setNotice(error ? `Gagal mengirim: ${error.message}` : 'Pesan terkirim ke pemilik.')
    if (!error) setMsg('')
  }

  const sendReview = async (e) => {
    e.preventDefault()
    if (!user) return navigate('/login')
    const { error } = await supabase.from('reviews').insert({ listing_id: id, user_id: user.id, ...rev })
    if (error) setNotice(error.code === '23505' ? 'Kamu sudah pernah memberi ulasan untuk kos ini.' : error.message)
    else { setRev({ rating: 5, comment: '' }); loadReviews() }
  }

  if (notFound) return <p className="py-20 text-center">Kos tidak ditemukan. <Link to="/" className="text-pine underline">Kembali</Link></p>
  if (!l) return <p className="text-slate-500">Memuat…</p>

  const images = [...l.listing_images].sort((a, b) => a.position - b.position)
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null
  const wa = l.profiles?.phone ? `https://wa.me/${l.profiles.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo, saya tertarik dengan kos "${l.title}" di KostFinder.`)}` : null

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div>
          {images.length
            ? <img src={images[active].image_url} alt={l.title} className="h-80 w-full rounded-xl object-cover" />
            : <div className="grid h-80 place-items-center rounded-xl bg-slate-200 text-slate-500">Belum ada foto</div>}
          {images.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {images.map((im, i) => (
                <button key={im.image_url} onClick={() => setActive(i)} aria-label={`Foto ${i + 1}`}>
                  <img src={im.image_url} alt="" className={`h-16 w-24 rounded object-cover ${i === active ? 'ring-2 ring-pine' : 'opacity-70'}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{l.title}</h1>
          <p className="mt-1 text-slate-600">{l.address ? `${l.address}, ` : ''}{l.city} · Kos {l.gender_type} · {l.room_available} kamar tersedia</p>
          {avg && <p className="mt-1 text-sm text-brass">★ {avg} ({reviews.length} ulasan)</p>}
        </div>

        {l.description && <p className="whitespace-pre-line leading-relaxed">{l.description}</p>}

        <div>
          <h2 className="mb-2 font-bold">Fasilitas</h2>
          <ul className="flex flex-wrap gap-2">
            {l.listing_facilities.map((f) => (
              <li key={f.facilities.name} className="rounded-full bg-white px-3 py-1 text-sm shadow-sm">{f.facilities.name}</li>
            ))}
          </ul>
        </div>

        <section className="space-y-4">
          <h2 className="font-bold">Ulasan</h2>
          {user && (
            <form onSubmit={sendReview} className="space-y-2 rounded-xl bg-white p-4 shadow-sm">
              <select className="input w-32" value={rev.rating} onChange={(e) => setRev({ ...rev, rating: Number(e.target.value) })}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
              </select>
              <textarea className="input" rows="2" placeholder="Ceritakan pengalamanmu" value={rev.comment} onChange={(e) => setRev({ ...rev, comment: e.target.value })} />
              <button className="btn">Kirim ulasan</button>
            </form>
          )}
          {reviews.length === 0 && <p className="text-sm text-slate-500">Belum ada ulasan.</p>}
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold">{r.profiles?.full_name ?? 'Pengguna'} <span className="text-brass">{'★'.repeat(r.rating)}</span></p>
              {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
            </div>
          ))}
        </section>
      </div>

      <aside className="h-fit space-y-4 rounded-xl bg-white p-5 shadow-sm lg:sticky lg:top-20">
        <p className="text-2xl font-extrabold text-pine">{rupiah(l.price_monthly)}<span className="text-sm font-medium text-slate-500"> /bulan</span></p>
        <p className="text-sm text-slate-600">Pemilik: {l.profiles?.full_name}</p>
        {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn w-full">Hubungi lewat WhatsApp</a>}
        <form onSubmit={sendInquiry} className="space-y-2">
          <textarea className="input" rows="3" required placeholder="Tulis pertanyaan untuk pemilik" value={msg} onChange={(e) => setMsg(e.target.value)} />
          <button className="btn-ghost w-full">Kirim pesan</button>
        </form>
        {notice && <p className="text-sm text-pine">{notice}</p>}
      </aside>
    </div>
  )
}
