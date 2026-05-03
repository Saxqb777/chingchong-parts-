'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

type Brand   = { id: string; name: string; nameZh: string; _count: { vehicles: number } }
type Vehicle = { id: string; model: string; year: number; fuelType: string; engine: string | null; brand: { name: string }; _count: { parts: number } }

interface Props { brands: Brand[]; recentVehicles: Vehicle[]; partCount: number }

const FUEL_CLASS: Record<string, string> = {
  Electric: 'fuel-ev', Hybrid: 'fuel-hybrid', Diesel: 'fuel-diesel', Petrol: 'fuel-petrol',
}

const PART_PLACEHOLDERS = [
  'headlight', 'front brake pad', 'oil filter', 'wheel bearing',
  'side mirror', 'alternator', 'radiator hose', 'shock absorber',
]

const RECENT_KEY = 'sinoparts-recent-vins'

function getRecentVins(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}

function saveRecentVin(vin: string) {
  if (typeof window === 'undefined') return
  const prev = getRecentVins().filter(v => v !== vin)
  localStorage.setItem(RECENT_KEY, JSON.stringify([vin, ...prev].slice(0, 5)))
}

export default function HomeClient({ brands, recentVehicles, partCount }: Props) {
  const [vin, setVin] = useState('')
  const [part, setPart] = useState('')
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [recentVins, setRecentVins] = useState<string[]>([])
  const vinRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    vinRef.current?.focus()
    setRecentVins(getRecentVins())
  }, [])

  useEffect(() => {
    const id = setInterval(() => setPlaceholderIdx(i => (i + 1) % PART_PLACEHOLDERS.length), 3000)
    return () => clearInterval(id)
  }, [])

  function go(e?: React.FormEvent, overrideVin?: string, overridePart?: string) {
    e?.preventDefault()
    const v = (overrideVin ?? vin).trim()
    const q = (overridePart ?? part).trim()
    if (!v || v.length < 5) return
    saveRecentVin(v)
    const url = `/decode?vin=${encodeURIComponent(v)}${q ? `&q=${encodeURIComponent(q)}` : ''}`
    router.push(url)
  }

  const hasBoth = vin.trim().length >= 5 && part.trim().length > 0

  return (
    <div className="min-h-screen bg-paper">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="grid border-b border-paper-edge" style={{ gridTemplateColumns: '1fr 340px', minHeight: '80vh' }}>

        {/* Left — VIN-dominant */}
        <div className="px-12 py-16 border-r border-paper-edge flex flex-col justify-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="max-w-lg">

            <div className="flex items-center gap-3 mb-10">
              <div className="h-px w-8 bg-paper-edge" />
              <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest">
                中国汽车配件 · Chinese Parts Intelligence
              </span>
            </div>

            <h1 className="font-serif text-5xl font-bold text-ink leading-[1.05] mb-4" style={{ letterSpacing: '-0.02em' }}>
              Every part.<br />Every chassis.
            </h1>

            <p className="text-ink-soft text-sm mb-10 leading-relaxed">
              Enter the chassis number and the part you need.
              The system returns the exact OEM number in seconds.
            </p>

            <form onSubmit={go} className="space-y-0">
              <div>
                <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-1.5">Chassis Number</div>
                <div className="vin-input-wrapper mb-3">
                  <input
                    ref={vinRef}
                    type="text"
                    value={vin}
                    onChange={e => setVin(e.target.value.toUpperCase())}
                    placeholder="LGXCE4GB2M1234567"
                    maxLength={17}
                    autoComplete="off"
                    className="w-full px-4 py-3.5 font-mono text-sm bg-transparent text-ink placeholder-ink-mute focus:outline-none tracking-widest"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest">Part You Need</div>
                  <span className="font-mono text-2xs text-ink-mute" style={{ opacity: 0.6 }}>(optional, recommended)</span>
                </div>
                <div className="vin-input-wrapper mb-5">
                  <input
                    type="text"
                    value={part}
                    onChange={e => setPart(e.target.value)}
                    placeholder={`e.g. ${PART_PLACEHOLDERS[placeholderIdx]}`}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); go() } }}
                    className="w-full px-4 py-3.5 text-sm bg-transparent text-ink placeholder-ink-mute focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-vermillion w-full justify-center"
              >
                {hasBoth ? 'DECODE & FIND PART →' : 'DECODE CHASSIS →'}
              </button>
            </form>

            <div className="flex items-center gap-4 mt-5">
              <span className="font-mono text-2xs text-ink-mute">Try:</span>
              {['LGXCE4GB2M1234567', 'LSJ24U11000012345'].map(ex => (
                <button key={ex} type="button"
                  onClick={() => { setVin(ex) }}
                  className="font-mono text-2xs text-ink-mute hover:text-vermillion transition-colors underline underline-offset-2">
                  {ex}
                </button>
              ))}
            </div>

            {recentVins.length > 0 && (
              <div className="mt-5 pt-5 border-t border-paper-edge">
                <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-2">Recent</div>
                <div className="flex flex-wrap gap-2">
                  {recentVins.map(v => (
                    <button key={v} onClick={() => { setVin(v) }}
                      className="font-mono text-2xs text-ink-soft bg-paper-deep border border-paper-edge px-2.5 py-1 hover:border-vermillion hover:text-vermillion transition-colors">
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5">
              <button onClick={() => router.push('/chat')}
                className="font-mono text-2xs text-ink-mute hover:text-vermillion transition-colors underline underline-offset-2">
                Don't have a VIN? Describe the part →
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right — catalog sidebar */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.35 }}
          className="px-8 py-16 bg-paper-deep flex flex-col"
        >
          <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-6">配件库 — Catalog</div>

          <div className="space-y-0 mb-8">
            {[
              { label: 'Parts indexed', val: partCount.toLocaleString() },
              { label: 'Vehicles',      val: recentVehicles.length.toString() },
              { label: 'Brands',        val: brands.length.toString() },
            ].map((row, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between py-3">
                  <span className="text-sm text-ink-soft">{row.label}</span>
                  <span className="font-mono text-sm font-medium text-ink">{row.val}</span>
                </div>
                <div className="rule" />
              </div>
            ))}
          </div>

          <div className="rule-gold mb-8" />

          <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-4">Brands</div>
          <div className="space-y-2 flex-1">
            {brands.slice(0, 8).map(b => (
              <button key={b.id} onClick={() => router.push('/catalog')}
                className="w-full flex items-center justify-between group">
                <span className="text-sm text-ink-soft group-hover:text-vermillion transition-colors">
                  {b.name}
                  <span className="font-cjk text-ink-mute ml-2 text-xs">{b.nameZh}</span>
                </span>
                <span className="font-mono text-2xs text-ink-mute">{b._count.vehicles}v</span>
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-paper-edge">
            <button onClick={() => router.push('/catalog')}
              className="text-sm text-vermillion hover:text-vermillion-deep font-medium underline underline-offset-2 transition-colors">
              Browse full catalog →
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── VEHICLE INDEX — below fold ────────────────────────────── */}
      <section className="px-12 py-10">
        <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-6">Vehicle Index</div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Vehicle', 'Year', 'Engine', 'Fuel', 'Parts'].map((h, i) => (
                <th key={h}
                  className={`font-mono text-2xs text-ink-mute uppercase tracking-widest py-2 border-b border-paper-edge font-normal ${i === 4 ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentVehicles.map((v, i) => (
              <motion.tr key={v.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                onClick={() => router.push(`/parts/${v.id}`)}
                className="catalog-row border-b border-paper-edge">
                <td className="py-3 pr-6"><span className="text-sm font-medium text-ink">{v.brand.name} {v.model}</span></td>
                <td className="py-3 pr-6 font-mono text-xs text-ink-mute">{v.year}</td>
                <td className="py-3 pr-6 font-mono text-xs text-ink-mute">{v.engine || '—'}</td>
                <td className="py-3 pr-6">
                  <span className={`font-mono text-2xs px-1.5 py-0.5 ${FUEL_CLASS[v.fuelType] || 'fuel-petrol'}`}>{v.fuelType}</span>
                </td>
                <td className="py-3 text-right font-mono text-xs text-ink-mute row-arrow transition-colors">{v._count.parts} →</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
