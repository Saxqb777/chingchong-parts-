'use client'
import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface Message { role: 'user' | 'assistant'; content: string; id: string }

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

export default function ChatClient() {
  const params = useSearchParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const [loadingText, setLoadingText] = useState(LOADING_STATES[0])
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const part = params.get('part')
    const vehicle = params.get('vehicle')
    if (part) setInput(`Tell me about OEM part ${part}`)
    else if (vehicle) setInput('Most common failing parts for this vehicle?')
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
          <button onClick={() => { setMessages([]); setStreamContent('') }}
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

      {/* ── Main intercom area ── */}
      <div className="flex flex-col" style={{ maxHeight: 'calc(100vh - 52px)' }}>

        {/* Empty state */}
        {messages.length === 0 && !loading && (
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

        {/* ── Workshop intercom input ── */}
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

        // Bold heading (standalone **)
        if (/^\*\*[^*]+\*\*$/.test(line.trim()))
          return <div key={i} className="font-serif text-base font-bold text-ink">{line.trim().slice(2,-2)}</div>

        // Bullet
        if (line.startsWith('- ') || line.startsWith('• '))
          return (
            <div key={i} className="flex items-start gap-3 text-ink-soft">
              <span className="text-vermillion font-mono mt-0.5 shrink-0 text-xs">▸</span>
              <span>{parseParts(line.replace(/^[-•]\s/, ''))}</span>
            </div>
          )

        // Label rows (OEM: / Alt: / Position:)
        const colonMatch = line.match(/^(OEM|Alt|Alt\.|Position|Fitment|Note|Vehicle|Part|Material):\s*(.+)/i)
        if (colonMatch)
          return (
            <div key={i} className="flex items-baseline gap-4">
              <span className="font-mono text-2xs text-ink-mute uppercase tracking-widest w-16 shrink-0">{colonMatch[1]}</span>
              <span className="text-ink font-medium">{parseParts(colonMatch[2])}</span>
            </div>
          )

        // Warning
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
