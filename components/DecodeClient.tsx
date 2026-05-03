'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface DecodeResult {
  vin: { raw: string; wmi: string; vds: string; vis: string; brand: string; manufacturer: string; country: string; year: number | null; confidence: string }
  matchedVehicles: Array<{ id: string; model: string; year: number; engine: string | null; fuelType: string; bodyType: string | null; brand: { name: string; nameZh: string }; _count: { parts: number } }>
  aiSummary: string
}

const SEG_LABELS = [
  { key: 'wmi', label: 'WMI', sub: 'Manufacturer', color: '#C8312B' },
  { key: 'vds', label: 'VDS', sub: 'Model · Engine · Body', color: '#A88A4A' },
  { key: 'vis', label: 'VIS', sub: 'Year · Serial', color: '#5C7A3E' },
]

export default function DecodeClient() {
  const params = useSearchParams()
  const router = useRouter()
  const [vin, setVin] = useState(params.get('vin') || '')
  const partQuery = params.get('q') || ''
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DecodeResult | null>(null)
  const [error, setError] = useState('')
  const [scanChars, setScanChars] = useState<string[]>([])
  const [stamped, setStamped] = useState(false)

  useEffect(() => { const v = params.get('vin'); if (v) decode(v) }, [])

  async function decode(vinVal?: string) {
    const v = (vinVal || vin).trim()
    if (!v) return
    setLoading(true); setError(''); setResult(null); setScanChars([]); setStamped(false)

    // Animate characters
    const letters = v.split('')
    for (let i = 0; i < letters.length; i++) {
      await new Promise(r => setTimeout(r, 50))
      setScanChars(c => [...c, letters[i]])
    }

    try {
      const res = await fetch(`/api/decode?vin=${encodeURIComponent(v)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Decode failed')
      // Stamp delay
      await new Promise(r => setTimeout(r, 100))
      setStamped(true)
      await new Promise(r => setTimeout(r, 120))
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Decode failed')
    } finally {
      setLoading(false)
    }
  }

  const segOf = (i: number) => i < 3 ? 'wmi' : i < 9 ? 'vds' : 'vis'
  const segColor: Record<string, string> = { wmi: '#C8312B', vds: '#A88A4A', vis: '#5C7A3E' }

  return (
    <div className="min-h-screen bg-paper">
      <div className="grid border-b border-paper-edge" style={{ gridTemplateColumns: '1fr 380px', minHeight: 'calc(100vh - 52px)' }}>

        {/* ── Left: Input panel ── */}
        <div className="px-12 py-14 border-r border-paper-edge">

          <div className="flex items-center gap-3 mb-10">
            <div className="h-px w-8 bg-paper-edge" />
            <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest">VIN · Chassis Decode</span>
          </div>

          <h1 className="font-serif text-4xl font-bold text-ink mb-2" style={{ letterSpacing: '-0.02em' }}>
            Identify the vehicle.
          </h1>
          <p className="text-ink-soft text-sm mb-10">
            11–17 character VIN from door jamb, dashboard, or registration.
          </p>

          {/* Input */}
          <form onSubmit={e => { e.preventDefault(); decode() }}>
            <div className="vin-input-wrapper mb-px">
              <div className="flex items-center">
                <span className="font-mono text-2xs text-ink-mute pl-4 select-none border-r border-paper-edge pr-3 mr-1">VIN</span>
                <input
                  type="text" value={vin}
                  onChange={e => setVin(e.target.value.toUpperCase())}
                  placeholder="LGXCE4GB2M1234567"
                  maxLength={17}
                  className="flex-1 px-3 py-4 font-mono text-sm bg-transparent text-ink placeholder-ink-mute focus:outline-none tracking-widest"
                />
                <span className="font-mono text-2xs text-ink-mute pr-4">{vin.length}/17</span>
              </div>
            </div>
            <button type="submit" disabled={loading || vin.length < 5} className="btn-vermillion w-full justify-center">
              {loading ? 'Scanning...' : 'Decode Chassis →'}
            </button>
          </form>

          {/* Sample VINs */}
          <div className="flex gap-5 mt-5">
            <span className="font-mono text-2xs text-ink-mute">Examples:</span>
            {['LGXCE4GB2M1234567', 'L8XAE4HB2M000001'].map(ex => (
              <button key={ex} onClick={() => { setVin(ex); decode(ex) }}
                className="font-mono text-2xs text-ink-mute hover:text-vermillion underline underline-offset-2 transition-colors">{ex}</button>
            ))}
          </div>

          {/* Scanning animation */}
          <AnimatePresence>
            {loading && scanChars.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="mt-10 p-6 bg-paper-deep border border-paper-edge">
                <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-5">Parsing VIN structure...</div>

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {scanChars.map((c, i) => {
                    const seg = segOf(i)
                    return (
                      <motion.div key={i}
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        className="w-8 h-9 flex items-center justify-center border font-mono text-xs font-medium bg-white"
                        style={{ borderColor: segColor[seg], color: segColor[seg] }}>
                        {c}
                      </motion.div>
                    )
                  })}
                </div>

                <div className="flex gap-6 font-mono text-2xs">
                  {SEG_LABELS.map(s => (
                    <span key={s.key} style={{ color: s.color }}>■ {s.label}</span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="mt-6 p-4 border border-paper-edge bg-paper-deep text-sm text-ink-soft">{error}</div>
          )}
        </div>

        {/* ── Right: Result panel ── */}
        <div className="px-8 py-14 bg-paper-deep flex flex-col">
          <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-6">Decode Result</div>

          {!result && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="seal w-12 h-12 opacity-10 text-xl mb-4" style={{ fontSize: 22 }}>配</div>
              <p className="text-ink-mute text-sm">Enter a VIN to begin</p>
            </div>
          )}

          {/* Stamp-in animation then result */}
          <AnimatePresence>
            {stamped && (
              <motion.div key="stamp" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex justify-center mb-6">
                <div className="stamp-in">
                  <div className="w-14 h-14 rounded-full border-4 border-vermillion flex items-center justify-center"
                    style={{ color: 'var(--vermillion)' }}>
                    <span className="font-cjk text-lg font-bold">识</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {result && (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }} className="space-y-5 data-fill">

                {/* VIN breakdown */}
                <div className="space-y-3">
                  {SEG_LABELS.map(seg => {
                    const val = result.vin[seg.key as keyof typeof result.vin] as string
                    return (
                      <div key={seg.key}>
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="font-mono text-2xs uppercase tracking-widest" style={{ color: seg.color }}>{seg.label}</span>
                          <span className="font-mono text-xs font-medium text-ink">{val}</span>
                        </div>
                        <div className="text-xs text-ink-mute">{seg.sub}</div>
                        <div className="rule mt-2" />
                      </div>
                    )
                  })}
                </div>

                {/* Decoded facts */}
                <div className="space-y-1 pt-1">
                  {[
                    { label: 'Brand',        val: result.vin.brand },
                    { label: 'Manufacturer', val: result.vin.manufacturer },
                    { label: 'Country',      val: result.vin.country },
                    { label: 'Model Year',   val: result.vin.year?.toString() || '—' },
                    { label: 'Confidence',   val: result.vin.confidence },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-baseline py-1">
                      <span className="font-mono text-2xs text-ink-mute uppercase tracking-wide">{row.label}</span>
                      <span className="text-xs text-ink font-medium">{row.val}</span>
                    </div>
                  ))}
                </div>

                {/* AI summary */}
                {result.aiSummary && (
                  <div className="pt-4 border-t border-paper-edge">
                    <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-2">Analysis</div>
                    <p className="text-sm text-ink-soft leading-relaxed">{result.aiSummary}</p>
                  </div>
                )}

                {/* Matched vehicles */}
                {result.matchedVehicles.length > 0 && (
                  <div className="pt-4 border-t border-paper-edge">
                    <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-3">
                      {result.matchedVehicles.length} match{result.matchedVehicles.length !== 1 ? 'es' : ''} in catalog
                    </div>
                    <div className="space-y-1">
                      {result.matchedVehicles.map(v => (
                        <button key={v.id} onClick={() => router.push(`/parts/${v.id}${partQuery ? `?q=${encodeURIComponent(partQuery)}` : ''}`)}
                          className="w-full text-left flex items-center justify-between p-3 bg-white border border-paper-edge hover:border-vermillion transition-colors group">
                          <div>
                            <div className="text-sm font-medium text-ink">{v.brand.name} {v.model}</div>
                            <div className="font-mono text-2xs text-ink-mute mt-0.5">{v.year} · {v.engine || v.fuelType}</div>
                          </div>
                          <span className="font-mono text-xs text-ink-mute group-hover:text-vermillion transition-colors">
                            {v._count.parts} parts →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {result.matchedVehicles.length === 0 && (
                  <div className="pt-4 border-t border-paper-edge text-xs text-ink-mute">
                    No exact catalog match — use AI Search to find parts by description.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}
