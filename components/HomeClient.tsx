'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

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
const VIN_RE = /^[A-HJ-NPR-Z0-9]{11,17}$/

const LOADING_STATES = ['配件库 조회중...', 'Scanning catalog...', 'Cross-referencing OEM...', 'Getting your parts ready...']

function loadRecentVins(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    return (raw as string[]).filter(v => VIN_RE.test(v))
  } catch { return [] }
}
function saveRecentVin(vin: string) {
  if (!VIN_RE.test(vin)) return
  const prev = loadRecentVins().filter(v => v !== vin)
  localStorage.setItem(RECENT_KEY, JSON.stringify([vin, ...prev].slice(0, 5)))
}

/* ── Inline AI chat panel ── */
interface Message { role: 'user' | 'assistant'; content: string; id: string }

function AiPanel() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const [loadingText, setLoadingText] = useState(LOADING_STATES[0])
  const bottomRef = useRef<HTMLDivElement>(null)
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamContent])

  useEffect(() => {
    if (loading) {
      let i = 0
      timerRef.current = setInterval(() => { i = (i + 1) % LOADING_STATES.length; setLoadingText(LOADING_STATES[i]) }, 850)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [loading])

  async function send(text?: string) {
    const content = (text || input).trim()
    if (!content || loading) return
    setInput('')
    const userMsg: Message = { role: 'user', content, id: Date.now().toString() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true); setStreamContent('')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
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
            try { const t = JSON.parse(line.slice(6)).delta?.text || ''; full += t; setStreamContent(full) } catch { /* skip */ }
          }
        }
      }
      setMessages(prev => [...prev, { role: 'assistant', content: full, id: (Date.now() + 1).toString() }])
      setStreamContent('')
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Try again.', id: (Date.now() + 1).toString() }])
    } finally { setLoading(false) }
  }

  const QUICK = ['Brake pads BYD Han EV 2022', 'Oil filter Haval H6 2021', 'Headlight MG ZS 2020']

  return (
    <div className="flex flex-col h-full">
      <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-4">配件助手 · AI Search</div>

      {/* Quick prompts */}
      {messages.length === 0 && !loading && (
        <div className="mb-4 space-y-1">
          {QUICK.map(q => (
            <button key={q} onClick={() => send(q)}
              className="w-full text-left text-xs text-ink-soft hover:text-vermillion transition-colors py-1.5 border-b border-paper-edge last:border-0">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4" style={{ maxHeight: 320 }}>
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
              {msg.role === 'user'
                ? <p className="text-xs text-ink-mute">{msg.content}</p>
                : <div className="border-l-2 border-vermillion pl-3">
                    <div className="font-mono text-2xs text-vermillion uppercase tracking-widest mb-1">配件助手</div>
                    <p className="text-xs text-ink-soft leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
              }
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="border-l-2 border-vermillion pl-3">
              <motion.div key={loadingText} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="font-mono text-2xs text-vermillion uppercase tracking-widest mb-1">{loadingText}</motion.div>
              {streamContent
                ? <p className="text-xs text-ink-soft leading-relaxed whitespace-pre-wrap">{streamContent}<span className="inline-block w-0.5 h-3 bg-vermillion ml-0.5 align-middle" /></p>
                : <div className="flex gap-1 py-1">{[0,1,2].map(i => (
                    <motion.div key={i} className="w-1 h-1 rounded-full bg-paper-edge"
                      animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} />
                  ))}</div>
              }
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-paper-edge pt-3 mt-auto">
        <div className="flex gap-2">
          <input
            type="text" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send() }}
            placeholder="Describe any part or vehicle…"
            disabled={loading}
            className="flex-1 bg-paper border border-paper-edge px-3 py-2 text-xs text-ink placeholder-ink-mute focus:outline-none focus:border-ink-soft disabled:opacity-50"
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className="btn-vermillion shrink-0 disabled:opacity-25 text-xs" style={{ padding: '6px 14px' }}>
            →
          </button>
        </div>
        {messages.length > 0 && (
          <button onClick={() => { setMessages([]); setStreamContent('') }}
            className="font-mono text-2xs text-ink-mute hover:text-vermillion transition-colors mt-2 underline underline-offset-2">
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

export default function HomeClient({ brands, recentVehicles, partCount }: Props) {
  const [chassisValue, setChassisValue] = useState('')
  const [partValue, setPartValue] = useState('')
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [recentVins, setRecentVins] = useState<string[]>([])
  const chassisRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    chassisRef.current?.focus()
    setRecentVins(loadRecentVins())
  }, [])

  useEffect(() => {
    const id = setInterval(() => setPlaceholderIdx(i => (i + 1) % PART_PLACEHOLDERS.length), 3000)
    return () => clearInterval(id)
  }, [])

  function submit(e?: React.FormEvent) {
    e?.preventDefault()
    const v = chassisValue.trim()
    const q = partValue.trim()
    if (!v || v.length < 5) return
    if (VIN_RE.test(v)) {
      saveRecentVin(v)
      setRecentVins(loadRecentVins())
    }
    router.push(`/decode?vin=${encodeURIComponent(v)}${q ? `&q=${encodeURIComponent(q)}` : ''}`)
  }

  const hasBoth = chassisValue.trim().length >= 5 && partValue.trim().length > 0

  return (
    <div className="min-h-screen bg-paper">
      <section className="grid border-b border-paper-edge" style={{ gridTemplateColumns: '1fr 380px', minHeight: '80vh' }}>

        {/* Left — VIN form */}
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

            <form onSubmit={submit}>
              <div className="mb-3">
                <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-1.5">Chassis Number</div>
                <div className="vin-input-wrapper">
                  <input
                    ref={chassisRef}
                    type="text"
                    value={chassisValue}
                    onChange={e => setChassisValue(e.target.value.toUpperCase())}
                    placeholder="LGXCE4GB2M1234567"
                    maxLength={17}
                    autoComplete="off"
                    className="w-full px-4 py-3.5 font-mono text-sm bg-transparent text-ink placeholder-ink-mute focus:outline-none tracking-widest"
                  />
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest">Part You Need</div>
                  <span className="font-mono text-2xs text-ink-mute" style={{ opacity: 0.6 }}>(optional)</span>
                </div>
                <div className="vin-input-wrapper">
                  <input
                    type="text"
                    value={partValue}
                    onChange={e => setPartValue(e.target.value)}
                    placeholder={`e.g. ${PART_PLACEHOLDERS[placeholderIdx]}`}
                    className="w-full px-4 py-3.5 text-sm bg-transparent text-ink placeholder-ink-mute focus:outline-none"
                  />
                </div>
              </div>

              <button type="submit" className="btn-vermillion w-full justify-center">
                {hasBoth ? 'DECODE & FIND PART →' : 'DECODE CHASSIS →'}
              </button>
            </form>

            <div className="flex items-center gap-4 mt-5">
              <span className="font-mono text-2xs text-ink-mute">Try:</span>
              {['LGXCE4GB2M1234567', 'LSJ24U11000012345'].map(ex => (
                <button key={ex} type="button"
                  onClick={() => setChassisValue(ex)}
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
                    <button key={v} type="button"
                      onClick={() => setChassisValue(v)}
                      className="font-mono text-2xs text-ink-soft bg-paper-deep border border-paper-edge px-2.5 py-1 hover:border-vermillion hover:text-vermillion transition-colors">
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right — AI chat panel */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.35 }}
          className="px-8 py-16 bg-paper-deep flex flex-col">
          <AiPanel />
        </motion.div>
      </section>

      {/* ── Vehicle index below fold ── */}
      {recentVehicles.length > 0 && (
        <section className="px-12 py-10">
          <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-6">Recent Vehicles</div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Vehicle', 'Year', 'Engine', 'Fuel', 'Parts'].map((h, i) => (
                  <th key={h} className={`font-mono text-2xs text-ink-mute uppercase tracking-widest py-2 border-b border-paper-edge font-normal ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentVehicles.map((v, i) => (
                <motion.tr key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  onClick={() => router.push(`/parts/${v.id}`)} className="catalog-row border-b border-paper-edge">
                  <td className="py-3 pr-6"><span className="text-sm font-medium text-ink">{v.brand.name} {v.model}</span></td>
                  <td className="py-3 pr-6 font-mono text-xs text-ink-mute">{v.year}</td>
                  <td className="py-3 pr-6 font-mono text-xs text-ink-mute">{v.engine || '—'}</td>
                  <td className="py-3 pr-6">
                    <span className={`font-mono text-2xs px-1.5 py-0.5 ${FUEL_CLASS[v.fuelType] || 'fuel-petrol'}`}>{v.fuelType}</span>
                  </td>
                  <td className="py-3 text-right font-mono text-xs text-ink-mute row-arrow">{v._count.parts} →</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
