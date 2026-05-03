'use client'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

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
interface Props { vehicle: Vehicle; categories: Category[]; initialQuery?: string }

const FUEL_CLASS: Record<string, string> = {
  Electric: 'fuel-ev', Hybrid: 'fuel-hybrid', Diesel: 'fuel-diesel', Petrol: 'fuel-petrol',
}

// ── Synonym map: query key → terms that count as a match in part name/zh ──
const SYNONYMS: Record<string, string[]> = {
  headlight:       ['headlight', 'head lamp', 'headlamp', 'head light', '前大灯', '前照灯', '大灯'],
  taillight:       ['taillight', 'tail lamp', 'tail light', 'rear light', '尾灯', '后大灯'],
  fog:             ['fog light', 'fog lamp', '雾灯'],
  'brake pad':     ['brake pad', 'brake pads', '刹车片', '前刹车片', '后刹车片'],
  brake:           ['brake', '刹车', '制动'],
  'oil filter':    ['oil filter', '机油滤清器', '机油滤芯'],
  'air filter':    ['air filter', '空气滤清器', '空滤'],
  'fuel filter':   ['fuel filter', '燃油滤清器'],
  'spark plug':    ['spark plug', '火花塞'],
  alternator:      ['alternator', '发电机'],
  starter:         ['starter motor', 'starter', '起动机'],
  radiator:        ['radiator', '散热器', '水箱'],
  'water pump':    ['water pump', '水泵'],
  'timing belt':   ['timing belt', 'timing chain', '正时皮带', '正时链'],
  'serpentine belt':['serpentine belt', '传动皮带'],
  'wheel bearing': ['wheel bearing', '轮毂轴承'],
  'ball joint':    ['ball joint', '球头'],
  'tie rod':       ['tie rod', '拉杆'],
  'control arm':   ['control arm', '摆臂'],
  'shock absorber':['shock absorber', 'shock', '减震器', '减振器', 'damper'],
  strut:           ['strut', '支柱'],
  'side mirror':   ['side mirror', 'wing mirror', '后视镜'],
  windshield:      ['windshield', 'windscreen', '风挡', '挡风玻璃'],
  wiper:           ['wiper', 'wiper blade', '雨刷', '刮水器'],
  'door handle':   ['door handle', '门把手'],
  fender:          ['fender', '翼子板'],
  bumper:          ['bumper', '保险杠'],
  hood:            ['hood', 'bonnet', '引擎盖', '前盖'],
  engine:          ['engine', 'motor', '发动机', 'engine assembly'],
  transmission:    ['transmission', 'gearbox', '变速箱', '变速器'],
  clutch:          ['clutch', '离合器'],
  turbo:           ['turbo', 'turbocharger', '涡轮'],
  battery:         ['battery', '电池', '蓄电池'],
  thermostat:      ['thermostat', '节温器'],
}

function getSynonyms(q: string): string[] {
  const lower = q.toLowerCase().trim()
  // Direct key match
  if (SYNONYMS[lower]) return SYNONYMS[lower]
  // Any synonym group that contains the query as substring
  for (const terms of Object.values(SYNONYMS)) {
    if (terms.some(t => t === lower || t.startsWith(lower) || lower.startsWith(t.split(' ')[0]))) {
      return terms
    }
  }
  return [lower]
}

function matchesByName(part: Part, terms: string[]): boolean {
  const name = part.name.toLowerCase()
  const nameZh = (part.nameZh || '').toLowerCase()
  const oem = part.oemNumber.toLowerCase()
  return terms.some(t => name.includes(t) || nameZh.includes(t) || oem.includes(t))
}

function matchesByCategory(part: Part, terms: string[]): boolean {
  const cat = part.category.name.toLowerCase()
  const catZh = part.category.nameZh
  return terms.some(t => cat.includes(t) || catZh.includes(t))
}

