'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Search, MessageSquare, ChevronLeft, Copy, Check, Zap } from 'lucide-react'
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

const FUEL_COLOR: Record<string, string> = {
  Electric: 'text-[#00d4a0] border-[#00d4a0]/20 bg-[#00d4a0]/5',
  Hybrid:   'text-[#e8a020] border-[#e8a020]/20 bg-[#e8a020]/5',
  Diesel:   'text-[#f87171] border-[#f87171]/20 bg-[#f87171]/5',
  Petrol:   'text-[#525270] border-[#525270]/20 bg-[#525270]/5',
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1400) }}
      className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity">
      {done ? <Check size={10} className="text-[#00d4a0]" /> : <Copy size={10} className="text-[#525270]" />}
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
    <div className="min-h-screen bg-grid flex flex-col" style={{ paddingTop: 52 }}>

      {/* Header */}
      <div className="border-b border-[#18182a] bg-[#0c0c14]/90 backdrop-blur px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-xs text-[#525270] hover:text-[#8a8ab0] mb-3 transition-colors">
            <ChevronLeft size={12} /> Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#525270] mb-1">{vehicle.brand.name} · {vehicle.brand.nameZh}</div>
              <h1 className="text-xl font-bold text-[#eaeaf5] tracking-tight">{vehicle.model}</h1>
              <div className="flex items-center gap-2.5 mt-2">
                <span className="text-xs text-[#525270]">{vehicle.year}</span>
                {vehicle.engine && <><div className="w-px h-3 bg-[#18182a]" /><span className="text-xs text-[#525270]">{vehicle.engine}</span></>}
                <div className="w-px h-3 bg-[#18182a]" />
                <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${FUEL_COLOR[vehicle.fuelType] || FUEL_COLOR.Petrol}`}>
                  {vehicle.fuelType}
                </span>
                <div className="w-px h-3 bg-[#18182a]" />
                <span className="text-xs text-[#525270] flex items-center gap-1"><Package size={10} />{vehicle.parts.length} parts</span>
              </div>
            </div>
            <button onClick={() => router.push(`/chat?vehicle=${vehicle.id}`)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[rgba(79,125,255,0.2)] bg-[rgba(79,125,255,0.06)] text-[#8aafff] text-xs hover:bg-[rgba(79,125,255,0.1)] transition-colors">
              <MessageSquare size={11} /> Ask AI
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 max-w-5xl mx-auto w-full px-6 py-6 gap-5">

        {/* Sidebar */}
        <aside className="w-44 shrink-0">
          <div className="sticky top-20 space-y-0.5">
            <button onClick={() => setSelectedCat(null)}
              className={`cat-item w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium text-left
                ${!selectedCat ? 'active border-[rgba(79,125,255,0.3)]' : 'border-transparent text-[#525270]'}`}>
              <span>All</span>
              <span className="font-mono text-[10px] opacity-50">{vehicle.parts.length}</span>
            </button>
            {catsWithParts.map(cat => {
              const Icon = ICON_MAP[cat.icon] || Package
              const count = vehicle.parts.filter(p => p.category.id === cat.id).length
              return (
                <button key={cat.id} onClick={() => setSelectedCat(cat.id === selectedCat ? null : cat.id)}
                  className={`cat-item w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium text-left
                    ${selectedCat === cat.id ? 'active border-[rgba(79,125,255,0.3)]' : 'border-transparent text-[#525270]'}`}>
                  <div className="flex items-center gap-2">
                    <Icon size={11} />
                    <span>{cat.name}</span>
                  </div>
                  <span className="font-mono text-[10px] opacity-50">{count}</span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Parts */}
        <div className="flex-1 min-w-0">
          <div className="relative mb-4">
            <Search size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#525270] pointer-events-none" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, OEM number..."
              className="w-full bg-[#0c0c14] border border-[#18182a] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#eaeaf5] placeholder-[#2a2a45]
                focus:outline-none focus:border-[rgba(79,125,255,0.35)] transition-colors" />
          </div>

          <div className="text-[10px] font-mono text-[#2a2a45] uppercase tracking-widest mb-3">
            {filtered.length} part{filtered.length !== 1 ? 's' : ''} {selectedCat || search ? '(filtered)' : ''}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <AnimatePresence mode="popLayout">
              {filtered.map((part, i) => {
                const Icon = ICON_MAP[part.category.icon] || Package
                const open = expanded === part.id
                return (
                  <motion.div key={part.id} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.015 }}
                    onClick={() => setExpanded(open ? null : part.id)}
                    className="group part-card rounded-xl border border-[#18182a] bg-[#0c0c14] cursor-pointer select-none overflow-hidden">

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: 'rgba(79,125,255,0.08)', border: '1px solid rgba(79,125,255,0.15)' }}>
                            <Icon size={11} className="text-[#4f7dff]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[#eaeaf5] leading-snug">{part.name}</div>
                            {part.nameZh && <div className="text-[10px] text-[#525270] mt-0.5">{part.nameZh}</div>}
                            <div className="flex items-center gap-1.5 mt-2">
                              <span className="oem-chip">{part.oemNumber}</span>
                              <CopyBtn text={part.oemNumber} />
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-[10px] text-[#525270]">{part.category.name}</span>
                          {part.position && <div className="text-[10px] text-[#2a2a45] mt-0.5">{part.position}</div>}
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {open && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-4 pt-0 border-t border-[#18182a] mt-0 pt-3 space-y-2 text-xs">
                            {part.description && <p className="text-[#8a8ab0] leading-relaxed">{part.description}</p>}
                            {part.altNumbers && (
                              <div className="flex items-center gap-2">
                                <span className="text-[#525270]">Alt:</span>
                                <span className="font-mono text-[#e8a020] text-[10px]">{part.altNumbers}</span>
                              </div>
                            )}
                            {part.material && <div className="text-[#525270]">Material: <span className="text-[#8a8ab0]">{part.material}</span></div>}
                            {part.notes && (
                              <div className="flex items-start gap-1.5 px-3 py-2 rounded-lg text-[#e8a020]"
                                style={{ background: 'rgba(232,160,32,0.05)', border: '1px solid rgba(232,160,32,0.15)' }}>
                                <Zap size={9} className="mt-0.5 shrink-0" />
                                {part.notes}
                              </div>
                            )}
                            <button onClick={e => { e.stopPropagation(); router.push(`/chat?part=${part.oemNumber}&vehicle=${vehicle.id}`) }}
                              className="flex items-center gap-1.5 text-[#4f7dff] hover:text-[#8aafff] transition-colors">
                              <MessageSquare size={10} /> Ask AI about this part
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package size={28} className="text-[#18182a] mb-3" />
              <p className="text-xs text-[#525270]">No parts for this filter</p>
              <button onClick={() => { setSearch(''); setSelectedCat(null) }} className="text-xs text-[#4f7dff] mt-2 hover:underline">Clear</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
