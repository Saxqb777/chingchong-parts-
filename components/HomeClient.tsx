'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, ArrowRight, Package, ChevronRight, MessageSquare, Zap } from 'lucide-react'

type Brand = { id: string; name: string; nameZh: string; _count: { vehicles: number } }
type Vehicle = { id: string; model: string; year: number; fuelType: string; brand: { name: string }; _count: { parts: number } }

interface Props { brands: Brand[]; recentVehicles: Vehicle[]; partCount: number }

export default function HomeClient({ brands, recentVehicles, partCount }: Props) {
  const [vin, setVin] = useState('')
  const [focused, setFocused] = useState(false)
  const router = useRouter()

  function go(e: React.FormEvent) {
    e.preventDefault()
    if (vin.trim()) router.push(`/decode?vin=${encodeURIComponent(vin.trim())}`)
  }

  const FUEL_COLOR: Record<string, string> = {
    Electric: 'text-[#00d4a0] border-[#00d4a0]/20 bg-[#00d4a0]/5',
    Hybrid:   'text-[#e8a020] border-[#e8a020]/20 bg-[#e8a020]/5',
    Diesel:   'text-[#f87171] border-[#f87171]/20 bg-[#f87171]/5',
    Petrol:   'text-[#525270] border-[#525270]/20 bg-[#525270]/5',
  }

  return (
    <div className="min-h-screen bg-grid" style={{ paddingTop: 52 }}>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        {/* Ambient */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(79,125,255,0.06) 0%, transparent 70%)' }} />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-6">
              <div className="h-px w-6 bg-[#4f7dff]/40" />
              <span className="text-xs font-mono text-[#4f7dff]/70 uppercase tracking-widest">Chinese Parts Intelligence</span>
            </div>

            <h1 className="text-[clamp(2.4rem,5vw,4rem)] font-bold leading-[1.05] tracking-tight text-[#eaeaf5] mb-5">
              Find any Chinese<br />
              car part. <span className="text-gradient-blue">Instantly.</span>
            </h1>

            <p className="text-[#525270] text-base mb-10 max-w-lg leading-relaxed">
              Enter a chassis number — AI decodes the vehicle and surfaces
              the exact OEM part numbers in seconds.
            </p>

            {/* VIN input */}
            <form onSubmit={go} className="relative max-w-2xl">
              <motion.div
                animate={focused ? { boxShadow: '0 0 0 1px rgba(79,125,255,0.5), 0 0 40px rgba(79,125,255,0.1)' } : { boxShadow: '0 0 0 1px rgba(24,24,42,0.9)' }}
                className="flex items-center rounded-2xl overflow-hidden"
                style={{ background: '#0c0c14' }}
              >
                <Search size={15} className="absolute left-5 text-[#525270] pointer-events-none" />
                <input
                  type="text"
                  value={vin}
                  onChange={e => setVin(e.target.value.toUpperCase())}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="LGXCE4GB2M1234567"
                  className="flex-1 bg-transparent pl-12 pr-4 py-4 text-sm font-mono text-[#eaeaf5] placeholder-[#2a2a45] focus:outline-none tracking-widest"
                />
                <button type="submit"
                  className="m-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-all"
                  style={{ background: 'linear-gradient(135deg, #4f7dff, #2d5bff)' }}>
                  <Zap size={13} /> Decode
                </button>
              </motion.div>

              <div className="flex items-center gap-4 mt-3 pl-1">
                <span className="text-xs text-[#2a2a45]">Try:</span>
                {['LGXCE4GB2M1234567', 'LSJ24U11000012345'].map(ex => (
                  <button key={ex} type="button" onClick={() => { setVin(ex); router.push(`/decode?vin=${ex}`) }}
                    className="text-xs font-mono text-[#525270] hover:text-[#8aafff] transition-colors">{ex}</button>
                ))}
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────────── */}
      <div className="border-y border-[#18182a] bg-[#0c0c14]/60">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-8">
          {[
            { n: brands.length, label: 'brands' },
            { n: recentVehicles.length, label: 'vehicles' },
            { n: partCount.toLocaleString(), label: 'parts indexed' },
            { n: 'Claude', label: 'AI engine' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#eaeaf5]">{s.n}</span>
              <span className="text-xs text-[#525270]">{s.label}</span>
              {i < 3 && <div className="ml-6 h-3 w-px bg-[#18182a]" />}
            </div>
          ))}
        </div>
      </div>

      {/* ── BRANDS ───────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-14">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-[#eaeaf5] uppercase tracking-widest">Supported Brands</h2>
          <button onClick={() => router.push('/decode')} className="text-xs text-[#4f7dff] hover:text-[#8aafff] flex items-center gap-1 transition-colors">
            Decode VIN <ArrowRight size={11} />
          </button>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {brands.map((brand, i) => (
            <motion.button key={brand.id}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
              onClick={() => router.push('/decode')}
              className="group flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[#18182a] bg-[#0c0c14]
                hover:border-[rgba(79,125,255,0.3)] hover:bg-[rgba(79,125,255,0.05)] transition-all">
              <div className="text-xs font-bold text-[#8a8ab0] group-hover:text-[#eaeaf5] transition-colors tracking-tight">{brand.name}</div>
              <div className="text-[10px] text-[#2a2a45] group-hover:text-[#525270] transition-colors">{brand.nameZh}</div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ── VEHICLES ─────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-14">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-[#eaeaf5] uppercase tracking-widest">Catalog</h2>
          <span className="text-xs text-[#525270]">{recentVehicles.length} vehicles</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {recentVehicles.map((v, i) => (
            <motion.button key={v.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}
              onClick={() => router.push(`/parts/${v.id}`)}
              className="group part-card flex items-start justify-between p-4 rounded-xl border border-[#18182a] bg-[#0c0c14] text-left">
              <div>
                <div className="text-[10px] text-[#525270] mb-1">{v.brand.name}</div>
                <div className="text-sm font-semibold text-[#eaeaf5]">{v.model}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-[#525270]">{v.year}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${FUEL_COLOR[v.fuelType] || FUEL_COLOR.Petrol}`}>
                    {v.fuelType}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 mt-0.5">
                <span className="text-[10px] text-[#525270] flex items-center gap-1">
                  <Package size={9} />{v._count.parts}
                </span>
                <ChevronRight size={12} className="text-[#4f7dff] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ── AI CTA ───────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex items-center justify-between p-6 rounded-2xl border"
          style={{ borderColor: 'rgba(79,125,255,0.15)', background: 'linear-gradient(135deg, rgba(79,125,255,0.05) 0%, transparent 100%)' }}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={13} className="text-[#4f7dff]" />
              <span className="text-xs text-[#4f7dff] font-medium">AI Assistant</span>
            </div>
            <p className="text-sm font-semibold text-[#eaeaf5] mb-1">Describe the part in plain language</p>
            <p className="text-xs text-[#525270]">"front strut bearing BYD Han 2022" → OEM number, alt numbers, specs</p>
          </div>
          <button onClick={() => router.push('/chat')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0 ml-6 transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #4f7dff, #2d5bff)' }}>
            Open <ArrowRight size={13} />
          </button>
        </motion.div>
      </section>
    </div>
  )
}
