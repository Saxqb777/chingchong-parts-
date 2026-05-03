'use client'
import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface Message { role: 'user' | 'assistant'; content: string; id: string }
interface Brand { id: string; name: string; nameZh: string }
interface VehicleStub { id: string; model: string; year: number; brandId: string; brand: { id: string; name: string } }

const LOADING_STATES = [
  '配件库 조회중...', 'Scanning catalog...', 'Cross-referencing OEM...', 'Getting your parts ready...',
]

const QUICK = [
  'Front brake pads BYD Han EV 2022',
  'Timing chain Geely Coolray 1.5T',
  'Decode LGXCE4GB2M1234567',
  'Shock absorbers Haval H6 2021',
  'Alternator Chery Tiggo 8 1.6T',
  'Oil filter MG ZS 1.5L',
]

/* ── No-VIN Wizard ── */
function NoVinWizard({ brands, vehicles, onSkip }: {
  brands: Brand[]
  vehicles: VehicleStub[]
  onSkip: () => void
}) {
  const router = useRouter()
  const [step, setStep] = useState<'brand' | 'model' | 'year' | 'part'>('brand')
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [partInput, setPartInput] = useState('')

  const models = selectedBrand
    ? [...new Set(vehicles.filter(v => v.brandId === selectedBrand.id).map(v => v.model))].sort()
    : []

  const years = (selectedBrand && selectedModel)
    ? [...new Set(vehicles.filter(v => v.brandId === selectedBrand.id && v.model === selectedModel).map(v => v.year))].sort((a, b) => b - a)
    : []

  function pickBrand(b: Brand) { setSelectedBrand(b); setStep('model') }
  function pickModel(m: string) { setSelectedModel(m); setStep('year') }
  function pickYear(y: number) { setSelectedYear(y); setStep('part') }

  function findPart() {
    const q = partInput.trim()
    if (!q) return
    const vehicle = vehicles.find(v =>
      v.brandId === selectedBrand!.id &&
      v.model === selectedModel &&
      v.year === selectedYear
    )
    if (vehicle) {
      router.push(`/parts/${vehicle.id}?q=${encodeURIComponent(q)}`)
    } else {
      // Fallback: send to AI chat with context
      router.push(`/chat?ai=1&q=${encodeURIComponent(`${selectedBrand!.name} ${selectedModel} ${selectedYear}: ${q}`)}`)
    }
  }

  const STEP_LABELS = { brand: 'Brand', model: 'Model', year: 'Year', part: 'Part' }
  const breadcrumb = [
    selectedBrand?.name,
    selectedModel,
    selectedYear?.toString(),
  ].filter(Boolean).join(' › ')

  return (
    <div className="flex-1 flex flex-col items-start justify-center px-12 pb-10 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-px w-6 bg-paper-edge" />
        <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest">没有车架号 · No VIN</span>
      </div>

      <h2 className="font-serif text-3xl font-bold text-ink mb-2" style={{ letterSpacing: '-0.02em' }}>
        Find a part without a VIN.
      </h2>
      <p className="text-ink-soft text-sm mb-8 leading-relaxed">
        Select the brand, model, and year — then describe the part you need.
      </p>

      {/* Progress breadcrumb */}
      {breadcrumb && (
        <div className="font-mono text-xs text-vermillion mb-6 flex items-center gap-2">
          <span>{breadcrumb}</span>
          <button onClick={() => { setStep('brand'); setSelectedBrand(null); setSelectedModel(null); setSelectedYear(null) }}
            className="text-ink-mute hover:text-vermillion underline underline-offset-2 text-2xs">reset</button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 'brand' && (
          <motion.div key="brand" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-3">1 · Select brand</div>
            <div className="flex flex-wrap gap-2">
              {brands.map(b => (
                <button key={b.id} onClick={() => pickBrand(b)}
                  className="flex items-center gap-2 px-3 py-2 bg-paper-deep border border-paper-edge hover:border-vermillion hover:text-vermillion text-sm text-ink-soft transition-colors">
                  {b.name}
                  <span className="font-cjk text-xs text-ink-mute">{b.nameZh}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'model' && (
          <motion.div key="model" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-3">2 · Select model</div>
            {models.length === 0 ? (
              <p className="text-sm text-ink-mute">No models in catalog for {selectedBrand?.name}.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {models.map(m => (
                  <button key={m} onClick={() => pickModel(m)}
                    className="px-3 py-2 bg-paper-deep border border-paper-edge hover:border-vermillion hover:text-vermillion text-sm text-ink-soft transition-colors">
                    {m}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setStep('brand')} className="mt-4 font-mono text-2xs text-ink-mute hover:text-vermillion underline underline-offset-2 transition-colors">
              ← Back
            </button>
          </motion.div>
        )}

        {step === 'year' && (
          <motion.div key="year" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-3">3 · Select year</div>
            <div className="flex flex-wrap gap-2">
              {years.map(y => (
                <button key={y} onClick={() => pickYear(y)}
                  className="px-4 py-2 bg-paper-deep border border-paper-edge hover:border-vermillion hover:text-vermillion font-mono text-sm text-ink-soft transition-colors">
                  {y}
                </button>
              ))}
            </div>
            <button onClick={() => setStep('model')} className="mt-4 font-mono text-2xs text-ink-mute hover:text-vermillion underline underline-offset-2 transition-colors">
              ← Back
            </button>
          </motion.div>
        )}

        {step === 'part' && (
          <motion.div key="part" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            className="w-full">
            <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-3">4 · Describe the part</div>
            <div className="vin-input-wrapper mb-3">
              <input
                autoFocus
                type="text"
                value={partInput}
                onChange={e => setPartInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') findPart() }}
                placeholder="e.g. front brake pad, oil filter, headlight…"
                className="w-full px-4 py-3.5 text-sm bg-transparent text-ink placeholder-ink-mute focus:outline-none"
              />
            </div>
            <button onClick={findPart} disabled={!partInput.trim()}
              className="btn-vermillion disabled:opacity-30">
              Find Part →
            </button>
            <button onClick={() => setStep('year')} className="ml-4 font-mono text-2xs text-ink-mute hover:text-vermillion underline underline-offset-2 transition-colors">
              ← Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-10 pt-6 border-t border-paper-edge w-full">
        <button onClick={onSkip} className="font-mono text-2xs text-ink-mute hover:text-vermillion transition-colors underline underline-offset-2">
          Skip — describe in plain language instead →
        </button>
      </div>
    </div>
  )
}

/* ── Main ── */
export default function ChatClient({ brands = [], vehicles = [] }: {
  brands?: Brand[]
  vehicles?: VehicleStub[]
}) {
  const params = useSearchParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const [loadingText, setLoadingText] = useState(LOADING_STATES[0])
  // Show wizard only if we have catalog data; skip if arriving via ?ai=1 or ?part= etc
  const [showWizard, setShowWizard] = useState(
    brands.length > 0 && !params.get('ai') && !params.get('part') && !params.get('vehicle')
  )
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const part = params.get('part')
    const vehicle = params.get('vehicle')
    const aiQ = params.get('q')
    if (part) setInput(`Tell me about OEM part ${part}`)
    else if (vehicle) setInput('Most common failing parts for this vehicle?')
    else if (aiQ) { setShowWizard(false); send(aiQ) }
  }, [])

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
    setShowWizard(false)
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
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Check your API key and try again.', id: (Date.now() + 1).toString() }])
    } finally { setLoading(false) }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="min-h-screen bg-paper" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gridTemplateRows: '1fr' }}>

      {/* ── Left sidebar ── */}
      <aside className="border-r border-paper-edge bg-paper-deep flex flex-col px-6 py-8">
        <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-6">配件助手</div>
        <p className="text-xs text-ink-mute leading-relaxed mb-8">
          Describe any part or paste a chassis number. Get the OEM number immediately.
        </p>

        {messages.length > 0 && (
          <button onClick={() => { setMessages([]); setStreamContent(''); setShowWizard(brands.length > 0) }}
            className="font-mono text-2xs text-ink-mute hover:text-vermillion transition-colors underline underline-offset-2 mb-8">
            Clear session
          </button>
        )}

        <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest mb-3">Quick search</div>
        <div className="space-y-1">
          {QUICK.map(q => (
            <button key={q} onClick={() => send(q)}
              className="w-full text-left text-xs text-ink-soft hover:text-vermillion transition-colors py-1.5 border-b border-paper-edge last:border-0">
              {q}
            </button>
          ))}
        </div>

        <div className="mt-auto pt-6 border-t border-paper-edge">
          <div className="font-mono text-2xs text-ink-mute">SinoAssist · 配件助手</div>
          <div className="font-mono text-2xs text-ink-mute mt-1">Powered by Claude</div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-col" style={{ maxHeight: 'calc(100vh - 52px)' }}>

        {/* No-VIN Wizard (replaces empty state when catalog data available) */}
        {showWizard && messages.length === 0 && !loading && (
          <div className="flex-1 overflow-y-auto">
            <NoVinWizard
              brands={brands}
              vehicles={vehicles}
              onSkip={() => setShowWizard(false)}
            />
          </div>
        )}

        {/* Plain empty state (no catalog data or wizard skipped) */}
        {!showWizard && messages.length === 0 && !loading && (
          <div className="flex-1 flex flex-col items-start justify-center px-12 pb-10">
            <div className="seal w-10 h-10 text-base mb-6" style={{ fontSize: 18 }}>配</div>
            <h2 className="font-serif text-3xl font-bold text-ink mb-3" style={{ letterSpacing: '-0.02em' }}>
              What part do you need?
            </h2>
            <p className="text-ink-soft text-sm max-w-sm leading-relaxed">
              Type the vehicle and part in plain language. The assistant will return
              the OEM number, alternative numbers, and position.
            </p>
          </div>
        )}

        {/* Message thread */}
        {(messages.length > 0 || loading) && (
          <div className="flex-1 overflow-y-auto px-12 py-8 space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}>
                  {msg.role === 'user' ? (
                    <div className="flex items-start gap-3 mb-1">
                      <div className="font-mono text-2xs text-ink-mute mt-1 w-12 shrink-0 uppercase tracking-widest">You</div>
                      <p className="text-sm text-ink-soft">{msg.content}</p>
                    </div>
                  ) : (
                    <div className="border-l-2 border-vermillion pl-5 py-1">
                      <div className="font-mono text-2xs text-vermillion uppercase tracking-widest mb-3">配件助手</div>
                      <ResponseContent content={msg.content} />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Streaming */}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="font-mono text-2xs text-ink-mute mt-1 w-12 shrink-0 uppercase tracking-widest">You</div>
                  <p className="text-sm text-ink-soft">{messages[messages.length - 1]?.content}</p>
                </div>
                <div className="border-l-2 border-vermillion pl-5 py-1">
                  <motion.div key={loadingText} initial={{ opacity: 0, x: -3 }} animate={{ opacity: 1, x: 0 }}
                    className="font-mono text-2xs text-vermillion uppercase tracking-widest mb-3">{loadingText}</motion.div>
                  {streamContent
                    ? <><ResponseContent content={streamContent} /><span className="inline-block w-0.5 h-4 bg-vermillion ml-0.5 align-middle cursor-blink" /></>
                    : <div className="flex gap-1.5 py-1">
                        {[0,1,2].map(i => (
                          <motion.div key={i} className="w-1 h-1 rounded-full bg-paper-edge"
                            animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} />
                        ))}
                      </div>
                  }
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* ── Input bar ── */}
        <div className="border-t border-paper-edge bg-paper-deep px-12 py-5">
          <div className={`intercom-input flex items-end gap-4 bg-white border border-paper-edge p-3 ${input ? 'border-left-vermillion' : ''}`}>
            <div className="font-mono text-2xs text-ink-mute uppercase tracking-widest shrink-0 pb-2">→</div>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                const t = e.target; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px'
              }}
              onKeyDown={handleKey}
              placeholder="e.g.  front shock absorber BYD Han EV 2022  ·  or paste a VIN"
              rows={1}
              disabled={loading}
              className="flex-1 bg-transparent resize-none font-mono text-sm text-ink placeholder-ink-mute focus:outline-none max-h-32 disabled:opacity-50"
            />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              className="btn-vermillion shrink-0 disabled:opacity-25" style={{ padding: '6px 16px' }}>
              Send
            </button>
          </div>
          <div className="font-mono text-2xs text-ink-mute mt-2">
            ↵ send · shift+↵ new line
          </div>
        </div>
      </div>
    </div>
  )
}

function ResponseContent({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />

        if (/^\*\*[^*]+\*\*$/.test(line.trim()))
          return <div key={i} className="font-serif text-base font-bold text-ink">{line.trim().slice(2,-2)}</div>

        if (line.startsWith('- ') || line.startsWith('• '))
          return (
            <div key={i} className="flex items-start gap-3 text-ink-soft">
              <span className="text-vermillion font-mono mt-0.5 shrink-0 text-xs">▸</span>
              <span>{parseParts(line.replace(/^[-•]\s/, ''))}</span>
            </div>
          )

        const colonMatch = line.match(/^(OEM|Alt|Alt\.|Position|Fitment|Note|Vehicle|Part|Material):\s*(.+)/i)
        if (colonMatch)
          return (
            <div key={i} className="flex items-baseline gap-4">
              <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest w-16 shrink-0">{colonMatch[1]}</span>
              <span className="text-ink font-medium">{parseParts(colonMatch[2])}</span>
            </div>
          )

        if (line.startsWith('⚠️'))
          return <div key={i} className="text-xs text-warn border-l-2 pl-3 py-1" style={{ borderColor: 'var(--warn)' }}>{parseParts(line)}</div>

        return <p key={i} className="text-ink-soft">{parseParts(line)}</p>
      })}
    </div>
  )
}

function parseParts(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**'))
          return <strong key={i} className="text-ink font-semibold">{p.slice(2,-2)}</strong>
        if (p.startsWith('`') && p.endsWith('`'))
          return <code key={i} className="oem-chip vermillion">{p.slice(1,-1)}</code>
        return <span key={i}>{p}</span>
      })}
    </>
  )
}
