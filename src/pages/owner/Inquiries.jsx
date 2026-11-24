import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export default function Inquiries() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // RLS otomatis hanya mengembalikan pesan untuk listing milik pemilik
    supabase.from('inquiries')
      .select('*, listings(id, title), profiles:seeker_id(full_name, phone)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setItems(data ?? []); setLoading(false) })
  }, [])

  if (loading) return <p className="text-slate-500">Memuat…</p>
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Pesan masuk</h1>
      {items.length === 0 && <p className="text-slate-500">Belum ada pesan.</p>}
      {items.map((i) => (
        <div key={i.id} className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">
            {i.profiles?.full_name} untuk <Link to={`/kos/${i.listings?.id}`} className="font-semibold text-pine">{i.listings?.title}</Link>
          </p>
          <p className="mt-1">{i.message}</p>
          <p className="mt-1 text-xs text-slate-400">{new Date(i.created_at).toLocaleString('id-ID')}</p>
        </div>
      ))}
    </div>
  )
}
