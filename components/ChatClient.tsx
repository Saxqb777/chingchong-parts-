'use client'
import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Zap, User, Sparkles, RotateCcw, Package } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id: string
}

const QUICK_PROMPTS = [
  'Front brake pads for BYD Han EV 2022',
  'Timing chain Geely Coolray 1.5T',
  'What does chassis LGXCE4GB2M mean?',
  'Shock absorbers Haval H6 2021',
  'Engine oil filter MG ZS 1.5L',
  'Alternator Chery Tiggo 8 Pro 1.6T',
]

export default function ChatClient() {
  const params = useSearchParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Pre-fill from URL params
  useEffect(() => {
    const part = params.get('part')
    const vehicle = params.get('vehicle')
    if (part) setInput(`Tell me more about OEM part number ${part}`)
    if (vehicle && !part) setInput(`What are the most common failing parts for this vehicle?`)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamContent])

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

      if (!res.ok) throw new Error('Chat failed')
      if (!res.body) throw new Error('No stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              const text = parsed.delta?.text || parsed.text || ''
              full += text
              setStreamContent(full)
            } catch { /* skip malformed */ }
          }
        }
      }

      const aiMsg: Message = { role: 'assistant', content: full, id: (Date.now() + 1).toString() }
      setMessages(prev => [...prev, aiMsg])
      setStreamContent('')
    } catch (e) {
      const errMsg: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check your API key and try again.',
        id: (Date.now() + 1).toString(),
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="min-h-screen bg-void bg-grid pt-14 flex flex-col">
      <div className="max-w-3xl mx-auto w-full flex flex-col flex-1 px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-accent flex items-center justify-center">
                <Sparkles size={12} className="text-white" />
              </div>
              <h1 className="font-semibold text-text-primary">AI Parts Assistant</h1>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-jade/30 bg-jade/5">
                <div className="w-1.5 h-1.5 rounded-full bg-jade animate-pulse" />
                <span className="text-xs text-jade">Claude</span>
              </div>
            </div>
            <p className="text-xs text-text-secondary">Describe any part or paste a chassis number — I'll find it.</p>
          </div>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors">
              <RotateCcw size={11} /> New chat
            </button>
          )}
        </div>

        {/* Empty state / quick prompts */}
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col items-center justify-center pb-10">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-5 glow-blue">
              <Zap size={24} className="text-accent" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">What part do you need?</h2>
            <p className="text-text-secondary text-sm mb-8 text-center max-w-sm">
              Ask in plain language — "front strut bearing for 2021 Haval H6" — and I'll find the OEM number and specs.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
              {QUICK_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className="group flex items-start gap-2.5 p-3 rounded-xl border border-border bg-surface hover:border-accent/30 hover:bg-panel text-left transition-all"
                >
                  <Package size={12} className="text-accent mt-0.5 shrink-0" />
                  <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">{prompt}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-1">
                      <Zap size={12} className="text-accent" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                    ${msg.role === 'user' ? 'chat-user text-text-primary rounded-tr-sm' : 'chat-ai text-text-secondary rounded-tl-sm'}`}
                  >
                    <MessageContent content={msg.content} />
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0 mt-1">
                      <User size={12} className="text-text-secondary" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Streaming */}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-1">
                  <Zap size={12} className="text-accent animate-pulse" />
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-3 chat-ai text-sm text-text-secondary leading-relaxed">
                  {streamContent ? (
                    <>
                      <MessageContent content={streamContent} />
                      <span className="cursor-blink text-accent ml-0.5">▋</span>
                    </>
                  ) : (
                    <div className="flex gap-1 py-1">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-accent/50"
                          animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Input */}
        <div className="relative mt-auto">
          <div className="flex items-end gap-2 p-2 rounded-2xl border border-border bg-surface focus-within:border-accent/40 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Describe the part or paste a chassis number..."
              rows={1}
              className="flex-1 bg-transparent resize-none px-3 py-2 text-sm text-text-primary placeholder-text-secondary/40 focus:outline-none max-h-32"
              style={{ height: 'auto' }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement
                t.style.height = 'auto'
                t.style.height = t.scrollHeight + 'px'
              }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-accent disabled:opacity-30 hover:bg-accent/90 flex items-center justify-center transition-colors shrink-0"
            >
              <Send size={14} className="text-white" />
            </button>
          </div>
          <p className="text-xs text-text-secondary/50 mt-2 text-center">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  )
}

function MessageContent({ content }: { content: string }) {
  // Render markdown-like formatting (bold, code, line breaks)
  const lines = content.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line) return <div key={i} className="h-2" />
        // Bold
        const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
        return (
          <p key={i}>
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**'))
                return <strong key={j} className="text-text-primary font-semibold">{part.slice(2, -2)}</strong>
              if (part.startsWith('`') && part.endsWith('`'))
                return <code key={j} className="oem-number">{part.slice(1, -1)}</code>
              return <span key={j}>{part}</span>
            })}
          </p>
        )
      })}
    </div>
  )
}