// Name match takes priority; category is a last resort only if nothing matches by name
function splitParts(parts: Part[], query: string, catFilter: string | null): { matching: Part[]; rest: Part[] } {
  if (!query) {
    const all = catFilter ? parts.filter(p => p.category.id === catFilter) : parts
    return { matching: all, rest: [] }
  }
  const terms = getSynonyms(query)
  const pool = catFilter ? parts.filter(p => p.category.id === catFilter) : parts
  const byName = pool.filter(p => matchesByName(p, terms))
  if (byName.length > 0) {
    const matchIds = new Set(byName.map(p => p.id))
    return { matching: byName, rest: pool.filter(p => !matchIds.has(p.id)) }
  }
  // Fallback: category match only if zero name matches
  const byCat = pool.filter(p => matchesByCategory(p, terms))
  const catIds = new Set(byCat.map(p => p.id))
  return { matching: byCat, rest: pool.filter(p => !catIds.has(p.id)) }
}

function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => legacyCopy(text))
  } else { legacyCopy(text) }
}
function legacyCopy(text: string) {
  const el = document.createElement('textarea')
  el.value = text; el.style.cssText = 'position:fixed;opacity:0'
  document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
}

/* ── AI Modal ── */
const AI_LOADING = ['配件库 조회중...', 'Scanning catalog...', 'Cross-referencing OEM...', 'Getting your parts ready...']

