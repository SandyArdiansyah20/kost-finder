import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Navbar() {
  const { user, profile, isOwner, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="text-xl font-extrabold tracking-tight text-pine">KostFinder</Link>
        <div className="flex items-center gap-2 text-sm">
          {user && <Link to="/favorites" className="btn-ghost">Favorit</Link>}
          {isOwner && <Link to="/owner" className="btn-ghost">Kos saya</Link>}
          {user ? (
            <>
              <span className="hidden text-slate-600 sm:inline">{profile?.full_name}</span>
              <button className="btn" onClick={async () => { await signOut(); navigate('/') }}>Keluar</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Masuk</Link>
              <Link to="/register" className="btn">Daftar</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
