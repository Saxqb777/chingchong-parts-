'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Search, MessageSquare, ChevronLeft, Copy, Check, Filter, Zap } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

type Category = { id: string; name: string; nameZh: string; icon: string }
type Part = {
  id: string; name: string; nameZh: string | null; oemNumber: string; altNumbers: string | null
  description: string | null; position: string | null; material: string | null; notes: string | null
  category: Category
}
type Vehicle = {
  id: string; model: string; modelZh: string | null; year: number; engine: string | null
  fuelType: string; bodyType: string | null; displacement: string | null
  brand: { name: string; nameZh: string }
  parts: Part[]
}

interface Props { vehicle: Vehicle; categories: Category[] }

function getIcon(name: string) {
  const map: Record<string, React.ElementType> = {
    zap: LucideIcons.Zap, disc: LucideIcons.Disc3, activity: LucideIcons.Activity,
    cpu: LucideIcons.Cpu, thermometer: LucideIcons.Thermometer, settings: LucideIcons.Settings,
    box: LucideIcons.Box, navigation: LucideIcons.Navigation, droplets: LucideIcons.Droplets,
    wind: LucideIcons.Wind,
  }
  const Icon = map[name] || LucideIcons.Package
  return Icon
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent/10">
      {copied ? <Check size={11} className="text-jade" /> : <Copy size={11} className="text-text-secondary" />}
    </button>
  )
}

export default function PartsClient({ vehicle, categories }: Props) {
  const router = useRouter()
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Part | null>(null)

  const catsWithParts = useMemo(() => {
    const ids = new Set(vehicle.parts.map(p => p.category.id))
    return categories.filter(c => ids.has(c.id))
  }, [vehicle.parts, categories])

  const filtered = useMemo(() => {
    return vehicle.parts.filter(p => {
      if (selectedCat && p.category.id !== selectedCat) return false
      if (search) {
        const q = search.toLowerCase()
        return p.name.toLowerCase().includes(q) || p.oemNumber.toLowerCase().includes(q) ||
          (p.nameZh || '').includes(q) || (p.description || '').toLowerCase().includes(q)
      }
      return true
    })
  }, [vehicle.parts, selectedCat, search])

  return (
    <div className="min-h-screen bg-void bg-grid pt-14 flex flex-col">
      {/* ── Header ── */}
      <div className="border-b border-border bg-surface/80 backdrop-blur px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary mb-3 transition-colors">
            <ChevronLeft size={13} /> Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary">
                {vehicle.brand.name} {vehicle.model}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-text-secondary">{vehicle.year}</span>
                {vehicle.engine && <span className="text-xs text-text-secondary">· {vehicle.engine}</span>}
                <span className={`text-xs px-2 py-0.5 rounded-full border font-mono
                  ${vehicle.fuelType === 'Electric' ? 'border-jade/30 bg-jade/5 text-jade' :
                    vehicle.fuelType === 'Hybrid' ? 'border-amber/30 bg-amber/5 text-amber' :
                    'border-border bg-muted/20 text-text-secondary'}`}>
                  {vehicle.fuelType}
                </span>
                <span className="text-xs text-text-secondary flex items-center gap-1">
                  <Package size={10} />{vehicle.parts.length} parts
                </span>
              </div>
            </div>
            <button
              onClick={() => router.push(`/chat?vehicle=${vehicle.id}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/30 bg-accent/5 text-accent text-xs font-medium hover:bg-accent/10 transition-colors"
            >
              <MessageSquare size={12} />
              Ask AI about this car
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 max-w-6xl mx-auto w-full px-6 py-6 gap-5">
        {/* ── Sidebar ── */}
        <aside className="w-52 shrink-0">
          <div className="sticky top-24 space-y-1">
            <button
              onClick={() => setSelectedCat(null)}
              className={`cat-pill w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs font-medium text-left transition-all
                ${!selectedCat ? 'active' : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface'}`}
            >
              <Filter size={12} />
              All Categories
              <span className="ml-auto text-xs font-mono opacity-60">{vehicle.parts.length}</span>
            </button>
            {catsWithParts.map(cat => {
              const Icon = getIcon(cat.icon)
              const count = vehicle.parts.filter(p => p.category.id === cat.id).length
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id === selectedCat ? null : cat.id)}
                  className={`cat-pill w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs font-medium text-left transition-all
                    ${selectedCat === cat.id ? 'active' : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface'}`}
                >
                  <Icon size={12} />
                  {cat.name}
                  <span className="ml-auto font-mono opacity-60">{count}</span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* ── Parts Grid ── */}
        <div className="flex-1 min-w-0">
          {/* Search */}
          <div className="relative mb-4">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, OEM number, description..."
              className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2.5 text-xs text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          <div className="text-xs text-text-secondary mb-4">
            {filtered.length} part{filtered.length !== 1 ? 's' : ''} {selectedCat || search ? 'matching filters' : ''}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <AnimatePresence mode="popLayout">
              {filtered.map((part, i) => {
                const Icon = getIcon(part.category.icon)
                return (
                  <motion.div
                    key={part.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => setSelected(selected?.id === part.id ? null : part)}
                    className="group part-card p-4 rounded-xl border border-border bg-surface cursor-pointer select-none"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon size={12} className="text-accent" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-text-primary text-sm leading-snug">{part.name}</div>
                          {part.nameZh && <div className="text-xs text-text-secondary mt-0.5">{part.nameZh}</div>}
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="oem-number">{part.oemNumber}</span>
                            <CopyButton text={part.oemNumber} />
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className="text-xs px-2 py-0.5 rounded border border-border bg-muted/20 text-text-secondary">
                          {part.category.name}
                        </span>
                        {part.position && (
                          <span className="text-xs text-text-secondary/70">{part.position}</span>
                        )}
                      </div>
                    </div>

                    {/* Expanded */}
                    <AnimatePresence>
                      {selected?.id === part.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3 mt-3 border-t border-border space-y-2 text-xs text-text-secondary">
                            {part.description && <p className="text-text-primary/80 leading-relaxed">{part.description}</p>}
                            {part.altNumbers && (
                              <div><span className="text-text-secondary">Alt numbers: </span>
                                <span className="font-mono text-amber">{part.altNumbers}</span>
                              </div>
                            )}
                            {part.material && <div><span className="text-text-secondary">Material: </span>{part.material}</div>}
                            {part.notes && (
                              <div className="flex items-start gap-1.5 p-2 rounded bg-amber/5 border border-amber/20 text-amber">
                                <Zap size={10} className="mt-0.5 shrink-0" />
                                {part.notes}
                              </div>
                            )}
                            <button
                              onClick={e => { e.stopPropagation(); router.push(`/chat?part=${part.oemNumber}&vehicle=${vehicle.id}`) }}
                              className="flex items-center gap-1.5 text-accent hover:underline"
                            >
                              <MessageSquare size={10} />
                              Ask AI about this part
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
              <Package size={32} className="text-text-secondary/30 mb-3" />
              <p className="text-text-secondary text-sm">No parts found for this filter</p>
              <button onClick={() => { setSearch(''); setSelectedCat(null) }} className="text-xs text-accent mt-2 hover:underline">Clear filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
