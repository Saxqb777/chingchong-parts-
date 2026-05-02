'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import * as LucideIcons from 'lucide-react'

type Category = { id: string; name: string; nameZh: string; icon: string }
type Part = {
  id: string; name: string; nameZh: string | null; oemNumber: string; altNumbers: string | null
  description: string | null; position: string | null; material: string | null; notes: string | null
  category: Category
}
type Vehicle = {
  id: string; model: string; modelZh: string | null; year: number; engine: string | null
  fuelType: string; bodyType: string | null
  brand: { name: string; nameZh: string }
  parts: Part[]
}
interface Props { vehicle: Vehicle; categories: Category[] }

const ICON_MAP: Record<string, React.ElementType> = {
  zap: LucideIcons.Zap, disc: LucideIcons.Disc3, activity: LucideIcons.Activity,
  cpu: LucideIcons.Cpu, thermometer: LucideIcons.Thermometer, settings: LucideIcons.Settings,
  box: LucideIcons.Box, navigation: LucideIcons.Navigation, droplets: LucideIcons.Droplets,
  wind: LucideIcons.Wind,
}
const FUEL_CLASS: Record<string, string> = {
  Electric: 'fuel-ev', Hybrid: 'fuel-hybrid', Diesel: 'fuel-diesel', Petrol: 'fuel-petrol',
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1400) }}
      className="font-mono text-2xs text-ink-mute hover:text-vermillion transition-colors ml-2 underline underline-offset-2"
    >
      {done ? 'copied' : 'copy'}
    </button>
  )
}

