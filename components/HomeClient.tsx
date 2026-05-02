'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

type Brand   = { id: string; name: string; nameZh: string; _count: { vehicles: number } }
type Vehicle = { id: string; model: string; year: number; fuelType: string; engine: string | null; brand: { name: string }; _count: { parts: number } }

interface Props { brands: Brand[]; recentVehicles: Vehicle[]; partCount: number }

const FUEL_CLASS: Record<string, string> = {
  Electric: 'fuel-ev', Hybrid: 'fuel-hybrid', Diesel: 'fuel-diesel', Petrol: 'fuel-petrol',
}

export default function HomeClient({ brands, recentVehicles, partCount }: Props) {
  const [vin, setVin] = useState('')
  const router = useRouter()

  function go(e: React.FormEvent) {
    e.preventDefault()
    if (vin.trim()) router.push(`/decode?vin=${encodeURIComponent(vin.trim())}`)
  }

  return (
    <div className="min-h-screen bg-paper">

      {/* ── HERO — asymmetric 2-column ─────────────────────────────── */}
      <section className="grid border-b border-paper-edge" style={{ gridTemplateColumns: '1fr 340px', minHeight: '72vh' }}>

        {/* Left — main content */}
        <div className="px-12 py-16 border-r border-paper-edge flex flex-col justify-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="max-w-lg">

            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-10">
              <div className="h-px w-8 bg-paper-edge" />
              <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest">
                中国汽车配件 · Chinese Parts Intelligence
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-5xl font-bold text-ink leading-[1.05] mb-5" style={{ letterSpacing: '-0.02em' }}>
              Every part.<br />Every chassis.
            </h1>

            <p className="text-ink-soft text-base mb-10 leading-relaxed">
              Input a VIN or chassis number — the system decodes the vehicle
              and surfaces the exact OEM part number in seconds.
            </p>

            {/* VIN Input — precision instrument */}
            <form onSubmit={go}>
              <div className="vin-input-wrapper mb-px">
                <input
                  type="text"
                  value={vin}
                  onChange={e => setVin(e.target.value.toUpperCase())}
                  placeholder="LGXCE4GB2M1234567"
                  maxLength={17}
                  className="w-full px-4 py-3.5 font-mono text-sm bg-transparent text-ink placeholder-ink-mute focus:outline-none tracking-widest"
                />
              </div>
              <button
                type="submit"
                disabled={vin.length < 5}
                className="btn-vermillion w-full justify-center"
              >
                Decode Chassis →
              </button>
            </form>

            {/* Sample VINs */}
            <div className="flex items-center gap-4 mt-4">
              <span className="font-mono text-2xs text-ink-mute">Try:</span>
              {['LGXCE4GB2M1234567', 'LSJ24U11000012345'].map(ex => (
                <button key={ex} type="button"
                  onClick={() => { setVin(ex); router.push(`/decode?vin=${ex}`) }}
                  className="font-mono text-2xs text-ink-mute hover:text-vermillion transition-colors underline underline-offset-2">
                  {ex}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right — catalog sidebar */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.35 }}
          className="px-8 py-16 bg-paper-deep flex flex-col"
        >
          {/* Stats */}
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

          {/* Divider */}
          <div className="rule-gold mb-8" />

          {/* Quick brand links */}
          <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-4">Brands</div>
          <div className="space-y-2 flex-1">
            {brands.slice(0, 6).map(b => (
              <button key={b.id} onClick={() => router.push('/decode')}
                className="w-full flex items-center justify-between group">
                <span className="text-sm text-ink-soft group-hover:text-vermillion transition-colors">
                  {b.name}
                  <span className="font-cjk text-ink-mute ml-2 text-xs">{b.nameZh}</span>
                </span>
                <span className="font-mono text-2xs text-ink-mute">{b._count.vehicles}v</span>
              </button>
            ))}
          </div>

          {/* AI CTA */}
          <div className="mt-8 pt-6 border-t border-paper-edge">
            <p className="text-xs text-ink-mute mb-2">Don't have the VIN?</p>
            <button onClick={() => router.push('/chat')}
              className="text-sm text-vermillion hover:text-vermillion-deep font-medium underline underline-offset-2 transition-colors">
              Describe the part in plain language →
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── BRAND STRIP — dense inline list ──────────────────────────── */}
      <section className="px-12 py-5 border-b border-paper-edge bg-paper">
        <div className="flex items-center flex-wrap gap-x-0 gap-y-1">
          {brands.map((brand, i) => (
            <span key={brand.id} className="flex items-center">
              <button
                onClick={() => router.push('/decode')}
                className="flex items-center gap-1.5 px-3 py-1 text-sm text-ink-soft hover:text-vermillion transition-colors"
              >
                {brand.name}
                <span className="font-cjk text-xs text-ink-mute">{brand.nameZh}</span>
              </button>
              {i < brands.length - 1 && (
                <span className="text-paper-edge select-none">·</span>
              )}
            </span>
          ))}
        </div>
      </section>

      {/* ── CATALOG TABLE — parts manual index ───────────────────────── */}
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
              <motion.tr
                key={v.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => router.push(`/parts/${v.id}`)}
                className="catalog-row border-b border-paper-edge"
              >
                <td className="py-3 pr-6">
                  <span className="text-sm font-medium text-ink">{v.brand.name} {v.model}</span>
                </td>
                <td className="py-3 pr-6 font-mono text-xs text-ink-mute">{v.year}</td>
                <td className="py-3 pr-6 font-mono text-xs text-ink-mute">{v.engine || '—'}</td>
                <td className="py-3 pr-6">
                  <span className={`font-mono text-2xs px-1.5 py-0.5 ${FUEL_CLASS[v.fuelType] || 'fuel-petrol'}`}>
                    {v.fuelType}
                  </span>
                </td>
                <td className="py-3 text-right font-mono text-xs text-ink-mute row-arrow transition-colors">
                  {v._count.parts} →
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </section>

    </div>
  )
}
