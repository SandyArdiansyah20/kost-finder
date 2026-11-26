import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Icon } from './Icons.jsx'

const INTERVAL = 6000
const THEMES = { pine: '', brass: 'hero-brass', ink: 'hero-ink' }

// Slide pertama selalu ada dan memuat judul utama halaman
const FIRST = {
  id: 'intro',
  title: 'Cari kos yang cocok, booking dari mana saja',
  subtitle: 'Bandingkan harga, lihat foto dan fasilitas, lalu pesan kamar tanpa perlu survei berulang.',
  theme: 'pine',
}

// Hanya izinkan tautan internal atau https (mencegah javascript: dari data banner)
const safeLink = (l) => (l && (l.startsWith('#') || l.startsWith('/') || l.startsWith('https://')) ? l : null)

function Cta({ slide, tabIndex }) {
  const link = safeLink(slide.cta_link)
  if (!link || !slide.cta_label) return null
  const cls = 'mt-6 inline-flex self-start items-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-pine hover:bg-pine-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
  if (link.startsWith('#')) {
    const go = () => { try { document.querySelector(link)?.scrollIntoView({ behavior: 'smooth' }) } catch { /* selector tidak valid */ } }
    return <button type="button" tabIndex={tabIndex} className={cls} onClick={go}>{slide.cta_label}</button>
  }
  if (link.startsWith('/')) return <Link to={link} tabIndex={tabIndex} className={cls}>{slide.cta_label}</Link>
  return <a href={link} target="_blank" rel="noreferrer" tabIndex={tabIndex} className={cls}>{slide.cta_label}</a>
}

function Slide({ slide, active, first, index, total }) {
  const Title = first ? 'h1' : 'h2'
  return (
    <div role="group" aria-roledescription="slide" aria-label={`${index + 1} dari ${total}`} aria-hidden={!active}
      className={`hero-grid ${THEMES[slide.theme] ?? ''} relative w-full shrink-0`}>
      {slide.image_url && (
        <>
          <img src={slide.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
        </>
      )}
      <div className="relative mx-auto flex min-h-[21rem] max-w-6xl flex-col justify-center px-4 pb-24 pt-10 md:min-h-[24rem] md:pb-28 md:pt-14">
        <Title className="max-w-2xl text-4xl font-extrabold leading-[1.1] tracking-tight md:text-5xl">{slide.title}</Title>
        {slide.subtitle && <p className="mt-4 max-w-xl text-base text-white/90 md:text-lg">{slide.subtitle}</p>}
        <Cta slide={slide} tabIndex={active ? 0 : -1} />
      </div>
    </div>
  )
}

export default function HeroCarousel({ discounts = [] }) {
  const [banners, setBanners] = useState([])
  const [index, setIndex] = useState(0)
  const [hover, setHover] = useState(false)
  const [reduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [userPaused, setUserPaused] = useState(reduced)
  const [touchX, setTouchX] = useState(null)

  useEffect(() => {
    // RLS hanya mengembalikan banner aktif dan sedang tayang. Kalau tabel belum ada, pakai slide bawaan.
    supabase.from('banners').select('*').order('position').then(({ data }) => setBanners(data ?? []))
  }, [])

  // Slide bawaan dipakai selama belum ada banner di database
  const fallback = []
  if (discounts.length) {
    const max = Math.max(...discounts.map((d) => Number(d.percent)))
    fallback.push({
      id: 'promo-durasi', theme: 'brass', cta_label: 'Cari kos sekarang', cta_link: '#hasil',
      title: `Sewa lebih lama, hemat sampai ${max}%`,
      subtitle: `Diskon otomatis untuk sewa ${discounts.map((d) => d.months).join(', ')} bulan, ditambah kode promo saat booking.`,
    })
  }
  fallback.push({
    id: 'untuk-pemilik', theme: 'ink', cta_label: 'Daftar sebagai pemilik', cta_link: '/register',
    title: 'Punya kos? Pasang listing-mu gratis',
    subtitle: 'Atur harga dan foto, lalu terima booking langsung dari calon penghuni.',
  })

  const slides = [FIRST, ...(banners.length ? banners : fallback)]
  const n = slides.length
  const cur = Math.min(index, n - 1)
  const go = (i) => setIndex(((i % n) + n) % n)

  useEffect(() => {
    if (n < 2 || hover || userPaused) return
    const t = setInterval(() => { if (!document.hidden) setIndex((i) => (Math.min(i, n - 1) + 1) % n) }, INTERVAL)
    return () => clearInterval(t)
  }, [n, hover, userPaused, cur])

  const btn = 'grid h-8 w-8 place-items-center rounded-full text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white'

  return (
    <section
      aria-roledescription="carousel" aria-label="Promo dan informasi" className="relative overflow-hidden text-white"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHover(false) }}
      onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX === null) return
        const dx = e.changedTouches[0].clientX - touchX
        if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1))
        setTouchX(null)
      }}
    >
      <div className="flex motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out"
        style={{ transform: `translateX(-${cur * 100}%)` }} aria-live={hover || userPaused ? 'polite' : 'off'}>
        {slides.map((s, i) => <Slide key={s.id} slide={s} active={i === cur} first={i === 0} index={i} total={n} />)}
      </div>

      {n > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-14">
          <div className="mx-auto flex max-w-6xl justify-end px-4">
            <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-black/35 px-2 py-1">
              <button type="button" className={`${btn} hidden md:grid`} aria-label="Slide sebelumnya" onClick={() => go(cur - 1)}><Icon name="left" className="h-4 w-4" /></button>
              <div className="flex items-center">
                {slides.map((s, i) => (
                  <button key={s.id} type="button" className="p-1.5" aria-label={`Ke slide ${i + 1}`} aria-current={i === cur} onClick={() => go(i)}>
                    <span className={`block h-2 rounded-full transition-all ${i === cur ? 'w-6 bg-white' : 'w-2 bg-white/50'}`} />
                  </button>
                ))}
              </div>
              <button type="button" className={`${btn} hidden md:grid`} aria-label="Slide berikutnya" onClick={() => go(cur + 1)}><Icon name="right" className="h-4 w-4" /></button>
              <button type="button" className={btn} aria-label={userPaused ? 'Putar otomatis' : 'Jeda putar otomatis'} onClick={() => setUserPaused(!userPaused)}>
                <Icon name={userPaused ? 'play' : 'pause'} className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
