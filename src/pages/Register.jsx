import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Register() {
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', password: '', role: 'seeker' })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError(''); setInfo('')
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, phone: form.phone, role: form.role } },
    })
    setBusy(false)
    if (error) return setError(error.message)
    if (data.session) navigate('/')
    else setInfo('Pendaftaran berhasil. Cek email untuk konfirmasi, lalu masuk.')
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-extrabold">Daftar</h1>
      <input className="input" placeholder="Nama lengkap" required value={form.full_name} onChange={set('full_name')} />
      <input className="input" placeholder="No. WhatsApp (mis. 62812xxxx)" value={form.phone} onChange={set('phone')} />
      <input className="input" type="email" placeholder="Email" required value={form.email} onChange={set('email')} />
      <input className="input" type="password" placeholder="Kata sandi (min. 6 karakter)" minLength={6} required value={form.password} onChange={set('password')} />
      <label className="block text-sm font-medium">Saya mendaftar sebagai
        <select className="input mt-1" value={form.role} onChange={set('role')}>
          <option value="seeker">Pencari kos</option>
          <option value="owner">Pemilik kos</option>
        </select>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {info && <p className="text-sm text-pine">{info}</p>}
      <button className="btn w-full" disabled={busy}>{busy ? 'Memproses…' : 'Buat akun'}</button>
      <p className="text-center text-sm text-slate-600">Sudah punya akun? <Link to="/login" className="font-semibold text-pine">Masuk</Link></p>
    </form>
  )
}
