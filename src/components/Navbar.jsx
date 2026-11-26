import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Navbar() {
  const { user, profile, isOwner, signOut } = useAuth()
  const [openMenu, setOpenMenu] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setOpenMenu(false)
    await signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-extrabold tracking-tight text-pine">
            KostFinder
          </Link>

          <nav className="flex items-center gap-6 text-sm font-medium text-slate-800">
            <Link to="/tentang" className="transition hover:text-pine">
              Tentang Kami
            </Link>

            {user && !isOwner && (
              <>
                <Link to="/bookings" className="transition hover:text-pine">
                  Booking
                </Link>
                <Link to="/favorites" className="transition hover:text-pine">
                  Favorit
                </Link>
              </>
            )}

            {user && isOwner && (
              <Link to="/owner" className="transition hover:text-pine">
                Kost Saya
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setOpenMenu((prev) => !prev)}
                aria-label="Menu profil"
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-pine text-pine transition hover:bg-pine/5"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              </button>

              {openMenu && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-100 bg-white py-2 shadow-lg">
                  {profile?.full_name && (
                    <div className="border-b border-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-500">
                      {profile.full_name}
                    </div>
                  )}
                  <Link
                    to="/profile"
                    onClick={() => setOpenMenu(false)}
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Profil
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Masuk</Link>
              <Link to="/register" className="btn">Daftar</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}