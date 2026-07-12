import { useRef, useState } from 'react'
import axios from 'axios'
import { Bot, Loader2, Send, Sparkles, X } from 'lucide-react'

const starterPrompts = [
  'Improve my resume headline',
  'How do I prepare for HR round?',
  'Explain DSA in simple words',
]

export default function CaddieAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi, I am Caddie. Ask me anything about jobs, resumes, interviews, coding, or career planning.',
    },
  ])
  const [isSending, setIsSending] = useState(false)
  const inputRef = useRef(null)

  const openAssistant = () => {
    setIsOpen(true)
    window.setTimeout(() => inputRef.current?.focus(), 80)
  }

  const sendMessage = async (overrideText) => {
    const text = String(overrideText || input).trim()
    if (!text || isSending) return

    const nextMessages = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setIsSending(true)

    try {
      const response = await axios.post('/api/caddie/chat', {
        message: text,
        history: nextMessages.slice(0, -1),
      })

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: response.data?.answer || 'I could not find an answer right now.',
        },
      ])
    } catch (err) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: err.response?.data?.message || 'Caddie is unavailable right now. Please try again.',
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[70] max-w-[calc(100vw-2rem)] sm:bottom-5 sm:right-5">
      {isOpen && (
        <section className="mb-4 flex h-[min(620px,calc(100vh-7rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#080c12]/95 shadow-[0_28px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl">
          <header className="flex items-center justify-between border-b border-white/10 bg-[#0d131c] px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                <Bot size={22} />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[#061214]">
                  <Sparkles size={10} />
                </span>
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">Caddie</div>
                <div className="truncate text-xs text-secondary">Career helper</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-secondary transition hover:bg-white/10 hover:text-white"
              aria-label="Close Caddie"
            >
              <X size={18} />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => {
              const isUser = message.role === 'user'

              return (
                <div key={`${message.role}-${index}`} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      isUser
                        ? 'bg-primary text-white'
                        : 'border border-white/10 bg-[#111722] text-[#e8ddd9]'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              )
            })}
            {isSending && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#111722] px-4 py-3 text-sm text-secondary">
                  <Loader2 size={16} className="animate-spin" />
                  Caddie is thinking
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 bg-[#0d131c] p-3">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-secondary transition hover:border-primary/40 hover:text-white"
                  disabled={isSending}
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form
              className="flex items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                sendMessage()
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    sendMessage()
                  }
                }}
                rows={1}
                placeholder="Ask Caddie anything..."
                className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-white/10 bg-[#080c12] px-4 py-3 text-sm text-white outline-none transition placeholder:text-muted focus:border-primary/50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark disabled:opacity-60"
                aria-label="Send message to Caddie"
              >
                {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={openAssistant}
        className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-[#0d131c] px-4 py-3 text-white shadow-[0_18px_60px_rgba(0,0,0,0.34)] transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-[#121a25]"
        aria-label="Open Caddie helper"
      >
        <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
          <Bot size={21} />
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-accent" />
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-semibold leading-none">Caddie</span>
          <span className="mt-1 block text-xs text-secondary">Ask anything</span>
        </span>
      </button>
    </div>
  )
}
