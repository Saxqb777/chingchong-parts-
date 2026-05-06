'use client'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface ApiPart {
  name: string; nameZh: string; oemNumber: string
  category: string; categoryZh: string; matched: boolean
}
interface CarInfo {
  brand: string; brandZh: string; model: string; year: number
  fuelType: string; epc: string; vehicleId: string
}
interface DecodeResult {
  vin: { raw: string; wmi: string; vds: string; vis: string; brand: string; manufacturer: string; country: string; year: number | null; confidence: string }
  carInfo: CarInfo
  parts: ApiPart[]
  aiSummary: string
}

const SEG_LABELS = [
  { key: 'wmi', label: 'WMI', sub: 'Manufacturer', color: '#C8312B' },
  { key: 'vds', label: 'VDS', sub: 'Model · Engine · Body', color: '#A88A4A' },
  { key: 'vis', label: 'VIS', sub: 'Year · Serial', color: '#5C7A3E' },
]

const FUEL_CLASS: Record<string, string> = {
  Electric: 'fuel-ev', Hybrid: 'fuel-hybrid', Diesel: 'fuel-diesel', Petrol: 'fuel-petrol',
}

const SYNONYMS: Record<string, string[]> = {
  headlight: ['headlight', 'head lamp', '前大灯', '前照灯', '大灯'],
  taillight: ['taillight', 'tail lamp', '尾灯'],
  fog: ['fog light', 'fog lamp', '雾灯'],
  'brake pad': ['brake pad', '刹车片', '制动片'],
  brake: ['brake', '刹车', '制动'],
  'oil filter': ['oil filter', '机油滤清器', '机油滤芯'],
  'air filter': ['air filter', '空气滤清器'],
  'spark plug': ['spark plug', '火花塞'],
  alternator: ['alternator', '发电机'],
  starter: ['starter', '起动机'],
  radiator: ['radiator', '散热器', '水箱'],
  'water pump': ['water pump', '水泵'],
  'shock absorber': ['shock absorber', '减震器', '减振器'],
  bumper: ['bumper', '保险杠'],
  fender: ['fender', '翼子板'],
  engine: ['engine', '发动机'],
  transmission: ['transmission', 'gearbox', '变速箱'],
  battery: ['battery', '电池', '蓄电池'],
  wiper: ['wiper', '雨刷', '刮水器'],
}

function getSynonyms(q: string): string[] {
  const lower = q.toLowerCase().trim()
  if (SYNONYMS[lower]) return SYNONYMS[lower]
  for (const terms of Object.values(SYNONYMS)) {
    if (terms.some(t => t === lower || t.startsWith(lower) || lower.startsWith(t.split(' ')[0]))) return terms
  }
  return [lower]
}

function copyText(text: string) {
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(() => legacyCopy(text))
  else legacyCopy(text)
}
function legacyCopy(text: string) {
  const el = document.createElement('textarea')
  el.value = text; el.style.cssText = 'position:fixed;opacity:0'
  document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
}

