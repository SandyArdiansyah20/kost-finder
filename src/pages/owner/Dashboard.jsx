import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, rupiah } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth.jsx'

const LABEL = { draft: 'Draf', published: 'Tayang', full: 'Penuh' }

export default function Dashboard() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const { data } = await supabase.from('listings').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })
    setItems(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const setStatus = async (id, status) => {
    await supabase.from('listings').update({ status }).eq('id', id)
    load()
  }

  const remove = async (id) => {
    if (!confirm('Hapus kos ini? Tindakan ini tidak bisa dibatalkan.')) return
    await supabase.from('listings').delete().eq('id', id)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold">Kos saya</h1>
        <div className="flex gap-2">
          <Link to="/owner/inquiries" className="btn-ghost">Pesan masuk</Link>
          <Link to="/owner/new" className="btn">Tambah kos</Link>
        </div>
      </div>
      {loading ? <p className="text-slate-500">Memuat…</p>
        : items.length === 0 ? <p className="py-10 text-center text-slate-500">Belum ada kos. Tambahkan listing pertamamu.</p>
        : (
          <div className="space-y-3">
            {items.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm">
                <div>
                  <Link to={`/kos/${l.id}`} className="font-bold hover:underline">{l.title}</Link>
                  <p className="text-sm text-slate-600">{l.city} · {rupiah(l.price_monthly)} · {LABEL[l.status]}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select className="input w-auto" value={l.status} onChange={(e) => setStatus(l.id, e.target.value)} aria-label="Status">
                    {Object.entries(LABEL).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                  </select>
                  <Link to={`/owner/edit/${l.id}`} className="btn-ghost">Ubah</Link>
                  <button onClick={() => remove(l.id)} className="btn-ghost text-red-600">Hapus</button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
