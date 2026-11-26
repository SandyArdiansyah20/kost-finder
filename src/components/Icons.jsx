const P = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  pin: <><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
  wifi: <><path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" /><circle cx="12" cy="19" r="1" /></>,
  snow: <path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7" />,
  bath: <path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3zM6 12V6a2 2 0 0 1 4 0" />,
  bed: <><path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5" /><circle cx="7" cy="11" r="1.5" /></>,
  wardrobe: <><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M12 3v18M9.5 12v2M14.5 12v2" /></>,
  parking: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M9.5 16V8h3a2.5 2.5 0 0 1 0 5h-3" /></>,
  kitchen: <path d="M6 3v7a2 2 0 0 0 2 2v9M10 3v7M8 3v9M18 3c-2 1-3 4-3 7h3v11" />,
  laundry: <><rect x="4" y="3" width="16" height="18" rx="2" /><circle cx="12" cy="13" r="4" /><path d="M8 6.5h.01M11 6.5h.01" /></>,
  shield: <><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  home: <path d="M3 11 12 3l9 8M5 10v10h14V10" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  tag: <><path d="M3 12V3h9l9 9-9 9z" /><circle cx="7.5" cy="7.5" r="1" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  check: <path d="m5 12 4.5 4.5L19 7" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  left: <path d="m15 5-7 7 7 7" />,
  right: <path d="m9 5 7 7-7 7" />,
  pause: <path d="M8 5v14M16 5v14" />,
  play: <path d="M7 4v16l13-8z" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
}

export function Icon({ name, className = 'h-5 w-5', filled = false }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name] ?? P.check}
    </svg>
  )
}

export function facilityIcon(name = '') {
  const n = name.toLowerCase()
  if (n === 'ac') return 'snow'
  if (n.includes('wifi')) return 'wifi'
  if (n.includes('mandi')) return 'bath'
  if (n.includes('kasur')) return 'bed'
  if (n.includes('lemari')) return 'wardrobe'
  if (n.includes('parkir')) return 'parking'
  if (n.includes('dapur')) return 'kitchen'
  if (n.includes('laundry')) return 'laundry'
  if (n.includes('cctv')) return 'shield'
  return 'check'
}
