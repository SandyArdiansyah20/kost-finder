import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Profile() {
    const { user, profile } = useAuth()
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [busy, setBusy] = useState(false)
    const [msg, setMsg] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name ?? '')
            setPhone(profile.phone ?? '')
        }
    }, [profile])

    const handleSave = async (e) => {
        e.preventDefault()
        setBusy(true)
        setMsg('')
        setError('')

        const { error: err } = await supabase
            .from('profiles')
            .update({ full_name: fullName, phone })
            .eq('id', user.id)

        if (err) setError(err.message)
        else setMsg('Profil berhasil diperbarui.')
        setBusy(false)
    }

    return (
        <div className="mx-auto max-w-lg rounded-xl bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-extrabold text-slate-900">Profil Saya</h1>
            <p className="mt-1 text-sm text-slate-500">Perbarui informasi akun dan kontak WhatsApp Anda.</p>

            <form onSubmit={handleSave} className="mt-5 space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700">Email</label>
                    <input className="input mt-1 bg-slate-100 text-slate-500" value={user?.email ?? ''} disabled />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700">Peran Akun</label>
                    <input
                        className="input mt-1 bg-slate-100 capitalize text-slate-500"
                        value={profile?.role === 'owner' ? 'Pemilik Kos' : profile?.role === 'admin' ? 'Admin' : 'Pencari Kos'}
                        disabled
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700">Nama Lengkap</label>
                    <input
                        className="input mt-1"
                        placeholder="Nama lengkap"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700">Nomor WhatsApp</label>
                    <input
                        className="input mt-1"
                        placeholder="Contoh: 6281234567890"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
                {msg && <p className="text-sm font-medium text-emerald-700">{msg}</p>}

                <button className="btn w-full" disabled={busy}>
                    {busy ? 'Menyimpan…' : 'Simpan Perubahan'}
                </button>
            </form>
        </div>
    )
}