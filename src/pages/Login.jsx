import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    const { error } = await supabase.auth.signInWithPassword(form)
    setBusy(false)
    if (error) setError(error.message)
    else navigate('/')
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-extrabold">Masuk</h1>
      <input className="input" type="email" placeholder="Email" required value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input className="input" type="password" placeholder="Kata sandi" required value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn w-full" disabled={busy}>{busy ? 'Memproses…' : 'Masuk'}</button>
      <p className="text-center text-sm text-slate-600">Belum punya akun? <Link to="/register" className="font-semibold text-pine">Daftar</Link></p>
    </form>
  )
}
