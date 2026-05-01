'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Zap, ChevronRight, Package, Car } from 'lucide-react'

interface DecodeResult {
  vin: { raw: string; wmi: string; vds: string; vis: string; brand: string; manufacturer: string; country: string; year: number | null; confidence: string }
  matchedVehicles: Array<{ id: string; model: string; year: number; engine: string | null; fuelType: string; bodyType: string | null; brand: { name: string; nameZh: string }; _count: { parts: number } }>
  aiSummary: string
}

const CONF = { HIGH: '#00d4a0', MEDIUM: '#e8a020', LOW: '#f87171' }

export default function DecodeClient() {
  const params = useSearchParams()
  const router = useRouter()
  const [vin, setVin] = useState(params.get('vin') || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DecodeResult | null>(null)
  const [error, setError] = useState('')
  const [chars, setChars] = useState<string[]>([])

  useEffect(() => { const v = params.get('vin'); if (v) decode(v) }, [])

  async function decode(vinVal?: string) {
    const v = (vinVal || vin).trim()
    if (!v) return
    setLoading(true); setError(''); setResult(null); setChars([])

    const letters = v.split('')
    for (let i = 0; i < letters.length; i++) {
      await new Promise(r => setTimeout(r, 55))
      setChars(c => [...c, letters[i]])
    }

    try {
      const res = await fetch(`/api/decode?vin=${encodeURIComponent(v)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Decode failed')
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-grid" style={{ paddingTop: 52 }}>
      <div className="max-w-3xl mx-auto px-6 py-14">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-2 text-[#525270] text-xs mb-3">
            <div className="h-px w-4 bg-current" />
            <span className="font-mono uppercase tracking-widest">VIN / Chassis Decode</span>
          </div>
          <h1 className="text-3xl font-bold text-[#eaeaf5] mb-2 tracking-tight">Identify the vehicle.</h1>
          <p className="text-[#525270] text-sm">Enter the 11-17 character VIN from the door jamb, dash, or registration doc.</p>
        </motion.div>

        {/* Input */}
        <form onSubmit={e => { e.preventDefault(); decode() }} className="mb-10">
          <div className="flex items-center rounded-2xl overflow-hidden border border-[#18182a] bg-[#0c0c14]
            focus-within:border-[rgba(79,125,255,0.4)]" style={{ transition: 'border-color 0.15s' }}>
            <Search size={14} className="ml-5 text-[#525270] shrink-0 pointer-events-none" />
            <input
              type="text" value={vin} onChange={e => setVin(e.target.value.toUpperCase())}
              placeholder="LGXCE4GB2M1234567" maxLength={17}
              className="flex-1 bg-transparent px-4 py-4 text-sm font-mono text-[#eaeaf5] placeholder-[#2a2a45] focus:outline-none tracking-widest"
            />
            <span className="text-xs font-mono text-[#2a2a45] mr-3">{vin.length}/17</span>
            <button type="submit" disabled={loading || vin.length < 5}
              className="m-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-30 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #4f7dff, #2d5bff)' }}>
              <Zap size={12} />{loading ? 'Decoding...' : 'Decode'}
            </button>
          </div>
          <div className="flex gap-5 mt-3 pl-1">
            {['LGXCE4GB2M1234567', 'LSJ24U11000012345', 'L8XAE4HB2M000001'].map(ex => (
              <button key={ex} type="button" onClick={() => { setVin(ex); decode(ex) }}
                className="text-[10px] font-mono text-[#2a2a45] hover:text-[#8aafff] transition-colors">{ex}</button>
            ))}
          </div>
        </form>

        {/* Scanning animation */}
        <AnimatePresence>
          {loading && chars.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mb-8 p-6 rounded-2xl border border-[#18182a] bg-[#0c0c14]">
              <div className="text-xs font-mono text-[#4f7dff] mb-4 uppercase tracking-widest">Scanning VIN...</div>

              {/* Character grid */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {chars.map((c, i) => {
                  const seg = i < 3 ? 'wmi' : i < 9 ? 'vds' : 'vis'
                  const colors = { wmi: { bg: 'rgba(79,125,255,0.12)', border: 'rgba(79,125,255,0.35)', text: '#8aafff' }, vds: { bg: 'rgba(232,160,32,0.1)', border: 'rgba(232,160,32,0.3)', text: '#e8a020' }, vis: { bg: 'rgba(0,212,160,0.08)', border: 'rgba(0,212,160,0.25)', text: '#00d4a0' } }
                  const col = colors[seg]
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 4, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="w-8 h-10 flex items-center justify-center rounded-lg border font-mono text-sm font-bold"
                      style={{ background: col.bg, borderColor: col.border, color: col.text }}>
                      {c}
                    </motion.div>
                  )
                })}
                <motion.div animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.7 }}
                  className="w-1 h-10 rounded-sm ml-1 bg-[#4f7dff]" />
              </div>

              <div className="flex gap-5 text-[10px] font-mono">
                <span style={{ color: '#8aafff' }}>■ WMI — Manufacturer</span>
                <span style={{ color: '#e8a020' }}>■ VDS — Model / Engine</span>
                <span style={{ color: '#00d4a0' }}>■ VIS — Year / Serial</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">

              {/* VIN breakdown */}
              <div className="rounded-2xl border border-[#18182a] bg-[#0c0c14] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#18182a]">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00d4a0]" />
                    <span className="text-xs font-mono text-[#525270] uppercase tracking-widest">VIN Analysis</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono"
                    style={{ color: CONF[result.vin.confidence as keyof typeof CONF] || '#f87171' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: CONF[result.vin.confidence as keyof typeof CONF] || '#f87171' }} />
                    {result.vin.confidence}
                  </div>
                </div>

                <div className="p-5">
                  {/* VIN visual */}
                  <div className="flex flex-wrap gap-1 mb-5">
                    {result.vin.wmi.split('').map((c, i) => (
                      <div key={`w${i}`} className="w-8 h-9 flex items-center justify-center rounded-lg font-mono text-xs font-bold"
                        style={{ background: 'rgba(79,125,255,0.1)', border: '1px solid rgba(79,125,255,0.25)', color: '#8aafff' }}>{c}</div>
                    ))}
                    <div className="w-3 flex items-center justify-center text-[#18182a] text-xs">·</div>
                    {result.vin.vds.split('').map((c, i) => (
                      <div key={`v${i}`} className="w-8 h-9 flex items-center justify-center rounded-lg font-mono text-xs font-bold"
                        style={{ background: 'rgba(232,160,32,0.08)', border: '1px solid rgba(232,160,32,0.2)', color: '#e8a020' }}>{c}</div>
                    ))}
                    <div className="w-3 flex items-center justify-center text-[#18182a] text-xs">·</div>
                    {result.vin.vis.split('').map((c, i) => (
                      <div key={`s${i}`} className="w-8 h-9 flex items-center justify-center rounded-lg font-mono text-xs font-bold"
                        style={{ background: 'rgba(0,212,160,0.06)', border: '1px solid rgba(0,212,160,0.18)', color: '#00d4a0' }}>{c}</div>
                    ))}
                  </div>

                  {/* 3 segment labels */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'WMI', val: result.vin.wmi, sub: result.vin.manufacturer, color: '#8aafff' },
                      { label: 'VDS', val: result.vin.vds, sub: 'Model / Engine / Body', color: '#e8a020' },
                      { label: 'VIS', val: result.vin.vis, sub: `Year: ${result.vin.year || '—'}`, color: '#00d4a0' },
                    ].map(seg => (
                      <div key={seg.label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #18182a' }}>
                        <div className="text-[10px] font-mono mb-1" style={{ color: seg.color }}>{seg.label}</div>
                        <div className="font-mono font-bold text-[#eaeaf5] text-sm">{seg.val}</div>
                        <div className="text-[10px] text-[#525270] mt-1 truncate">{seg.sub}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-6 text-xs">
                    <div><span className="text-[#525270]">Brand: </span><span className="text-[#eaeaf5] font-medium">{result.vin.brand}</span></div>
                    <div><span className="text-[#525270]">Country: </span><span className="text-[#eaeaf5] font-medium">{result.vin.country}</span></div>
                    <div><span className="text-[#525270]">Year: </span><span className="text-[#eaeaf5] font-medium">{result.vin.year || '—'}</span></div>
                  </div>
                </div>
              </div>

              {/* AI explanation */}
              <div className="rounded-2xl border border-[#18182a] bg-[#0c0c14] overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-[#18182a]">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(79,125,255,0.12)' }}>
                    <Zap size={10} className="text-[#4f7dff]" />
                  </div>
                  <span className="text-xs font-mono text-[#525270] uppercase tracking-widest">AI Breakdown</span>
                </div>
                <div className="px-5 py-4 text-sm text-[#8a8ab0] leading-relaxed whitespace-pre-line">{result.aiSummary}</div>
              </div>

              {/* Matched vehicles */}
              {result.matchedVehicles.length > 0 && (
                <div>
                  <div className="text-xs font-mono text-[#525270] uppercase tracking-widest mb-3 mt-2">
                    {result.matchedVehicles.length} match{result.matchedVehicles.length !== 1 ? 'es' : ''} in catalog
                  </div>
                  <div className="space-y-2">
                    {result.matchedVehicles.map(v => (
                      <motion.button key={v.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                        onClick={() => router.push(`/parts/${v.id}`)}
                        className="group part-card w-full flex items-center justify-between p-4 rounded-xl border border-[#18182a] bg-[#0c0c14] text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'rgba(79,125,255,0.08)', border: '1px solid rgba(79,125,255,0.18)' }}>
                            <Car size={13} className="text-[#4f7dff]" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[#eaeaf5]">{v.brand.name} {v.model}</div>
                            <div className="text-xs text-[#525270] mt-0.5">{v.year} · {v.engine || v.fuelType} · {v.bodyType}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[#525270] flex items-center gap-1"><Package size={9} />{v._count.parts}</span>
                          <ChevronRight size={13} className="text-[#4f7dff] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {result.matchedVehicles.length === 0 && (
                <div className="p-4 rounded-xl text-xs text-[#e8a020]"
                  style={{ background: 'rgba(232,160,32,0.05)', border: '1px solid rgba(232,160,32,0.15)' }}>
                  No exact match in catalog — use AI Search to find parts by description.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
