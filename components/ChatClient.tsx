'use client'
import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Search, ChevronRight, RotateCcw, Zap, Clock } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id: string
}

const QUICK_PROMPTS = [
  'Front brake pads BYD Han EV 2022',
  'Timing chain Geely Coolray 1.5T',
  'Decode VIN LGXCE4GB2M1234567',
  'Shock absorbers Haval H6 2021',
  'Oil filter MG ZS 1.5L',
  'Turbo Chery Tiggo 8 Pro 1.6T',
]

const LOADING_STATES = [
  'Scanning catalog...',
  'Cross-referencing OEM database...',
  'Getting your parts ready...',
  'Matching specifications...',
]

export default function ChatClient() {
  const params = useSearchParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const [loadingText, setLoadingText] = useState(LOADING_STATES[0])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const loadingInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const part = params.get('part')
    const vehicle = params.get('vehicle')
    if (part) setInput(`Tell me about OEM part ${part}`)
    else if (vehicle) setInput(`Most common failing parts for this vehicle?`)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamContent])

  useEffect(() => {
    if (loading) {
      let i = 0
      loadingInterval.current = setInterval(() => {
        i = (i + 1) % LOADING_STATES.length
        setLoadingText(LOADING_STATES[i])
      }, 900)
    } else {
      if (loadingInterval.current) clearInterval(loadingInterval.current)
      setLoadingText(LOADING_STATES[0])
    }
    return () => { if (loadingInterval.current) clearInterval(loadingInterval.current) }
  }, [loading])

  async function send(text?: string) {
    const content = (text || input).trim()
    if (!content || loading) return
    setInput('')
    const userMsg: Message = { role: 'user', content, id: Date.now().toString() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)
    setStreamContent('')

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
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              const t = parsed.delta?.text || parsed.text || ''
              full += t
              setStreamContent(full)
            } catch { /* skip */ }
          }
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: full, id: (Date.now() + 1).toString() }])
      setStreamContent('')
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Check your API key and try again.', id: (Date.now() + 1).toString() }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="min-h-screen bg-void pt-14 flex flex-col" style={{ background: 'radial-gradient(ellipse at 20% 0%, rgba(59,130,246,0.04) 0%, transparent 60%), #07070e' }}>
      <div className="max-w-3xl mx-auto w-full flex flex-col flex-1 px-5 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center">
                <Zap size={14} className="text-accent" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-jade border-2 border-void" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text-primary tracking-tight">SinoAssist</div>
              <div className="text-xs text-text-secondary">Chinese parts intelligence</div>
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={() => { setMessages([]); setStreamContent('') }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-text-secondary hover:text-text-primary hover:border-muted transition-all">
              <RotateCcw size={11} /> New search
            </button>
          )}
        </div>

        {/* Empty state */}
        {messages.length === 0 && !loading && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col justify-center pb-16">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-2 tracking-tight">What part do you need?</h2>
              <p className="text-text-secondary text-sm">Type the car and part — get the OEM number instantly.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PROMPTS.map((prompt, i) => (
                <motion.button key={prompt} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => send(prompt)}
                  className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border bg-surface/60 hover:border-accent/30 hover:bg-surface text-left transition-all">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Search size={11} className="text-text-secondary shrink-0" />
                    <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors truncate">{prompt}</span>
                  </div>
                  <ChevronRight size={11} className="text-text-secondary/40 group-hover:text-accent shrink-0 transition-colors" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Conversation */}
        {(messages.length > 0 || loading) && (
          <div className="flex-1 space-y-6 mb-6 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  {msg.role === 'user' ? (
                    /* ── User query: compact label style ── */
                    <div className="flex items-start gap-3 mb-1">
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock size={11} className="text-text-secondary/50" />
                      </div>
                      <p className="text-sm text-text-secondary font-medium">{msg.content}</p>
                    </div>
                  ) : (
                    /* ── AI result: full-width result card ── */
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="rounded-2xl border border-border/60 bg-surface overflow-hidden">
                      {/* Card top bar */}
                      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-panel/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-jade" />
                        <span className="text-xs text-text-secondary font-mono">result · {idx}</span>
                      </div>
                      <div className="px-5 py-4">
                        <MessageContent content={msg.content} />
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading state */}
            {loading && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                {/* Show the query that was asked */}
                {streamContent === '' && (
                  <div className="flex items-center gap-2 mb-4">
                    <Clock size={11} className="text-text-secondary/50" />
                    <p className="text-sm text-text-secondary font-medium">
                      {messages[messages.length - 1]?.content}
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-accent/20 bg-surface overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-accent/15 bg-accent/5">
                    <motion.div className="w-1.5 h-1.5 rounded-full bg-accent"
                      animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} />
                    <motion.span
                      key={loadingText}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-accent font-mono"
                    >
                      {loadingText}
                    </motion.span>
                  </div>

                  {streamContent ? (
                    <div className="px-5 py-4">
                      <MessageContent content={streamContent} />
                      <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.7 }}
                        className="inline-block w-0.5 h-4 bg-accent ml-0.5 align-middle" />
                    </div>
                  ) : (
                    <div className="px-5 py-5 flex items-center gap-3">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map(i => (
                          <motion.div key={i}
                            className="w-8 h-1 rounded-full bg-accent/30"
                            animate={{ opacity: [0.3, 1, 0.3], scaleX: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Input */}
        <div className="mt-auto">
          <div className="relative flex items-end gap-2 p-2 rounded-2xl border border-border bg-surface/80 backdrop-blur
            focus-within:border-accent/40 focus-within:bg-surface transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="e.g.  front strut bearing Haval H6 2021  or  LGXCE4GB2M1234567"
              rows={1}
              disabled={loading}
              className="flex-1 bg-transparent resize-none px-3 py-2.5 text-sm text-text-primary placeholder-text-secondary/30
                focus:outline-none max-h-40 disabled:opacity-50 font-mono"
              onInput={e => {
                const t = e.target as HTMLTextAreaElement
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 160) + 'px'
              }}
            />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-accent disabled:opacity-25 hover:bg-accent/85 flex items-center justify-center transition-all shrink-0 mb-0.5">
              <Send size={13} className="text-white" />
            </button>
          </div>
          <p className="text-xs text-text-secondary/30 mt-2 text-center font-mono">↵ send · shift+↵ new line</p>
        </div>
      </div>
    </div>
  )
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />

        // Parse inline bold and inline code
        const parsed = parseLine(line)

        // Heading-like lines (starts with **)
        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <div key={i} className="text-text-primary font-bold text-base tracking-tight">
              {line.slice(2, -2)}
            </div>
          )
        }

        // Bullet points
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} className="flex items-start gap-2 text-text-secondary">
              <span className="text-accent mt-1.5 text-xs shrink-0">▸</span>
              <span>{parseLine(line.replace(/^[-•]\s/, ''))}</span>
            </div>
          )
        }

        // Warning lines
        if (line.startsWith('⚠️')) {
          return (
            <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber/5 border border-amber/20 text-amber text-xs">
              {parseLine(line)}
            </div>
          )
        }

        // OEM: / Alt: label lines
        if (/^(OEM|Alt|Position|Fitment|Note|Part|Vehicle):/i.test(line)) {
          const colonIdx = line.indexOf(':')
          const label = line.slice(0, colonIdx)
          const val = line.slice(colonIdx + 1).trim()
          return (
            <div key={i} className="flex items-baseline gap-2">
              <span className="text-xs text-text-secondary/60 font-mono uppercase tracking-widest w-16 shrink-0">{label}</span>
              <span className="text-text-primary">{parseLine(val)}</span>
            </div>
          )
        }

        return <p key={i} className="text-text-secondary">{parsed}</p>
      })}
    </div>
  )
}

function parseLine(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={i} className="text-text-primary font-semibold">{part.slice(2, -2)}</strong>
        if (part.startsWith('`') && part.endsWith('`'))
          return (
            <code key={i} className="font-mono text-xs px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent">
              {part.slice(1, -1)}
            </code>
          )
        return <span key={i}>{part}</span>
      })}
    </>
  )
}