export default function PartsClient({ vehicle, categories }: Props) {
  const router = useRouter()
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const catsWithParts = useMemo(() => {
    const ids = new Set(vehicle.parts.map(p => p.category.id))
    return categories.filter(c => ids.has(c.id))
  }, [vehicle.parts, categories])

  const filtered = useMemo(() => vehicle.parts.filter(p => {
    if (selectedCat && p.category.id !== selectedCat) return false
    if (search) {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.oemNumber.toLowerCase().includes(q) ||
        (p.nameZh || '').includes(q) || (p.description || '').toLowerCase().includes(q)
    }
    return true
  }), [vehicle.parts, selectedCat, search])

  return (
    <div className="min-h-screen bg-paper">

      {/* ── Vehicle header ── */}
      <div className="border-b border-paper-edge bg-paper-deep px-12 py-6">
        <button onClick={() => router.back()} className="font-mono text-2xs text-ink-mute hover:text-vermillion transition-colors mb-4 block">
          ← Back
        </button>
        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-2">
              {vehicle.brand.name} <span className="font-cjk normal-case">{vehicle.brand.nameZh}</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-ink" style={{ letterSpacing: '-0.02em' }}>
              {vehicle.model}
              {vehicle.modelZh && <span className="font-cjk text-2xl text-ink-mute ml-3">{vehicle.modelZh}</span>}
            </h1>
            <div className="flex items-center gap-4 mt-3">
              <span className="font-mono text-xs text-ink-mute">{vehicle.year}</span>
              {vehicle.engine && <><div className="h-3 w-px bg-paper-edge" /><span className="font-mono text-xs text-ink-mute">{vehicle.engine}</span></>}
              <div className="h-3 w-px bg-paper-edge" />
              <span className={`font-mono text-2xs px-1.5 py-0.5 ${FUEL_CLASS[vehicle.fuelType] || 'fuel-petrol'}`}>{vehicle.fuelType}</span>
              <div className="h-3 w-px bg-paper-edge" />
              <span className="font-mono text-xs text-ink-mute">{vehicle.parts.length} parts</span>
            </div>
          </div>
          <button onClick={() => router.push(`/chat?vehicle=${vehicle.id}`)}
            className="btn-vermillion text-xs" style={{ padding: '8px 14px' }}>
            Ask AI →
          </button>
        </div>
      </div>

      <div className="flex" style={{ minHeight: 'calc(100vh - 200px)' }}>

        {/* ── Sidebar ── */}
        <aside className="w-48 shrink-0 border-r border-paper-edge px-6 py-8 bg-paper-deep">
          <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-4">Category</div>

          {/* Search */}
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full bg-white border border-paper-edge px-3 py-2 text-xs text-ink placeholder-ink-mute focus:outline-none focus:border-ink-soft font-mono mb-5"
          />

          <button onClick={() => setSelectedCat(null)}
            className={`cat-link w-full ${!selectedCat ? 'active' : ''}`}>
            <span>All</span>
            <span>{vehicle.parts.length}</span>
          </button>

          {catsWithParts.map(cat => {
            const count = vehicle.parts.filter(p => p.category.id === cat.id).length
            return (
              <button key={cat.id} onClick={() => setSelectedCat(cat.id === selectedCat ? null : cat.id)}
                className={`cat-link w-full ${selectedCat === cat.id ? 'active' : ''}`}>
                <span>{cat.name}</span>
                <span>{count}</span>
              </button>
            )
          })}
        </aside>

        {/* ── Parts list — manual style ── */}
        <div className="flex-1 px-10 py-8">

          <div className="flex items-center justify-between mb-6">
            <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest">
              {filtered.length} part{filtered.length !== 1 ? 's' : ''} {selectedCat || search ? '· filtered' : ''}
            </div>
            {(selectedCat || search) && (
              <button onClick={() => { setSearch(''); setSelectedCat(null) }}
                className="font-mono text-2xs text-vermillion hover:text-vermillion-deep underline transition-colors">
                Clear
              </button>
            )}
          </div>

          {/* Column headers */}
          <div className="grid gap-x-6 pb-2 border-b border-paper-edge mb-0"
            style={{ gridTemplateColumns: '1fr 160px 80px' }}>
            <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest">Part</span>
            <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest">OEM Number</span>
            <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest">Cat.</span>
          </div>

          <AnimatePresence mode="popLayout">
            {filtered.map((part, i) => {
              const open = expanded === part.id
              return (
                <motion.div key={part.id} layout
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }} transition={{ delay: i * 0.015 }}>

                  {/* Part row */}
                  <div
                    onClick={() => setExpanded(open ? null : part.id)}
                    className="part-row grid gap-x-6 py-3 border-b border-paper-edge cursor-pointer"
                    style={{ gridTemplateColumns: '1fr 160px 80px' }}
                  >
                    {/* Part name — hanzi first */}
                    <div>
                      {part.nameZh
                        ? <>
                            <div className="hanzi-primary">{part.nameZh}</div>
                            <div className="hanzi-secondary">{part.name}</div>
                          </>
                        : <div className="text-sm font-medium text-ink">{part.name}</div>
                      }
                    </div>

                    {/* OEM number */}
                    <div className="flex items-start pt-0.5">
                      <span className="oem-chip vermillion">{part.oemNumber}</span>
                      <CopyBtn text={part.oemNumber} />
                    </div>

                    {/* Category */}
                    <div className="pt-1">
                      <span className="font-mono text-2xs text-ink-mute uppercase tracking-wide">{part.category.name}</span>
                      {part.position && <div className="font-mono text-2xs text-ink-mute mt-0.5 normal-case">{part.position}</div>}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {open && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="bg-paper-deep border-b border-paper-edge px-4 py-4 grid gap-x-8 gap-y-3 text-xs"
                          style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                          {part.description && (
                            <div className="col-span-3 text-ink-soft leading-relaxed">{part.description}</div>
                          )}
                          {part.altNumbers && (
                            <div>
                              <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-1">Alt. Numbers</div>
                              <span className="font-mono text-xs text-gold">{part.altNumbers}</span>
                            </div>
                          )}
                          {part.material && (
                            <div>
                              <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-1">Material</div>
                              <span className="text-ink-soft">{part.material}</span>
                            </div>
                          )}
                          {part.notes && (
                            <div className="col-span-3 flex items-start gap-2 p-2 border border-paper-edge bg-white">
                              <span className="text-vermillion font-mono text-2xs uppercase tracking-widest shrink-0 mt-0.5">Note</span>
                              <span className="text-ink-soft">{part.notes}</span>
                            </div>
                          )}
                          <button onClick={e => { e.stopPropagation(); router.push(`/chat?part=${part.oemNumber}&vehicle=${vehicle.id}`) }}
                            className="text-xs text-vermillion hover:text-vermillion-deep underline underline-offset-2 transition-colors">
                            Ask AI about this part →
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="text-ink-mute text-sm">No parts match this filter</p>
              <button onClick={() => { setSearch(''); setSelectedCat(null) }}
                className="text-xs text-vermillion mt-2 underline">Clear filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
