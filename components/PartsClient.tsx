'use client'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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

// Bug 6 fix: synonym map for accurate search
const SYNONYMS: Record<string, string[]> = {
  headlight:    ['headlight', 'head lamp', 'headlamp', '前大灯', '前照灯', 'head light'],
  tail:         ['tail light', 'tail lamp', 'taillight', '尾灯', 'rear light'],
  fog:          ['fog light', 'fog lamp', '雾灯'],
  engine:       ['engine', '发动机'],
  brake:        ['brake', 'brakes', '刹车', '制动'],
  oil:          ['oil filter', 'oil pump', '机油'],
  'air filter': ['air filter', 'air cleaner', '空气滤'],
  'fuel filter':['fuel filter', 'diesel filter', '燃油滤', '柴油滤'],
  shock:        ['shock', 'absorber', 'strut', '减振器', 'damper'],
  bearing:      ['bearing', '轴承', 'hub'],
  battery:      ['battery', '电池', '蓄电池'],
  alternator:   ['alternator', 'generator', '发电机'],
  radiator:     ['radiator', '散热器'],
  transmission: ['transmission', 'gearbox', 'gear box', '变速箱', '变速器'],
  steering:     ['steering', 'rack', '转向'],
  suspension:   ['suspension', 'spring', 'control arm', '悬挂', '弹簧'],
  exhaust:      ['exhaust', 'muffler', 'dpf', '排气'],
  fuel:         ['fuel injector', 'fuel pump', 'injector', '喷油', '燃油泵'],
  timing:       ['timing chain', 'timing belt', '正时'],
  coolant:      ['coolant', 'water pump', 'thermostat', '冷却', '水泵', '节温器'],
  clutch:       ['clutch', '离合器'],
  mirror:       ['mirror', '后视镜', '反光镜'],
  bumper:       ['bumper', '保险杠'],
  wiper:        ['wiper', 'blade', '雨刮', '刮水'],
  spark:        ['spark plug', 'ignition', '火花塞'],
  turbo:        ['turbo', 'turbocharger', '涡轮'],
}

function expandQuery(q: string): string[] {
  const lower = q.toLowerCase()
  for (const [, terms] of Object.entries(SYNONYMS)) {
    if (terms.some(t => t.includes(lower) || lower.includes(t.split(' ')[0]))) {
      return terms
    }
  }
  return [lower]
}

// Bug 6 fix: smarter search — category match first, no description search for generic terms
function matchesPart(part: Part, rawQuery: string): boolean {
  if (!rawQuery) return true
  const q = rawQuery.toLowerCase()
  const terms = expandQuery(q)

  // Category exact match
  const catMatch = terms.some(t => part.category.name.toLowerCase().includes(t) || part.category.nameZh.includes(t))
  if (catMatch) return true

  // Part name match
  const nameMatch = terms.some(t =>
    part.name.toLowerCase().includes(t) ||
    (part.nameZh || '').includes(t) ||
    part.oemNumber.toLowerCase().includes(t)
  )
  return nameMatch
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

/* ── AI Modal — Bug 7 fix: input at top, proper sidebar, full vermillion button ── */
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
    // Bug 7 fix: dark backdrop, proper overlay
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ background: 'rgba(28,24,21,0.7)' }}
    >
      <motion.div
        initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        exit={{ x: 60, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}
        className="modal-panel" onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-paper-edge shrink-0">
          <div>
            <div className="font-mono text-2xs text-vermillion uppercase tracking-widest mb-0.5">询问 · Ask AI</div>
            <div className="font-mono text-2xs text-ink-mute">{vehicle.brand.name} {vehicle.model} {vehicle.year}</div>
          </div>
          <button onClick={onClose} className="font-mono text-xs text-ink-mute hover:text-vermillion transition-colors px-2 py-1">
            Esc ✕
          </button>
        </div>

        {/* Bug 7 fix: input at TOP */}
        <div className="px-6 pt-5 pb-4 border-b border-paper-edge shrink-0 bg-paper-deep">
          <div className="flex gap-3">
            <input
              ref={inputRef} type="text" value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') ask() }}
              placeholder={`e.g. front headlight, brake pads, oil filter…`}
              disabled={loading}
              className="flex-1 bg-white border border-paper-edge px-3 py-2.5 text-sm font-mono text-ink placeholder-ink-mute focus:outline-none focus:border-ink-soft disabled:opacity-50"
            />
            {/* Bug 7 fix: full vermillion button */}
            <button onClick={ask} disabled={!input.trim() || loading}
              className="btn-vermillion shrink-0 disabled:opacity-30" style={{ padding: '8px 18px' }}>
              Ask →
            </button>
          </div>
        </div>

        {/* Response area */}
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

/* ── Bug 5 fix: Shortcuts overlay — properly centered ── */
function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  const groups = [
    { label: 'Global', items: [['?', 'Show this overlay'], ['Esc', 'Close modal / clear search'], ['g h', 'Go to homepage'], ['g c', 'Go to catalog'], ['g v', 'Go to VIN decode']] },
    { label: 'Result Page', items: [['/', 'Focus search'], ['↑ ↓', 'Navigate rows'], ['Enter / C', 'Copy focused row OEM'], ['A', 'Open Ask · 询问 modal'], ['B', 'Go back'], ['1–9', 'Jump to category'], ['0', 'Reset to All']] },
    { label: 'Ask Modal', items: [['Enter', 'Submit query'], ['Esc', 'Close modal']] },
  ]
  return (
    // Bug 5 fix: centered overlay with correct padding override
    <div
      className="modal-overlay"
      style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 0, background: 'rgba(28,24,21,0.7)' }}
      onClick={onClose}
    >
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

