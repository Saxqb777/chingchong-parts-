'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Zap, ChevronRight, Car, Package, Sparkles, ArrowRight } from 'lucide-react'

type Brand = { id: string; name: string; nameZh: string; _count: { vehicles: number } }
type Vehicle = { id: string; model: string; year: number; brand: { name: string }; _count: { parts: number } }

interface Props {
  brands: Brand[]
  recentVehicles: Vehicle[]
  partCount: number
}

export default function HomeClient({ brands, recentVehicles, partCount }: Props) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    router.push(`/decode?vin=${encodeURIComponent(query.trim())}`)
  }

  const BRAND_COLORS = [
    'from-blue-900/40 to-blue-800/20 border-blue-700/30',
    'from-amber-900/40 to-amber-800/20 border-amber-700/30',
    'from-emerald-900/40 to-emerald-800/20 border-emerald-700/30',
    'from-purple-900/40 to-purple-800/20 border-purple-700/30',
    'from-rose-900/40 to-rose-800/20 border-rose-700/30',
    'from-cyan-900/40 to-cyan-800/20 border-cyan-700/30',
    'from-orange-900/40 to-orange-800/20 border-orange-700/30',
    'from-indigo-900/40 to-indigo-800/20 border-indigo-700/30',
  ]

  return (
    <div className="min-h-screen bg-void bg-grid pt-14">
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-24 pb-20 overflow-hidden">
        {/* Ambient glow blobs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-amber/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl"
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-accent/5 mb-6">
            <Sparkles size={11} className="text-accent" />
            <span className="text-xs text-accent font-medium tracking-widest uppercase">Chinese Parts Intelligence</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-text-primary mb-4 leading-none">
            Find any part.
            <br />
            <span className="text-gradient-blue">In seconds.</span>
          </h1>
          <p className="text-text-secondary text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Enter a chassis number or describe the part — our AI instantly identifies
            the vehicle and finds the exact OEM part number.
          </p>

          {/* MAIN SEARCH */}
          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
            <motion.div
              animate={{ boxShadow: focused ? '0 0 0 2px rgba(59,130,246,0.4), 0 0 40px rgba(59,130,246,0.15)' : '0 0 0 1px rgba(28,28,46,0.8)' }}
              transition={{ duration: 0.2 }}
              className="relative flex items-center rounded-xl bg-surface border border-border overflow-hidden"
            >
              <Search size={16} className="absolute left-4 text-text-secondary pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Enter chassis / VIN number  e.g. LGXCE4GB2M1234567"
                className="flex-1 bg-transparent pl-10 pr-4 py-4 text-sm text-text-primary placeholder-text-secondary/50 font-mono focus:outline-none"
              />
              <button
                type="submit"
                className="m-1.5 px-5 py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors"
              >
                <Zap size={14} />
                Decode
              </button>
            </motion.div>
            <p className="text-xs text-text-secondary/60 mt-2 text-left pl-1">
              Or go to <button type="button" onClick={() => router.push('/chat')} className="text-accent hover:underline">AI Assistant</button> to describe the part in plain language
            </p>
          </form>
        </motion.div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="border-y border-border bg-surface/50 py-4 px-6"
      >
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-12">
          {[
            { label: 'Chinese Brands', value: brands.length },
            { label: 'Vehicles in Catalog', value: recentVehicles.length + '+' },
            { label: 'Indexed Parts', value: partCount.toLocaleString() },
            { label: 'AI Powered', value: 'Claude' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-xl font-bold text-text-primary">{stat.value}</div>
              <div className="text-xs text-text-secondary">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── BRANDS GRID ──────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Supported Brands</h2>
            <p className="text-xs text-text-secondary mt-0.5">All major Chinese automotive manufacturers</p>
          </div>
          <button onClick={() => router.push('/decode')} className="text-xs text-accent hover:underline flex items-center gap-1">
            Decode a VIN <ArrowRight size={11} />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {brands.map((brand, i) => (
            <motion.button
              key={brand.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => router.push(`/decode?brand=${brand.name}`)}
              className={`group relative p-4 rounded-xl border bg-gradient-to-br text-left transition-all hover:scale-[1.02] ${BRAND_COLORS[i % BRAND_COLORS.length]}`}
            >
              <div className="text-base font-bold text-text-primary">{brand.name}</div>
              <div className="text-xs text-text-secondary mt-0.5">{brand.nameZh}</div>
              <div className="flex items-center gap-1 mt-3">
                <Car size={10} className="text-text-secondary" />
                <span className="text-xs text-text-secondary">{brand._count.vehicles} models</span>
              </div>
              <ChevronRight size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          ))}
        </div>
      </section>

      {/* ── RECENT VEHICLES ──────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Catalog Vehicles</h2>
            <p className="text-xs text-text-secondary mt-0.5">Browse by vehicle to find parts</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recentVehicles.map((v, i) => (
            <motion.button
              key={v.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              onClick={() => router.push(`/parts/${v.id}`)}
              className="group p-4 rounded-xl border border-border bg-surface hover:border-accent/30 hover:bg-panel text-left transition-all part-card"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-text-secondary mb-1">{v.brand.name}</div>
                  <div className="font-semibold text-text-primary">{v.model}</div>
                  <div className="text-xs text-text-secondary mt-0.5">{v.year}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1 text-xs text-text-secondary">
                    <Package size={10} />
                    <span>{v._count.parts} parts</span>
                  </div>
                  <ChevronRight size={12} className="text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ── AI CTA ───────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 to-transparent p-8 overflow-hidden"
        >
          <div className="absolute right-6 top-1/2 -translate-y-1/2 w-32 h-32 bg-accent/5 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-accent" />
              <span className="text-accent text-sm font-medium">AI Parts Assistant</span>
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">
              Can't find what you need?
            </h3>
            <p className="text-text-secondary text-sm mb-5 max-w-md">
              Describe the part in plain language. "Front shock absorber for a 2021 BYD Han" —
              the AI searches the catalog and explains exactly what you need.
            </p>
            <button
              onClick={() => router.push('/chat')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <MessageSquareIcon size={14} />
              Open AI Assistant
              <ArrowRight size={13} />
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  )
}

function MessageSquareIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