function AiModal({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState('')
  const [loadingText, setLoadingText] = useState(AI_LOADING[0])
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  useEffect(() => {
    if (loading) {
      let i = 0
      timerRef.current = setInterval(() => { i = (i + 1) % AI_LOADING.length; setLoadingText(AI_LOADING[i]) }, 850)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [loading])

  async function ask() {
    const q = input.trim()
    if (!q || loading) return
    setLoading(true); setResponse('')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `About ${vehicle.brand.name} ${vehicle.model} ${vehicle.year}: ${q}` }],
        }),
      })
      if (!res.ok || !res.body) throw new Error('Failed')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n')) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try { const t = JSON.parse(line.slice(6)).delta?.text || ''; full += t; setResponse(full) } catch { /* skip */ }
          }
        }
      }
    } catch { setResponse('Connection error. Check your API key and try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ background: 'rgba(28,24,21,0.7)' }}>
      <motion.div
        initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        exit={{ x: 60, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}
        className="modal-panel" onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-paper-edge shrink-0">
          <div>
            <div className="font-mono text-2xs text-vermillion uppercase tracking-widest mb-0.5">询问 · Ask AI</div>
            <div className="font-mono text-2xs text-ink-mute">{vehicle.brand.name} {vehicle.model} {vehicle.year}</div>
          </div>
          <button onClick={onClose} className="font-mono text-xs text-ink-mute hover:text-vermillion transition-colors px-2 py-1">Esc ✕</button>
        </div>
        <div className="px-6 pt-5 pb-4 border-b border-paper-edge shrink-0 bg-paper-deep">
          <div className="flex gap-3">
            <input
              ref={inputRef} type="text" value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') ask() }}
              placeholder="e.g. front headlight, brake pads, oil filter…"
              disabled={loading}
              className="flex-1 bg-white border border-paper-edge px-3 py-2.5 text-sm font-mono text-ink placeholder-ink-mute focus:outline-none focus:border-ink-soft disabled:opacity-50"
            />
            <button onClick={ask} disabled={!input.trim() || loading}
              className="btn-vermillion shrink-0 disabled:opacity-30" style={{ padding: '8px 18px' }}>
              Ask →
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!response && !loading && (
            <p className="text-sm text-ink-mute leading-relaxed">
              Describe the part in plain language. The assistant returns the OEM number,
              alternatives, and fitment notes for {vehicle.brand.name} {vehicle.model}.
            </p>
          )}
          {loading && (
            <div>
              <motion.div key={loadingText} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                className="font-mono text-2xs text-vermillion uppercase tracking-widest mb-4">{loadingText}</motion.div>
              {response
                ? <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-wrap">{response}<span className="inline-block w-0.5 h-4 bg-vermillion ml-0.5 align-middle" /></p>
                : <div className="flex gap-1.5 py-2">
                    {[0,1,2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-paper-edge"
                        animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} />
                    ))}
                  </div>
              }
            </div>
          )}
          {response && !loading && (
            <div className="text-sm text-ink-soft leading-relaxed whitespace-pre-wrap">{response}</div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

/* ── Shortcuts overlay ── */
function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  const groups = [
    { label: 'Global', items: [['?', 'Show this overlay'], ['Esc', 'Close modal / clear search'], ['g h', 'Go to homepage'], ['g c', 'Go to catalog'], ['g v', 'Go to VIN decode']] },
    { label: 'Result Page', items: [['/', 'Focus search'], ['↑ ↓', 'Navigate rows'], ['Enter / C', 'Copy focused OEM'], ['A', 'Open Ask · 询问'], ['B', 'Go back'], ['1–9', 'Jump to category'], ['0', 'Reset to All']] },
    { label: 'Ask Modal', items: [['Enter', 'Submit query'], ['Esc', 'Close modal']] },
  ]
  return (
    <div className="modal-overlay" style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 0, background: 'rgba(28,24,21,0.7)' }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.15 }}
        onClick={e => e.stopPropagation()}
        className="bg-paper border border-paper-edge p-8 w-96 max-h-screen overflow-y-auto"
      >
        <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-6">Keyboard Shortcuts</div>
        <div className="space-y-6">
          {groups.map(g => (
            <div key={g.label}>
              <div className="font-mono text-2xs text-vermillion uppercase tracking-widest mb-3">{g.label}</div>
              <div className="space-y-2">
                {g.items.map(([key, desc]) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-ink-soft">{desc}</span>
                    <kbd className="kbd-chip shrink-0">{key}</kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-6 font-mono text-2xs text-ink-mute hover:text-vermillion transition-colors underline">
          Close (Esc)
        </button>
      </motion.div>
    </div>
  )
}

/* ── Part row ── */
function PartRow({
  part, isFocused, isHighlighted, copiedId, onFocus, onCopy, rowRef,
}: {
  part: Part; isFocused: boolean; isHighlighted: boolean; copiedId: string | null
  onFocus: () => void; onCopy: () => void; rowRef: (el: HTMLDivElement | null) => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}
      ref={rowRef}
      tabIndex={0}
      onFocus={onFocus}
      onClick={onFocus}
      className={`part-row-tr grid items-center outline-none`}
      style={{
        gridTemplateColumns: '2fr 1.2fr 0.8fr auto',
        borderLeft: (isFocused || isHighlighted) ? '3px solid var(--vermillion)' : '3px solid transparent',
        background: isFocused ? 'var(--paper-deep)' : undefined,
      }}
    >
      <div className="py-4 pr-6">
        {part.nameZh
          ? <><div className="hanzi-primary">{part.nameZh}</div><div className="hanzi-secondary">{part.name}</div></>
          : <div className="text-sm font-medium text-ink">{part.name}</div>
        }
        {part.position && (
          <div className="font-mono text-2xs text-ink-mute mt-0.5">{part.position}</div>
        )}
      </div>

      <div className="py-4 pr-6">
        <span className={`oem-main${isFocused ? ' text-vermillion' : ''}`}>{part.oemNumber}</span>
        {part.altNumbers && <div className="font-mono text-2xs text-gold mt-1">{part.altNumbers}</div>}
      </div>

      <div className="py-4 pr-6">
        <span className="font-mono text-2xs text-ink-mute uppercase tracking-wide">{part.category.name}</span>
        <div className="font-cjk text-2xs text-ink-mute mt-0.5" style={{ fontSize: '0.6rem' }}>{part.category.nameZh}</div>
      </div>

      <div className="py-4 flex justify-end">
        <button
          onClick={e => { e.stopPropagation(); onCopy() }}
          className={`copy-btn${copiedId === part.id ? ' copied' : ''}`}
        >
          {copiedId === part.id ? '已复制 ✓' : '复制 ⎘'}
        </button>
      </div>
    </motion.div>
  )
}

/* ── Main ── */
export default function PartsClient({ vehicle, categories, initialQuery = '' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [search, setSearch] = useState(initialQuery)
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const gPressed = useRef(false)
  const gTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-focus search only if no initial query (otherwise cursor goes to end of pre-filled value)
  useEffect(() => {
    if (searchRef.current) {
      searchRef.current.focus()
      const len = searchRef.current.value.length
      searchRef.current.setSelectionRange(len, len)
    }
  }, [])

  const catsWithParts = useMemo(() => {
    const ids = new Set(vehicle.parts.map(p => p.category.id))
    return categories.filter(c => ids.has(c.id))
  }, [vehicle.parts, categories])

  const { matching, rest } = useMemo(
    () => splitParts(vehicle.parts, search, selectedCat),
    [vehicle.parts, search, selectedCat]
  )

  // Flat ordered list for keyboard nav (matching first, then rest)
  const allVisible = useMemo(() => [...matching, ...rest], [matching, rest])

  function clearSearch() {
    setSearch('')
    setFocusedIdx(null)
    // Remove ?q= from URL without reload
    router.replace(pathname, { scroll: false })
    setTimeout(() => searchRef.current?.focus(), 0)
  }

  function copyRow(part: Part) {
    copyText(part.oemNumber)
    setCopiedId(part.id)
    const el = rowRefs.current.get(part.id)
    if (el) { el.classList.add('row-flash'); setTimeout(() => el.classList.remove('row-flash'), 1500) }
    setTimeout(() => setCopiedId(null), 1400)
  }

  const catList = useMemo(() => [null, ...catsWithParts.map(c => c.id)], [catsWithParts])

  const handleKeyboard = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA'

    if (e.key.toLowerCase() === 'g' && !isInput && !aiOpen && !shortcutsOpen) {
      gPressed.current = true
      if (gTimer.current) clearTimeout(gTimer.current)
      gTimer.current = setTimeout(() => { gPressed.current = false }, 1000)
      return
    }
    if (gPressed.current && !isInput) {
      gPressed.current = false
      if (gTimer.current) clearTimeout(gTimer.current)
      if (e.key.toLowerCase() === 'h') { router.push('/'); return }
      if (e.key.toLowerCase() === 'c') { router.push('/catalog'); return }
      if (e.key.toLowerCase() === 'v') { router.push('/decode'); return }
    }

    if (e.key === '?' && !isInput) { e.preventDefault(); setShortcutsOpen(s => !s); return }

    if (e.key === 'Escape') {
      if (aiOpen) { setAiOpen(false); return }
      if (shortcutsOpen) { setShortcutsOpen(false); return }
      if (isInput && search) { clearSearch(); return }
      if (search) { clearSearch(); return }
      if (selectedCat) { setSelectedCat(null); return }
    }

    if (isInput || aiOpen || shortcutsOpen) return

    if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); return }
    if (e.key.toLowerCase() === 'a') { setAiOpen(true); return }
    if (e.key.toLowerCase() === 'b') { router.back(); return }

    if (/^[0-9]$/.test(e.key)) {
      const idx = e.key === '0' ? 0 : parseInt(e.key) - 1
      if (idx === 0) { setSelectedCat(null); return }
      const cat = catsWithParts[idx - 1]
      if (cat) setSelectedCat(cat.id)
      return
    }

    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIdx(i => i === null ? 0 : Math.min(i + 1, allVisible.length - 1)); return }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocusedIdx(i => i === null ? 0 : Math.max(i - 1, 0)); return }
    if ((e.key.toLowerCase() === 'c' || e.key === 'Enter') && focusedIdx !== null) {
      const part = allVisible[focusedIdx]; if (part) copyRow(part)
    }
  }, [aiOpen, shortcutsOpen, search, selectedCat, focusedIdx, allVisible, catsWithParts, router, pathname])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboard)
    return () => document.removeEventListener('keydown', handleKeyboard)
  }, [handleKeyboard])

  const matchingIds = useMemo(() => new Set(matching.map(p => p.id)), [matching])

  return (
    <div className="min-h-screen bg-paper">

      {/* ── Vehicle banner — full width, breathing ── */}
      <div className="bg-paper-deep border-b border-paper-edge">
        <div className="px-12 py-10" style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* Top row: back + ask */}
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => router.back()}
              className="font-mono text-2xs text-ink-mute hover:text-vermillion transition-colors uppercase tracking-widest">
              ← Back to Decode
            </button>
            <button onClick={() => setAiOpen(true)}
              className="font-mono text-2xs uppercase tracking-widest px-5 py-2 border transition-colors"
              style={{ borderColor: 'var(--vermillion)', color: 'var(--vermillion)' }}
              onMouseEnter={e => { const t = e.currentTarget; t.style.background = 'var(--vermillion)'; t.style.color = 'white' }}
              onMouseLeave={e => { const t = e.currentTarget; t.style.background = 'transparent'; t.style.color = 'var(--vermillion)' }}>
              询问 · ASK
            </button>
          </div>

          {/* Brand + model */}
          <div className="flex items-end justify-between gap-8">
            <div>
              <div className="font-mono text-xs text-ink-mute uppercase tracking-widest mb-2">
                {vehicle.brand.name}
                {vehicle.brand.nameZh && <span className="font-cjk normal-case ml-3 text-ink-mute">{vehicle.brand.nameZh}</span>}
              </div>
              <h1 className="font-serif font-bold text-ink leading-none mb-6"
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', letterSpacing: '-0.03em' }}>
                {vehicle.model}
                {vehicle.modelZh && <span className="font-cjk text-ink-mute ml-4" style={{ fontSize: '0.5em', letterSpacing: 0 }}>{vehicle.modelZh}</span>}
              </h1>

              {/* Metadata row */}
              <div className="flex items-center">
                {([
                  { val: vehicle.year.toString() },
                  vehicle.engine ? { val: vehicle.engine } : null,
                  { val: vehicle.fuelType, cls: FUEL_CLASS[vehicle.fuelType] },
                  { val: `${vehicle.parts.length} parts indexed` },
                ] as Array<{ val: string; cls?: string } | null>)
                  .filter(Boolean)
                  .map((item, i, arr) => (
                    <div key={i} className="flex items-center">
                      {i > 0 && <div className="mx-4 h-4 w-px bg-paper-edge" />}
                      {item!.cls
                        ? <span className={`font-mono text-xs px-1.5 py-0.5 ${item!.cls}`}>{item!.val}</span>
                        : <span className="font-mono text-sm text-ink-soft">{item!.val}</span>}
                    </div>
                  ))}
              </div>
            </div>

            {/* Quiet verification seal */}
            <div className="flex flex-col items-center gap-1.5 shrink-0 opacity-60">
              <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: 'var(--vermillion)', color: 'var(--vermillion)' }}>
                <span className="font-cjk text-sm font-bold">验</span>
              </div>
              <div className="font-mono text-2xs text-ink-mute">已验证</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search + categories strip ── */}
      <div className="search-strip">
        <div className="px-12 pt-4 pb-0" style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* Search input */}
          <div className="vin-input-wrapper flex items-center mb-3">
            <span className="font-mono text-sm text-ink-mute pl-4 select-none">⌕</span>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setFocusedIdx(null) }}
              onKeyDown={e => { if (e.key === 'Escape') clearSearch() }}
              placeholder="Search by part name, OEM number, or 中文…"
              className="flex-1 px-4 py-3 text-sm bg-transparent text-ink placeholder-ink-mute focus:outline-none"
            />
            {search && (
              <button onClick={clearSearch}
                className="font-mono text-xs text-ink-mute hover:text-vermillion px-4 transition-colors">
                ✕
              </button>
            )}
          </div>

          {/* Category chips */}
          <div className="cat-chips">
            <button onClick={() => setSelectedCat(null)} className={`cat-chip ${!selectedCat ? 'active' : ''}`}>
              All · {vehicle.parts.length}
            </button>
            {catsWithParts.map((cat, i) => {
              const count = vehicle.parts.filter(p => p.category.id === cat.id).length
              return (
                <button key={cat.id} onClick={() => setSelectedCat(cat.id === selectedCat ? null : cat.id)}
                  className={`cat-chip ${selectedCat === cat.id ? 'active' : ''}`}>
                  <span className="mr-1 font-mono text-2xs text-ink-mute opacity-50">{i + 2}</span>
                  {cat.name} · {count}
                </button>
              )
            })}
            <button onClick={() => setShortcutsOpen(true)}
              className="ml-auto font-mono text-2xs text-ink-mute hover:text-vermillion transition-colors px-3 py-1.5 shrink-0">
              ? shortcuts
            </button>
          </div>
        </div>
      </div>

      {/* ── Parts table ── */}
      <div className="px-12 py-8" style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Table header */}
        <div className="grid pb-2 border-b-2 border-paper-edge"
          style={{ gridTemplateColumns: '2fr 1.2fr 0.8fr auto' }}>
          <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest">Part Name</span>
          <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest">OEM Number</span>
          <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest">Category</span>
          <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest text-right">Action</span>
        </div>

        <AnimatePresence mode="popLayout">
          {/* ── Matching section ── */}
          {search && matching.length > 0 && (
            <motion.div key="matching-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center gap-3 pt-5 pb-3">
                <span className="font-mono text-2xs uppercase tracking-widest" style={{ color: 'var(--vermillion)' }}>
                  配件搜索 · MATCHING &ldquo;{search.toUpperCase()}&rdquo;
                </span>
                <span className="font-mono text-2xs text-ink-mute">· {matching.length} part{matching.length !== 1 ? 's' : ''} found</span>
              </div>
            </motion.div>
          )}

          {matching.map((part, i) => {
            const globalIdx = i
            return (
              <PartRow key={part.id}
                part={part}
                isFocused={focusedIdx === globalIdx}
                isHighlighted={!!search && matchingIds.has(part.id)}
                copiedId={copiedId}
                onFocus={() => setFocusedIdx(globalIdx)}
                onCopy={() => copyRow(part)}
                rowRef={el => { if (el) rowRefs.current.set(part.id, el); else rowRefs.current.delete(part.id) }}
              />
            )
          })}

          {/* ── Rest section (only when search active) ── */}
          {search && rest.length > 0 && (
            <motion.div key="rest-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="border-t-2 border-paper-edge mt-4 pt-5 pb-3 flex items-center gap-3">
                <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest">
                  其他配件 · ALL OTHER PARTS
                </span>
                <span className="font-mono text-2xs text-ink-mute">· {rest.length}</span>
              </div>
            </motion.div>
          )}

          {rest.map((part, i) => {
            const globalIdx = matching.length + i
            return (
              <PartRow key={part.id}
                part={part}
                isFocused={focusedIdx === globalIdx}
                isHighlighted={false}
                copiedId={copiedId}
                onFocus={() => setFocusedIdx(globalIdx)}
                onCopy={() => copyRow(part)}
                rowRef={el => { if (el) rowRefs.current.set(part.id, el); else rowRefs.current.delete(part.id) }}
              />
            )
          })}
        </AnimatePresence>

        {/* No results */}
        {matching.length === 0 && rest.length === 0 && (
          <div className="flex flex-col items-center py-24 text-center">
            <p className="text-ink-soft text-sm mb-5">
              No parts matching <span className="font-mono text-ink">&ldquo;{search}&rdquo;</span> found for {vehicle.brand.name} {vehicle.model} {vehicle.year}.
            </p>
            <div className="flex items-center gap-6">
              <button onClick={() => setAiOpen(true)}
                className="btn-vermillion text-xs" style={{ padding: '8px 16px' }}>
                Describe with Ask · 询问 →
              </button>
              <button onClick={() => { setSearch(''); setSelectedCat(null) }}
                className="font-mono text-sm text-ink-soft hover:text-ink underline underline-offset-2 transition-colors">
                Browse all {vehicle.parts.length} parts →
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {aiOpen && <AiModal vehicle={vehicle} onClose={() => setAiOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {shortcutsOpen && <ShortcutsOverlay onClose={() => setShortcutsOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}