/* ── Main ── */
export default function PartsClient({ vehicle, categories, initialQuery = '' }: Props) {
  const router = useRouter()
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [search, setSearch] = useState(initialQuery)
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  // g-chord state
  const gPressed = useRef(false)
  const gTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const catsWithParts = useMemo(() => {
    const ids = new Set(vehicle.parts.map(p => p.category.id))
    return categories.filter(c => ids.has(c.id))
  }, [vehicle.parts, categories])

  // Bug 6 fix: use smarter matchesPart
  const filtered = useMemo(() =>
    vehicle.parts.filter(p => {
      if (selectedCat && p.category.id !== selectedCat) return false
      return matchesPart(p, search)
    }),
  [vehicle.parts, selectedCat, search])

  function copyRow(part: Part) {
    copyText(part.oemNumber)
    setCopiedId(part.id)
    const el = rowRefs.current.get(part.id)
    if (el) { el.classList.add('row-flash'); setTimeout(() => el.classList.remove('row-flash'), 1500) }
    setTimeout(() => setCopiedId(null), 1400)
  }

  // All categories including "All" as index 0
  const catList = useMemo(() => [null, ...catsWithParts.map(c => c.id)], [catsWithParts])

  const handleKeyboard = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA'

    // g-chord navigation
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

    // Bug 5 fix: ? shortcut — works regardless of input state when overlay is open
    if (e.key === '?' && !isInput) {
      e.preventDefault()
      setShortcutsOpen(s => !s)
      return
    }

    if (e.key === 'Escape') {
      if (aiOpen) { setAiOpen(false); return }
      if (shortcutsOpen) { setShortcutsOpen(false); return }
      if (isInput) { searchRef.current?.blur(); setSearch(''); setFocusedIdx(null); return }
      if (search) { setSearch(''); setFocusedIdx(null); return }
      if (selectedCat) { setSelectedCat(null); return }
    }

    if (isInput || aiOpen || shortcutsOpen) return

    if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); return }
    if (e.key.toLowerCase() === 'a') { setAiOpen(true); return }
    if (e.key.toLowerCase() === 'b') { router.back(); return }

    // Number keys for category
    if (/^[0-9]$/.test(e.key)) {
      const idx = e.key === '0' ? 0 : parseInt(e.key) - 1
      if (idx === 0) { setSelectedCat(null); return }
      const cat = catsWithParts[idx - 1]
      if (cat) setSelectedCat(cat.id)
      return
    }

    // Row navigation
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIdx(i => i === null ? 0 : Math.min(i + 1, filtered.length - 1)); return }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocusedIdx(i => i === null ? 0 : Math.max(i - 1, 0)); return }

    // Copy focused row
    if ((e.key.toLowerCase() === 'c' || e.key === 'Enter') && focusedIdx !== null) {
      const part = filtered[focusedIdx]; if (part) copyRow(part)
    }
  }, [aiOpen, shortcutsOpen, search, selectedCat, focusedIdx, filtered, catsWithParts, router])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboard)
    return () => document.removeEventListener('keydown', handleKeyboard)
  }, [handleKeyboard])

  return (
    <div className="min-h-screen bg-paper">

      {/* ── Vehicle banner ── */}
      <div className="border-b border-paper-edge bg-paper-deep px-12 py-6">
        <button onClick={() => router.back()} className="font-mono text-2xs text-ink-mute hover:text-vermillion transition-colors mb-5 block">
          ← Back
        </button>
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-1.5">
              {vehicle.brand.name}
              {vehicle.brand.nameZh && <span className="font-cjk normal-case ml-2">{vehicle.brand.nameZh}</span>}
            </div>
            <h1 className="font-serif text-4xl font-bold text-ink mb-1" style={{ letterSpacing: '-0.02em' }}>
              {vehicle.model}
              {vehicle.modelZh && <span className="font-cjk text-2xl text-ink-mute ml-3">{vehicle.modelZh}</span>}
            </h1>
            <div className="flex items-center mt-4">
              {([
                { label: 'Year',   val: vehicle.year.toString() },
                vehicle.engine ? { label: 'Engine', val: vehicle.engine } : null,
                { label: 'Fuel',   val: vehicle.fuelType, cls: FUEL_CLASS[vehicle.fuelType] },
                { label: 'Parts',  val: vehicle.parts.length.toString() },
              ] as Array<{ label: string; val: string; cls?: string } | null>)
                .filter(Boolean)
                .map((item, i, arr) => (
                  <div key={i} className="flex items-center">
                    <div className="px-4 first:pl-0">
                      <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-0.5">{item!.label}</div>
                      {item!.cls
                        ? <span className={`font-mono text-xs px-1.5 py-0.5 ${item!.cls}`}>{item!.val}</span>
                        : <span className="font-mono text-xs text-ink font-medium">{item!.val}</span>}
                    </div>
                    {i < arr.length - 1 && <div className="h-8 w-px bg-paper-edge" />}
                  </div>
                ))}
            </div>
          </div>

          {/* Bug 8 fix: 验 character for 已验证 */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: 'var(--vermillion)', color: 'var(--vermillion)' }}>
              <span className="font-cjk text-base font-bold">验</span>
            </div>
            <div className="font-mono text-2xs text-ink-mute">已验证 · VERIFIED</div>
          </div>
        </div>
      </div>

      {/* ── Sticky search strip ── */}
      <div className="search-strip px-12 py-3">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-2">配件搜索 · Parts Search</div>
            <div className="vin-input-wrapper flex items-center">
              <span className="font-mono text-sm text-ink-mute pl-3 select-none">⌕</span>
              <input
                ref={searchRef} type="text" value={search}
                onChange={e => { setSearch(e.target.value); setFocusedIdx(null) }}
                onKeyDown={e => { if (e.key === 'Escape') { setSearch(''); setFocusedIdx(null); e.currentTarget.blur() } }}
                placeholder="Search by part name, OEM number, or 中文"
                className="flex-1 px-3 py-2.5 text-sm bg-transparent text-ink placeholder-ink-mute focus:outline-none"
              />
              {search && (
                <button onClick={() => { setSearch(''); setFocusedIdx(null); searchRef.current?.focus() }}
                  className="font-mono text-xs text-ink-mute hover:text-vermillion px-3 transition-colors">✕</button>
              )}
            </div>
          </div>
          <button onClick={() => setAiOpen(true)}
            className="font-mono text-xs uppercase tracking-widest px-4 py-2.5 border transition-colors shrink-0"
            style={{ borderColor: 'var(--vermillion)', color: 'var(--vermillion)' }}
            onMouseEnter={e => { const t = e.currentTarget; t.style.background = 'var(--vermillion)'; t.style.color = 'white' }}
            onMouseLeave={e => { const t = e.currentTarget; t.style.background = 'transparent'; t.style.color = 'var(--vermillion)' }}>
            询问 · Ask
          </button>
        </div>

        {/* Category chips */}
        <div className="cat-chips mt-2">
          <button onClick={() => setSelectedCat(null)} className={`cat-chip ${!selectedCat ? 'active' : ''}`}>
            All · {vehicle.parts.length}
          </button>
          {catsWithParts.map(cat => {
            const count = vehicle.parts.filter(p => p.category.id === cat.id).length
            return (
              <button key={cat.id} onClick={() => setSelectedCat(cat.id === selectedCat ? null : cat.id)}
                className={`cat-chip ${selectedCat === cat.id ? 'active' : ''}`}>
                {cat.name} · {count}
              </button>
            )
          })}
        </div>

        <div className="font-mono text-2xs text-ink-mute mt-1.5">
          {search || selectedCat
            ? `Showing ${filtered.length} of ${vehicle.parts.length} parts${search ? ` matching "${search}"` : ''}`
            : `All ${vehicle.parts.length} parts · ${vehicle.brand.name} ${vehicle.model} ${vehicle.year}`}
          <button onClick={() => setShortcutsOpen(true)}
            className="ml-4 hover:text-vermillion transition-colors underline underline-offset-2">? shortcuts</button>
        </div>
      </div>

      {/* ── Parts table ── */}
      <div className="px-12 py-6">
        <div className="grid pb-2 border-b border-paper-edge" style={{ gridTemplateColumns: '1fr 180px 110px 110px' }}>
          <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest">Part Name</span>
          <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest">OEM Number</span>
          <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest">Category</span>
          <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest text-right">Action</span>
        </div>

        <AnimatePresence mode="popLayout">
          {filtered.map((part, i) => {
            const isFocused = focusedIdx === i
            return (
              <motion.div key={part.id} layout
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }} transition={{ delay: Math.min(i * 0.01, 0.2) }}
                ref={el => { if (el) rowRefs.current.set(part.id, el) }}
                tabIndex={0}
                onFocus={() => setFocusedIdx(i)}
                onClick={() => setFocusedIdx(i)}
                className={`part-row-tr grid items-center outline-none${isFocused ? ' bg-paper-deep' : ''}`}
                style={{
                  gridTemplateColumns: '1fr 180px 110px 110px',
                  borderLeft: isFocused ? '3px solid var(--vermillion)' : '3px solid transparent',
                }}
              >
                <div className="py-3 pr-4">
                  {part.nameZh
                    ? <><div className="hanzi-primary">{part.nameZh}</div><div className="hanzi-secondary">{part.name}</div></>
                    : <div className="text-sm font-medium text-ink">{part.name}</div>
                  }
                  <div className="font-mono text-2xs text-ink-mute mt-0.5">
                    {[part.position, vehicle.year.toString(), vehicle.fuelType].filter(Boolean).join(' · ')}
                  </div>
                </div>

                <div className="py-3 pr-4">
                  <span className={`oem-main${isFocused ? ' text-vermillion' : ''}`}>{part.oemNumber}</span>
                  {part.altNumbers && <div className="font-mono text-2xs text-gold mt-0.5">{part.altNumbers}</div>}
                </div>

                <div className="py-3 pr-4">
                  <span className="font-mono text-2xs text-ink-mute uppercase tracking-wide">{part.category.name}</span>
                </div>

                <div className="py-3 flex justify-end">
                  <button
                    onClick={e => { e.stopPropagation(); copyRow(part) }}
                    className={`copy-btn${copiedId === part.id ? ' copied' : ''}`}
                  >
                    {copiedId === part.id ? '已复制 ✓' : '复制 ⎘'}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Feature 4: proper no-results state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <p className="text-ink-soft text-sm">
              No parts matching <span className="font-mono text-ink">"{search}"</span> found for {vehicle.brand.name} {vehicle.model} {vehicle.year}.
            </p>
            <div className="flex items-center gap-6 mt-5">
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
