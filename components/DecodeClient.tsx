'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Zap, ChevronRight, AlertCircle, CheckCircle2, Package, Car, Cpu } from 'lucide-react'

interface DecodeResult {
  vin: { raw: string; wmi: string; vds: string; vis: string; brand: string; manufacturer: string; country: string; year: number | null; confidence: string }
  matchedVehicles: Array<{ id: string; model: string; modelZh: string | null; year: number; engine: string | null; fuelType: string; bodyType: string | null; brand: { name: string; nameZh: string }; _count: { parts: number } }>
  aiSummary: string
}

const CONFIDENCE_COLORS = {
  HIGH: 'text-jade border-jade/30 bg-jade/5',
  MEDIUM: 'text-amber border-amber/30 bg-amber/5',
  LOW: 'text-red-400 border-red-400/30 bg-red-400/5',
}

export default function DecodeClient() {
  const params = useSearchParams()
  const router = useRouter()
  const [vin, setVin] = useState(params.get('vin') || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DecodeResult | null>(null)
  const [error, setError] = useState('')
  const [chars, setChars] = useState<string[]>([])

  useEffect(() => {
    const initialVin = params.get('vin')
    if (initialVin) decode(initialVin)
  }, [])

  async function decode(vinToUse?: string) {
    const v = (vinToUse || vin).trim()
    if (!v) return
    setLoading(true)
    setError('')
    setResult(null)
    setChars([])

    // Animate chars appearing one by one
    const letters = v.split('')
    for (let i = 0; i < letters.length; i++) {
      await new Promise(r => setTimeout(r, 60))
      setChars(prev => [...prev, letters[i]])
    }

    try {
      const res = await fetch(`/api/decode?vin=${encodeURIComponent(v)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Decode failed')
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    decode()
  }

  return (
    <div className="min-h-screen bg-void bg-grid pt-14">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-2 text-text-secondary text-xs mb-3">
            <Cpu size={12} />
            <span>VIN / CHASSIS DECODER</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Identify Your Vehicle</h1>
          <p className="text-text-secondary text-sm">Enter a 11-17 character VIN or chassis number from the vehicle door jamb, dashboard, or registration documents.</p>
        </motion.div>

        {/* Input */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="mb-10"
        >
          <div className="relative flex items-center rounded-xl bg-surface border border-border overflow-hidden focus-within:border-accent/50 focus-within:shadow-accent transition-all">
            <Search size={16} className="absolute left-4 text-text-secondary pointer-events-none" />
            <input
              type="text"
              value={vin}
              onChange={e => setVin(e.target.value.toUpperCase())}
              placeholder="LGXCE4GB2M1234567"
              maxLength={17}
              className="flex-1 bg-transparent pl-10 pr-4 py-4 text-sm font-mono text-text-primary placeholder-text-secondary/40 focus:outline-none tracking-widest"
            />
            <span className="text-xs text-text-secondary font-mono mr-3">{vin.length}/17</span>
            <button
              type="submit"
              disabled={loading || vin.length < 5}
              className="m-1.5 px-5 py-2.5 bg-accent disabled:opacity-40 hover:bg-accent/90 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors"
            >
              <Zap size={13} />
              {loading ? 'Decoding...' : 'Decode'}
            </button>
          </div>
          <div className="flex gap-4 mt-3">
            {['LGXCE4GB2M1234567', 'LSJ24U11000012345', 'L8XAE4HB2M000001'].map(ex => (
              <button key={ex} type="button" onClick={() => { setVin(ex); decode(ex) }}
                className="text-xs text-text-secondary hover:text-accent font-mono transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </motion.form>

        {/* Loading: Animated character decode display */}
        <AnimatePresence>
          {loading && chars.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-8 p-6 rounded-xl border border-accent/20 bg-surface"
            >
              <div className="text-xs text-accent mb-3 font-mono uppercase tracking-widest">Scanning VIN...</div>
              <div className="flex flex-wrap gap-1">
                {chars.map((c, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`w-8 h-10 flex items-center justify-center rounded-lg border font-mono text-sm font-bold
                      ${i < 3 ? 'border-accent/50 bg-accent/10 text-accent' :
                        i < 9 ? 'border-amber/50 bg-amber/10 text-amber' :
                        'border-jade/50 bg-jade/10 text-jade'}`}
                  >
                    {c}
                  </motion.span>
                ))}
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="w-8 h-10 flex items-center justify-center font-mono text-accent text-xl"
                >_</motion.span>
              </div>
              <div className="flex gap-6 mt-4 text-xs font-mono">
                <span className="text-accent">■ WMI: Manufacturer</span>
                <span className="text-amber">■ VDS: Model/Engine</span>
                <span className="text-jade">■ VIS: Year/Sequence</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-3 p-4 rounded-xl border border-red-400/20 bg-red-400/5 text-red-400 text-sm mb-6"
          >
            <AlertCircle size={15} />
            {error}
          </motion.div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* VIN Breakdown */}
              <div className="p-5 rounded-xl border border-border bg-surface">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-text-primary flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-jade" />
                    VIN Analysis
                  </h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${CONFIDENCE_COLORS[result.vin.confidence as keyof typeof CONFIDENCE_COLORS] || CONFIDENCE_COLORS.LOW}`}>
                    {result.vin.confidence} CONFIDENCE
                  </span>
                </div>

                {/* VIN visual breakdown */}
                <div className="flex flex-wrap gap-1 mb-5">
                  {result.vin.wmi.split('').map((c, i) => (
                    <div key={`wmi-${i}`} className="w-9 h-11 flex flex-col items-center justify-center rounded-lg border border-accent/30 bg-accent/8">
                      <span className="font-mono text-sm font-bold text-accent">{c}</span>
                    </div>
                  ))}
                  <div className="w-4 flex items-center justify-center text-text-secondary text-xs">·</div>
                  {result.vin.vds.split('').map((c, i) => (
                    <div key={`vds-${i}`} className="w-9 h-11 flex flex-col items-center justify-center rounded-lg border border-amber/30 bg-amber/8">
                      <span className="font-mono text-sm font-bold text-amber">{c}</span>
                    </div>
                  ))}
                  <div className="w-4 flex items-center justify-center text-text-secondary text-xs">·</div>
                  {result.vin.vis.split('').map((c, i) => (
                    <div key={`vis-${i}`} className="w-9 h-11 flex flex-col items-center justify-center rounded-lg border border-jade/30 bg-jade/8">
                      <span className="font-mono text-sm font-bold text-jade">{c}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="p-3 rounded-lg border border-accent/20 bg-accent/5">
                    <div className="text-xs text-accent font-mono mb-1">WMI</div>
                    <div className="font-mono font-bold text-text-primary">{result.vin.wmi}</div>
                    <div className="text-xs text-text-secondary mt-1 truncate">{result.vin.manufacturer}</div>
                  </div>
                  <div className="p-3 rounded-lg border border-amber/20 bg-amber/5">
                    <div className="text-xs text-amber font-mono mb-1">VDS</div>
                    <div className="font-mono font-bold text-text-primary">{result.vin.vds}</div>
                    <div className="text-xs text-text-secondary mt-1">Model / Engine</div>
                  </div>
                  <div className="p-3 rounded-lg border border-jade/20 bg-jade/5">
                    <div className="text-xs text-jade font-mono mb-1">VIS</div>
                    <div className="font-mono font-bold text-text-primary">{result.vin.vis}</div>
                    <div className="text-xs text-text-secondary mt-1">Year: {result.vin.year || 'N/A'}</div>
                  </div>
                </div>

                {/* Decoded Info */}
                <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
                  <div><span className="text-text-secondary text-xs">Brand</span><div className="text-text-primary font-medium">{result.vin.brand}</div></div>
                  <div><span className="text-text-secondary text-xs">Country</span><div className="text-text-primary font-medium">{result.vin.country}</div></div>
                  <div><span className="text-text-secondary text-xs">Model Year</span><div className="text-text-primary font-medium">{result.vin.year || '—'}</div></div>
                </div>
              </div>

              {/* AI Explanation */}
              <div className="p-5 rounded-xl border border-border bg-surface">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-md bg-accent flex items-center justify-center">
                    <Zap size={10} className="text-white" />
                  </div>
                  <span className="text-sm font-medium text-text-primary">AI Explanation</span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{result.aiSummary}</p>
              </div>

              {/* Matched vehicles */}
              {result.matchedVehicles.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-3">
                    Matching Vehicles in Catalog ({result.matchedVehicles.length})
                  </h3>
                  <div className="grid gap-2">
                    {result.matchedVehicles.map(v => (
                      <motion.button
                        key={v.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => router.push(`/parts/${v.id}`)}
                        className="group flex items-center justify-between p-4 rounded-xl border border-border bg-surface hover:border-accent/40 hover:bg-panel text-left transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                            <Car size={14} className="text-accent" />
                          </div>
                          <div>
                            <div className="font-semibold text-text-primary text-sm">{v.brand.name} {v.model}</div>
                            <div className="text-xs text-text-secondary">{v.year} · {v.engine || v.fuelType} · {v.bodyType}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs text-text-secondary">
                            <Package size={10} />
                            {v._count.parts} parts
                          </div>
                          <ChevronRight size={14} className="text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {result.matchedVehicles.length === 0 && (
                <div className="p-5 rounded-xl border border-amber/20 bg-amber/5 text-sm text-amber">
                  No exact vehicle match in catalog for this VIN — but the AI has identified the brand and year above. Use the AI Assistant to search for parts by description.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
