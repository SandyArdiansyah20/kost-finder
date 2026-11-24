import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth.jsx'

const EMPTY = {
  title: '', description: '', price_monthly: '', city: '', address: '',
  latitude: '', longitude: '', gender_type: 'campur', room_available: 1, status: 'draft',
}

export default function ListingForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [facilities, setFacilities] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [files, setFiles] = useState([])
  const [existing, setExisting] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('facilities').select('*').order('id').then(({ data }) => setFacilities(data ?? []))
    if (editing) {
      supabase.from('listings').select('*, listing_images(id, image_url, position), listing_facilities(facility_id)')
        .eq('id', id).single().then(({ data }) => {
          if (!data) return
          const { listing_images, listing_facilities, ...rest } = data
          setForm({ ...EMPTY, ...rest })
          setExisting(listing_images)
          setSelected(new Set(listing_facilities.map((f) => f.facility_id)))
        })
    }
  }, [id])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const toggleFac = (fid) => {
    const n = new Set(selected)
    n.has(fid) ? n.delete(fid) : n.add(fid)
    setSelected(n)
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const payload = {
        title: form.title,
        description: form.description,
        price_monthly: Number(form.price_monthly),
        city: form.city,
        address: form.address,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
        gender_type: form.gender_type,
        room_available: Number(form.room_available),
        status: form.status,
      }

      let listingId = id
      if (editing) {
        const { error } = await supabase.from('listings').update(payload).eq('id', id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('listings').insert({ ...payload, owner_id: user.id }).select('id').single()
        if (error) throw error
        listingId = data.id
      }

      // fasilitas: hapus lalu isi ulang
      await supabase.from('listing_facilities').delete().eq('listing_id', listingId)
      if (selected.size) {
        const { error } = await supabase.from('listing_facilities')
          .insert([...selected].map((facility_id) => ({ listing_id: listingId, facility_id })))
        if (error) throw error
      }

      // upload foto baru
      let pos = existing.length
      for (const file of files) {
        const path = `${user.id}/${listingId}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`
        const { error: upErr } = await supabase.storage.from('listing-images').upload(path, file)
        if (upErr) throw upErr
        const { data: pub } = supabase.storage.from('listing-images').getPublicUrl(path)
        const { error } = await supabase.from('listing_images').insert({ listing_id: listingId, image_url: pub.publicUrl, position: pos++ })
        if (error) throw error
      }

      navigate('/owner')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const removeImage = async (img) => {
    await supabase.from('listing_images').delete().eq('id', img.id)
    setExisting(existing.filter((i) => i.id !== img.id))
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-extrabold">{editing ? 'Ubah kos' : 'Tambah kos'}</h1>

      <input className="input" placeholder="Nama kos" required value={form.title} onChange={set('title')} />
      <textarea className="input" rows="4" placeholder="Deskripsi" value={form.description} onChange={set('description')} />

      <div className="grid gap-3 sm:grid-cols-2">
        <input className="input" type="number" min="0" placeholder="Harga per bulan (Rp)" required value={form.price_monthly} onChange={set('price_monthly')} />
        <input className="input" type="number" min="0" placeholder="Jumlah kamar tersedia" value={form.room_available} onChange={set('room_available')} />
        <input className="input" placeholder="Kota" required value={form.city} onChange={set('city')} />
        <select className="input" value={form.gender_type} onChange={set('gender_type')}>
          <option value="putra">Putra</option><option value="putri">Putri</option><option value="campur">Campur</option>
        </select>
      </div>
      <input className="input" placeholder="Alamat lengkap" value={form.address} onChange={set('address')} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="input" type="number" step="any" placeholder="Latitude (opsional)" value={form.latitude ?? ''} onChange={set('latitude')} />
        <input className="input" type="number" step="any" placeholder="Longitude (opsional)" value={form.longitude ?? ''} onChange={set('longitude')} />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Fasilitas</legend>
        <div className="flex flex-wrap gap-3">
          {facilities.map((f) => (
            <label key={f.id} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={selected.has(f.id)} onChange={() => toggleFac(f.id)} /> {f.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <p className="mb-2 text-sm font-semibold">Foto</p>
        {existing.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {existing.map((im) => (
              <div key={im.id} className="relative">
                <img src={im.image_url} alt="" className="h-20 w-28 rounded object-cover" />
                <button type="button" onClick={() => removeImage(im)} aria-label="Hapus foto"
                  className="absolute right-1 top-1 rounded bg-black/70 px-1.5 text-xs text-white">×</button>
              </div>
            ))}
          </div>
        )}
        <input type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files])} className="text-sm" />
      </div>

      <label className="block text-sm font-semibold">Status
        <select className="input mt-1" value={form.status} onChange={set('status')}>
          <option value="draft">Draf (belum tayang)</option>
          <option value="published">Tayang</option>
          <option value="full">Penuh</option>
        </select>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button className="btn" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan kos'}</button>
        <button type="button" className="btn-ghost" onClick={() => navigate('/owner')}>Batal</button>
      </div>
    </form>
  )
}
