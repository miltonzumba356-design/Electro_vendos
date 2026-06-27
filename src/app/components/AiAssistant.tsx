import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Sparkles, X, Plus, Send, Trash2, ChevronLeft, MessageSquare,
} from 'lucide-react'
import { iaService } from '@/services/ia'
import type { SessaoIaResponse } from '@/types'
import { cn } from '@/app/components/ui/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface ChatMsg {
  id?: string
  role: 'user' | 'assistant'
  content: string
}

type View = 'chat' | 'sessions'

export function AiAssistant() {
  const [open, setOpen]                       = useState(false)
  const [view, setView]                       = useState<View>('chat')
  const [sessions, setSessions]               = useState<SessaoIaResponse[]>([])
  const [current, setCurrent]                 = useState<SessaoIaResponse | null>(null)
  const [messages, setMessages]               = useState<ChatMsg[]>([])
  const [input, setInput]                     = useState('')
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [sending, setSending]                 = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)
  const panelRef   = useRef<HTMLDivElement>(null)

  /* ── load sessions when panel opens ──────────────────────── */
  const loadSessions = useCallback(async () => {
    setLoadingSessions(true)
    try {
      const data = await iaService.listarSessoes()
      setSessions(data)
      return data
    } catch {
      return []
    } finally {
      setLoadingSessions(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    loadSessions().then((data) => {
      if (!current && data.length > 0) selectSession(data[0])
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  /* ── auto scroll ─────────────────────────────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  /* ── focus input ─────────────────────────────────────────── */
  useEffect(() => {
    if (open && view === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, view])

  /* ── select session ──────────────────────────────────────── */
  async function selectSession(session: SessaoIaResponse) {
    setCurrent(session)
    setView('chat')
    setMessages([])
    try {
      const msgs = await iaService.listarMensagens(session.id)
      setMessages(msgs.map((m) => ({
        id:      m.id,
        role:    m.role as 'user' | 'assistant',
        content: m.content,
      })))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar mensagens')
    }
  }

  /* ── send message ────────────────────────────────────────── */
  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')

    let sessao = current

    // create session on first message
    if (!sessao) {
      try {
        sessao = await iaService.criarSessao({ titulo: text.slice(0, 60) })
        setCurrent(sessao)
        setSessions((prev) => [sessao!, ...prev])
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao criar sessão')
        setSending(false)
        setInput(text)
        return
      }
    }

    // optimistic user message
    setMessages((prev) => [...prev, { role: 'user', content: text }])

    try {
      const res = await iaService.perguntar(sessao.id, text)
      setMessages((prev) => [
        ...prev,
        { id: res.mensagem_id, role: 'assistant', content: res.resposta },
      ])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar mensagem')
      setMessages((prev) => prev.slice(0, -1))
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  /* ── new session ─────────────────────────────────────────── */
  function handleNewSession() {
    setCurrent(null)
    setMessages([])
    setView('chat')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  /* ── delete session ──────────────────────────────────────── */
  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await iaService.apagarSessao(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
      if (current?.id === id) { setCurrent(null); setMessages([]) }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao apagar sessão')
    }
  }

  /* ── keyboard ────────────────────────────────────────────── */
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  /* ── auto-resize textarea ────────────────────────────────── */
  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 128) + 'px'
  }

  /* ── quick prompts ───────────────────────────────────────── */
  const quickPrompts = [
    'Qual foi o produto mais vendido este mês?',
    'Como está o saldo do fluxo de caixa?',
    'Quais clientes estão inativos há mais de 90 dias?',
    'Mostra um resumo das vendas de hoje.',
  ]

  return (
    <>
      {/* ── Floating trigger button ───────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Assistente IA"
        className={cn(
          'fixed bottom-6 right-6 z-50 size-13 rounded-full shadow-xl',
          'flex items-center justify-center transition-all duration-200',
          'bg-[#0F6CB5] hover:bg-[#0a5a9e] text-white',
          'hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6CB5]',
          open && 'scale-95 shadow-md'
        )}
        style={{ width: 52, height: 52 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0,   opacity: 1 }}
              exit={{   rotate: 90,   opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center"
            >
              <X className="size-5" />
            </motion.span>
          ) : (
            <motion.span
              key="ai"
              initial={{ rotate: 90,  opacity: 0 }}
              animate={{ rotate: 0,   opacity: 1 }}
              exit={{   rotate: -90,  opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center"
            >
              <Sparkles className="size-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* ── Chat panel ────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{   opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={cn(
              'fixed bottom-[4.5rem] right-6 z-40',
              'w-[min(420px,calc(100vw-2rem))]',
              'h-[min(580px,calc(100svh-6rem))]',
              'bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden'
            )}
          >
            {/* ── Header ────────────────────────────────────────── */}
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-card/80 backdrop-blur shrink-0">
              {view === 'sessions' ? (
                <button
                  onClick={() => setView('chat')}
                  className="size-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="size-4" />
                </button>
              ) : (
                <div className="size-7 rounded-full bg-[#0F6CB5] flex items-center justify-center shrink-0">
                  <Sparkles className="size-3.5 text-white" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate leading-tight">
                  {view === 'sessions'
                    ? 'Conversas'
                    : (current?.titulo ?? 'Assistente IA')}
                </p>
                {view === 'chat' && current && (
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {format(new Date(current.criado_em), 'dd/MM/yyyy HH:mm')}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setView((v) => v === 'sessions' ? 'chat' : 'sessions')}
                  title="Conversas"
                  className={cn(
                    'size-7 rounded-md flex items-center justify-center transition-colors',
                    view === 'sessions' ? 'bg-accent' : 'hover:bg-muted',
                    'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <MessageSquare className="size-4" />
                </button>
                <button
                  onClick={handleNewSession}
                  title="Nova conversa"
                  className="size-7 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="size-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="size-7 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* ── Sessions list ─────────────────────────────────── */}
            {view === 'sessions' && (
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {loadingSessions ? (
                  <p className="text-center text-sm text-muted-foreground py-10">A carregar...</p>
                ) : sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                    <MessageSquare className="size-8 opacity-30" />
                    <p className="text-sm">Nenhuma conversa ainda</p>
                  </div>
                ) : (
                  sessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => selectSession(s)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer group transition-colors',
                        current?.id === s.id ? 'bg-accent font-medium' : 'hover:bg-muted/60'
                      )}
                    >
                      <MessageSquare className="size-3.5 text-muted-foreground shrink-0" />
                      <p className="flex-1 text-sm truncate">{s.titulo}</p>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {format(new Date(s.criado_em), 'dd/MM')}
                      </span>
                      <button
                        onClick={(e) => handleDelete(s.id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── Chat view ─────────────────────────────────────── */}
            {view === 'chat' && (
              <>
                {/* messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {/* empty state + quick prompts */}
                  {messages.length === 0 && !sending && (
                    <div className="flex flex-col items-center text-center gap-3 pt-4">
                      <div className="size-12 rounded-full bg-[#0F6CB5]/10 flex items-center justify-center">
                        <Sparkles className="size-6 text-[#0F6CB5]" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Assistente IA</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[260px] mx-auto">
                          Faça perguntas sobre vendas, stock, clientes, fluxo de caixa, relatórios e muito mais.
                        </p>
                      </div>
                      <div className="flex flex-col gap-1.5 w-full mt-1">
                        {quickPrompts.map((p) => (
                          <button
                            key={p}
                            onClick={() => {
                              setInput(p)
                              inputRef.current?.focus()
                            }}
                            className="text-xs text-left px-3 py-2 rounded-lg border hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* message bubbles */}
                  {messages.map((msg, i) => (
                    <div
                      key={msg.id ?? i}
                      className={cn('flex gap-2 items-end', msg.role === 'user' && 'justify-end')}
                    >
                      {msg.role === 'assistant' && (
                        <div className="size-6 rounded-full bg-[#0F6CB5] flex items-center justify-center shrink-0 mb-0.5">
                          <Sparkles className="size-3 text-white" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words',
                          msg.role === 'user'
                            ? 'bg-[#0F6CB5] text-white rounded-br-sm'
                            : 'bg-muted rounded-bl-sm'
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {/* typing indicator */}
                  {sending && (
                    <div className="flex gap-2 items-end">
                      <div className="size-6 rounded-full bg-[#0F6CB5] flex items-center justify-center shrink-0">
                        <Sparkles className="size-3 text-white" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex gap-1 items-center">
                          <span className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                          <span className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:180ms]" />
                          <span className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:360ms]" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>

                {/* input area */}
                <div className="px-3 pb-3 pt-2 border-t shrink-0">
                  <div className="flex gap-2 items-end bg-muted/50 rounded-xl px-3 py-2 border focus-within:border-[#0F6CB5]/40 transition-colors">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => { setInput(e.target.value); autoResize(e.target) }}
                      onKeyDown={handleKeyDown}
                      placeholder="Faça a sua pergunta..."
                      rows={1}
                      className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed placeholder:text-muted-foreground py-0.5 max-h-32"
                      style={{ height: 'auto' }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || sending}
                      className={cn(
                        'size-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150',
                        input.trim() && !sending
                          ? 'bg-[#0F6CB5] text-white hover:bg-[#0a5a9e] hover:scale-105'
                          : 'bg-muted text-muted-foreground/40 cursor-not-allowed'
                      )}
                    >
                      <Send className="size-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 text-center mt-1.5 select-none">
                    Enter para enviar · Shift+Enter para nova linha
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
