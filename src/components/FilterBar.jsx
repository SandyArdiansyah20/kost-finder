export default function FilterBar({ filters, onChange }) {
  const set = (k) => (e) => onChange({ ...filters, [k]: e.target.value })
  return (
    <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm font-medium">Kota
        <input className="input mt-1" placeholder="mis. Jakarta" value={filters.city} onChange={set('city')} />
      </label>
      <label className="text-sm font-medium">Tipe
        <select className="input mt-1" value={filters.gender} onChange={set('gender')}>
          <option value="">Semua</option>
          <option value="putra">Putra</option>
          <option value="putri">Putri</option>
          <option value="campur">Campur</option>
        </select>
      </label>
      <label className="text-sm font-medium">Harga minimum
        <input type="number" min="0" className="input mt-1" placeholder="0" value={filters.min} onChange={set('min')} />
      </label>
      <label className="text-sm font-medium">Harga maksimum
        <input type="number" min="0" className="input mt-1" placeholder="3000000" value={filters.max} onChange={set('max')} />
      </label>
    </div>
  )
}
