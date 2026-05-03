'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

type Vehicle = {
  id: string; model: string; modelZh: string | null; year: number; engine: string | null
  fuelType: string; bodyType: string | null
  brand: { id: string; name: string; nameZh: string }
  _count: { parts: number }
}
type Brand = { id: string; name: string; nameZh: string; _count: { vehicles: number } }

const FUEL_CLASS: Record<string, string> = {
  Electric: 'fuel-ev', Hybrid: 'fuel-hybrid', Diesel: 'fuel-diesel', Petrol: 'fuel-petrol',
}

export default function CatalogClient({ vehicles, brands }: { vehicles: Vehicle[]; brands: Brand[] }) {
  const router = useRouter()
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => vehicles.filter(v => {
    if (selectedBrand && v.brand.id !== selectedBrand) return false
    if (search) {
      const q = search.toLowerCase()
      return v.model.toLowerCase().includes(q) || v.brand.name.toLowerCase().includes(q) ||
        (v.modelZh || '').includes(q) || (v.engine || '').toLowerCase().includes(q)
    }
    return true
  }), [vehicles, selectedBrand, search])

  return (
    <div className="min-h-screen bg-paper">
      <div className="flex" style={{ minHeight: 'calc(100vh - 52px)' }}>

        {/* Sidebar */}
        <aside className="w-52 shrink-0 border-r border-paper-edge px-6 py-8 bg-paper-deep">
          <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-4">配件库 · Catalog</div>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full bg-white border border-paper-edge px-3 py-2 text-xs text-ink placeholder-ink-mute focus:outline-none focus:border-ink-soft font-mono mb-5" />

          <button onClick={() => setSelectedBrand(null)}
            className={`cat-link w-full ${!selectedBrand ? 'active' : ''}`}>
            <span>All brands</span><span>{vehicles.length}</span>
          </button>
          {brands.map(b => (
            <button key={b.id} onClick={() => setSelectedBrand(b.id === selectedBrand ? null : b.id)}
              className={`cat-link w-full ${selectedBrand === b.id ? 'active' : ''}`}>
              <span>{b.name} <span className="font-cjk normal-case">{b.nameZh}</span></span>
              <span>{b._count.vehicles}</span>
            </button>
          ))}
        </aside>

        {/* Main */}
        <div className="flex-1 px-10 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest">
              {filtered.length} vehicle{filtered.length !== 1 ? 's' : ''} {selectedBrand || search ? '· filtered' : ''}
            </div>
            {(selectedBrand || search) && (
              <button onClick={() => { setSearch(''); setSelectedBrand(null) }}
                className="font-mono text-2xs text-vermillion hover:text-vermillion-deep underline transition-colors">
                Clear
              </button>
            )}
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Vehicle', 'Year', 'Engine', 'Fuel', 'Parts'].map((h, i) => (
                  <th key={h} className={`font-mono text-2xs text-ink-mute uppercase tracking-widest py-2 border-b border-paper-edge font-normal ${i === 4 ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => (
                <motion.tr key={v.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  onClick={() => router.push(`/parts/${v.id}`)}
                  className="catalog-row border-b border-paper-edge">
                  <td className="py-3 pr-6">
                    <div className="text-sm font-medium text-ink">{v.brand.name} {v.model}</div>
                    {v.modelZh && <div className="font-cjk text-xs text-ink-mute">{v.modelZh}</div>}
                  </td>
                  <td className="py-3 pr-6 font-mono text-xs text-ink-mute">{v.year}</td>
                  <td className="py-3 pr-6 font-mono text-xs text-ink-mute">{v.engine || '—'}</td>
                  <td className="py-3 pr-6">
                    <span className={`font-mono text-2xs px-1.5 py-0.5 ${FUEL_CLASS[v.fuelType] || 'fuel-petrol'}`}>{v.fuelType}</span>
                  </td>
                  <td className="py-3 text-right font-mono text-xs text-ink-mute row-arrow">{v._count.parts} →</td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="text-ink-mute text-sm">No vehicles match this filter</p>
              <button onClick={() => { setSearch(''); setSelectedBrand(null) }} className="text-xs text-vermillion mt-2 underline">Clear filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