export default function DecodeClient() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [vin, setVin] = useState(params.get('vin') || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DecodeResult | null>(null)
  const [error, setError] = useState('')
  const [scanChars, setScanChars] = useState<string[]>([])
  const [stamped, setStamped] = useState(false)

  // Parts state
  const [search, setSearch] = useState(params.get('q') || '')
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [copiedOem, setCopiedOem] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { const v = params.get('vin'); if (v) decode(v) }, [])

  async function decode(vinVal?: string) {
    const v = (vinVal || vin).trim().toUpperCase()
    if (!v || v.length < 5) return
    setVin(v)
    setLoading(true); setError(''); setResult(null); setScanChars([]); setStamped(false)
    setSelectedCat(null)

    const letters = v.split('')
    for (let i = 0; i < letters.length; i++) {
      await new Promise(r => setTimeout(r, 45))
      setScanChars(c => [...c, letters[i]])
    }

    try {
      const res = await fetch(`/api/decode?vin=${encodeURIComponent(v)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Decode failed')
      await new Promise(r => setTimeout(r, 80))
      setStamped(true)
      await new Promise(r => setTimeout(r, 100))
      setResult(data)
      setTimeout(() => searchRef.current?.focus(), 200)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Decode failed')
    } finally { setLoading(false) }
  }

  const categories = useMemo(() => {
    if (!result) return []
    const seen = new Map<string, string>()
    for (const p of result.parts) {
      if (!seen.has(p.category)) seen.set(p.category, p.categoryZh)
    }
    return Array.from(seen.entries()).map(([name, nameZh]) => ({ name, nameZh }))
  }, [result])

  const filteredParts = useMemo(() => {
    if (!result) return { matching: [], rest: [] }
    const pool = selectedCat ? result.parts.filter(p => p.category === selectedCat) : result.parts
    if (!search.trim()) return { matching: pool, rest: [] }
    const terms = getSynonyms(search)
    const matching = pool.filter(p => {
      const n = p.name.toLowerCase(); const zh = p.nameZh.toLowerCase(); const oem = p.oemNumber.toLowerCase()
      return terms.some(t => n.includes(t) || zh.includes(t) || oem.includes(t))
    })
    if (matching.length > 0) {
      const ids = new Set(matching.map(p => p.oemNumber))
      return { matching, rest: pool.filter(p => !ids.has(p.oemNumber)) }
    }
    const byCat = pool.filter(p => terms.some(t => p.category.toLowerCase().includes(t) || p.categoryZh.includes(t)))
    const catIds = new Set(byCat.map(p => p.oemNumber))
    return { matching: byCat, rest: pool.filter(p => !catIds.has(p.oemNumber)) }
  }, [result, search, selectedCat])

  function doCopy(oem: string) {
    copyText(oem)
    setCopiedOem(oem)
    setTimeout(() => setCopiedOem(null), 1400)
  }

  const segOf = (i: number) => i < 3 ? 'wmi' : i < 9 ? 'vds' : 'vis'
  const segColor: Record<string, string> = { wmi: '#C8312B', vds: '#A88A4A', vis: '#5C7A3E' }

  return (
    <div className="min-h-screen bg-paper">

      {/* ── Top: VIN input strip ── */}
      <div className="border-b border-paper-edge bg-paper-deep">
        <div className="px-12 py-8" style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8 bg-paper-edge" />
            <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest">VIN · Chassis Decode</span>
          </div>
          <form onSubmit={e => { e.preventDefault(); decode() }} className="flex gap-3 items-stretch">
            <div className="vin-input-wrapper flex-1 flex items-center">
              <span className="font-mono text-2xs text-ink-mute pl-4 select-none border-r border-paper-edge pr-3 mr-1">VIN</span>
              <input
                type="text" value={vin}
                onChange={e => setVin(e.target.value.toUpperCase())}
                placeholder="LGXCE4GB2M1234567"
                maxLength={17}
                className="flex-1 px-3 py-3 font-mono text-sm bg-transparent text-ink placeholder-ink-mute focus:outline-none tracking-widest"
              />
              <span className="font-mono text-2xs text-ink-mute pr-4">{vin.length}/17</span>
            </div>
            <button type="submit" disabled={loading || vin.length < 5} className="btn-vermillion shrink-0 disabled:opacity-40">
              {loading ? 'Scanning...' : 'Decode →'}
            </button>
          </form>

          <div className="flex gap-5 mt-3">
            <span className="font-mono text-2xs text-ink-mute">Examples:</span>
            {['LGXCE4GB2M1234567', 'L8XAE4HB2M000001'].map(ex => (
              <button key={ex} onClick={() => { setVin(ex); decode(ex) }}
                className="font-mono text-2xs text-ink-mute hover:text-vermillion underline underline-offset-2 transition-colors">{ex}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scanning animation ── */}
      <AnimatePresence>
        {loading && scanChars.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="border-b border-paper-edge bg-paper">
            <div className="px-12 py-6" style={{ maxWidth: 1400, margin: '0 auto' }}>
              <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-4">Parsing VIN structure...</div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {scanChars.map((c, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="w-8 h-9 flex items-center justify-center border font-mono text-xs font-medium bg-white"
                    style={{ borderColor: segColor[segOf(i)], color: segColor[segOf(i)] }}>{c}</motion.div>
                ))}
              </div>
              <div className="flex gap-6 font-mono text-2xs">
                {SEG_LABELS.map(s => <span key={s.key} style={{ color: s.color }}>■ {s.label}</span>)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="px-12 py-4 border-b border-paper-edge">
          <div className="text-sm text-ink-soft p-4 border border-paper-edge bg-paper-deep">{error}</div>
        </div>
      )}

      {/* ── Result ── */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>

            {/* Car banner */}
            <div className="bg-paper-deep border-b border-paper-edge">
              <div className="px-12 py-8" style={{ maxWidth: 1400, margin: '0 auto' }}>
                <div className="flex items-end justify-between gap-8">
                  <div>
                    <div className="font-mono text-xs text-ink-mute uppercase tracking-widest mb-1">{result.carInfo.brand}</div>
                    <h1 className="font-serif font-bold text-ink leading-none mb-4"
                      style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', letterSpacing: '-0.03em' }}>
                      {result.carInfo.model}
                    </h1>
                    <div className="flex items-center gap-0">
                      {[
                        { val: result.carInfo.year.toString() },
                        { val: result.carInfo.fuelType, cls: FUEL_CLASS[result.carInfo.fuelType] },
                        { val: `${result.parts.length} parts`, cls: undefined },
                        result.carInfo.epc ? { val: `EPC: ${result.carInfo.epc}`, cls: undefined } : null,
                      ].filter(Boolean).map((item, i) => (
                        <div key={i} className="flex items-center">
                          {i > 0 && <div className="mx-4 h-3 w-px bg-paper-edge" />}
                          {item!.cls
                            ? <span className={`font-mono text-xs px-1.5 py-0.5 ${item!.cls}`}>{item!.val}</span>
                            : <span className="font-mono text-sm text-ink-soft">{item!.val}</span>}
                        </div>
                      ))}
                    </div>
                    {result.aiSummary && (
                      <p className="text-sm text-ink-mute mt-3 max-w-xl leading-relaxed">{result.aiSummary}</p>
                    )}
                  </div>

                  {/* VIN breakdown */}
                  <div className="shrink-0 space-y-2 text-right hidden lg:block">
                    {SEG_LABELS.map(seg => (
                      <div key={seg.key} className="flex items-center gap-3 justify-end">
                        <span className="font-mono text-2xs text-ink-mute">{seg.sub}</span>
                        <span className="font-mono text-xs font-bold" style={{ color: seg.color }}>
                          {result.vin[seg.key as keyof typeof result.vin] as string}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Search + filter strip */}
            <div className="border-b border-paper-edge sticky top-0 z-10 bg-paper">
              <div className="px-12" style={{ maxWidth: 1400, margin: '0 auto' }}>
                <div className="vin-input-wrapper flex items-center mt-4 mb-3">
                  <span className="font-mono text-sm text-ink-mute pl-4 select-none">⌕</span>
                  <input
                    ref={searchRef}
                    type="text" value={search}
                    onChange={e => { setSearch(e.target.value); setSelectedCat(null) }}
                    placeholder="Search by part name, OEM number, or 中文…"
                    className="flex-1 px-4 py-3 text-sm bg-transparent text-ink placeholder-ink-mute focus:outline-none"
                  />
                  {search && (
                    <button onClick={() => setSearch('')}
                      className="font-mono text-xs text-ink-mute hover:text-vermillion px-4 transition-colors">✕</button>
                  )}
                </div>
                <div className="cat-chips pb-0">
                  <button onClick={() => setSelectedCat(null)} className={`cat-chip ${!selectedCat ? 'active' : ''}`}>
                    All · {result.parts.length}
                  </button>
                  {categories.map(cat => {
                    const count = result.parts.filter(p => p.category === cat.name).length
                    return (
                      <button key={cat.name} onClick={() => setSelectedCat(cat.name === selectedCat ? null : cat.name)}
                        className={`cat-chip ${selectedCat === cat.name ? 'active' : ''}`}>
                        {cat.name} · {count}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Parts table */}
            <div className="px-12 py-6" style={{ maxWidth: 1400, margin: '0 auto' }}>
              {result.parts.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-ink-mute text-sm mb-2">No parts found for this VIN in the catalog.</p>
                  <p className="text-ink-mute text-xs">Try a different VIN or use the AI Search on the homepage.</p>
                </div>
              ) : (
                <>
                  {/* Table header */}
                  <div className="grid pb-2 border-b-2 border-paper-edge"
                    style={{ gridTemplateColumns: '2fr 1.4fr 0.8fr auto' }}>
                    <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest">Part Name</span>
                    <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest">OEM Number</span>
                    <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest">Category</span>
                    <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest text-right">Copy</span>
                  </div>

                  {/* Matching section */}
                  {search && filteredParts.matching.length > 0 && (
                    <div className="flex items-center gap-3 pt-4 pb-2">
                      <span className="font-mono text-2xs uppercase tracking-widest" style={{ color: 'var(--vermillion)' }}>
                        配件搜索 · MATCHING &ldquo;{search.toUpperCase()}&rdquo;
                      </span>
                      <span className="font-mono text-2xs text-ink-mute">· {filteredParts.matching.length} found</span>
                    </div>
                  )}

                  {filteredParts.matching.map(part => (
                    <PartRow key={part.oemNumber || part.name} part={part}
                      highlighted={!!search} copied={copiedOem === part.oemNumber}
                      onCopy={() => doCopy(part.oemNumber)} />
                  ))}

                  {search && filteredParts.rest.length > 0 && (
                    <div className="border-t-2 border-paper-edge mt-4 pt-4 pb-2 flex items-center gap-3">
                      <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest">其他配件 · ALL OTHER PARTS</span>
                      <span className="font-mono text-2xs text-ink-mute">· {filteredParts.rest.length}</span>
                    </div>
                  )}

                  {filteredParts.rest.map(part => (
                    <PartRow key={part.oemNumber || part.name} part={part}
                      highlighted={false} copied={copiedOem === part.oemNumber}
                      onCopy={() => doCopy(part.oemNumber)} />
                  ))}

                  {filteredParts.matching.length === 0 && filteredParts.rest.length === 0 && search && (
                    <div className="text-center py-16">
                      <p className="text-sm text-ink-mute">No parts matching &ldquo;{search}&rdquo;</p>
                      <button onClick={() => setSearch('')}
                        className="font-mono text-xs text-ink-mute hover:text-vermillion underline mt-3 transition-colors">
                        Clear search → browse all {result.parts.length} parts
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-32 text-center px-12">
          <div className="font-cjk text-5xl text-paper-edge mb-6">配</div>
          <p className="text-ink-mute text-sm">Enter a VIN above to see all parts for that vehicle</p>
        </div>
      )}
    </div>
  )
}

function PartRow({ part, highlighted, copied, onCopy }: {
  part: ApiPart; highlighted: boolean; copied: boolean; onCopy: () => void
}) {
  return (
    <motion.div
      layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="grid items-center border-b border-paper-edge"
      style={{
        gridTemplateColumns: '2fr 1.4fr 0.8fr auto',
        borderLeft: highlighted ? '3px solid var(--vermillion)' : '3px solid transparent',
      }}
    >
      <div className="py-3 pr-6">
        {part.nameZh
          ? <><div className="hanzi-primary">{part.nameZh}</div><div className="hanzi-secondary">{part.name}</div></>
          : <div className="text-sm font-medium text-ink">{part.name}</div>
        }
      </div>
      <div className="py-3 pr-6">
        {part.oemNumber
          ? <span className="oem-main">{part.oemNumber}</span>
          : <span className="font-mono text-xs text-ink-mute">—</span>
        }
      </div>
      <div className="py-3 pr-6">
        <span className="font-mono text-2xs text-ink-mute uppercase tracking-wide">{part.category}</span>
        <div className="font-cjk text-ink-mute mt-0.5" style={{ fontSize: '0.6rem' }}>{part.categoryZh}</div>
      </div>
      <div className="py-3 flex justify-end">
        {part.oemNumber ? (
          <button onClick={onCopy} className={`copy-btn${copied ? ' copied' : ''}`}>
            {copied ? '已复制 ✓' : '复制 ⎘'}
          </button>
        ) : <span />}
      </div>
    </motion.div>
  )
}
