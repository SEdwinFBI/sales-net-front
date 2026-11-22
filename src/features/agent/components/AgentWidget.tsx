import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { AlertCircle, Bot, Mic, Send, Sparkles, Trash2, Volume2, VolumeX, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/features/core/store/auth-store'
import { useSalesStore } from '@/features/sales/store/useSalesStore'
import { isMobileBrowser, useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { allFeatureRoutes } from '@/routes/feature-routes'

import { createAgentActions, createDefaultDeps } from '../agent-actions'
import { buildContextSnapshot } from '../context-snapshot'
import { useAgentSocket } from '../hooks/useAgentSocket'
import { toToolSpecs, useAgentToolRegistry } from '../registry/agent-tool-registry'
import { getCatalogRoutes } from '../route-catalog'
import { useAgentStore } from '../store/useAgentStore'
import type { AgentContext, ContextTool } from '../types'

const SPEAK_PREF_KEY = 'agent-speak-replies'
/** Si el navegador no avisa del fin del dictado, se envía lo capturado pasado este tiempo. */
const VOICE_FLUSH_FALLBACK_MS = 2500
/** Atajo global del micrófono (interruptor): funciona aunque un diálogo o drawer tenga el foco atrapado. */
const PUSH_TO_TALK_KEY = 'F2'

const QUICK_PROMPTS = [
  'Ve al historial de ventas',
  'Abre el carrito',
  '¿Qué hay en esta pantalla?',
]

/** Ruta ya confirmada por el navegador (la navegación de React Router es asíncrona). */
const getPathname = () => window.location.pathname

/** Tools que registran las pantallas montadas, en la forma que entiende el back. */
const getScreenTools = (): ContextTool[] => toToolSpecs(useAgentToolRegistry.getState().getAll())

function readSpeakPreference(): boolean {
  try {
    return localStorage.getItem(SPEAK_PREF_KEY) === '1'
  } catch {
    return false
  }
}

function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'es-GT'
  window.speechSynthesis.speak(utterance)
}

function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
}

type Props = {
  /** Mismo flujo que el botón de cerrar sesión del header (lo usa la tool cerrar_sesion tras confirmar). */
  onLogout: () => void
}

export default function AgentWidget({ onLogout }: Props) {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const cartOpen = useSalesStore((state) => state.cartOpen)
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  const [input, setInput] = useState('')
  const [speakReplies, setSpeakReplies] = useState(readSpeakPreference)
  const [holding, setHolding] = useState(false)
  /** Había un diálogo/drawer modal al empezar a hablar: el panel queda tapado y se muestra la píldora. */
  const [modalOpen, setModalOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const pendingConfirm = useAgentStore((state) => state.pendingConfirm)
  const resolveConfirm = useAgentStore((state) => state.resolveConfirm)
  const cancelConfirmation = useAgentStore((state) => state.cancelConfirmation)

  const actions = useMemo(
    () => createAgentActions(createDefaultDeps(navigate, getPathname, onLogout)),
    [navigate, onLogout],
  )

  const getContext = useCallback((): AgentContext => {
    const currentUser = useAuthStore.getState().user
    if (!currentUser) throw new Error('Sin sesión')
    return buildContextSnapshot({
      pathname: getPathname(),
      user: currentUser,
      sales: useSalesStore.getState(),
      catalog: getCatalogRoutes(allFeatureRoutes, currentUser.permissions),
    })
  }, [])

  const speakRef = useRef(speakReplies)
  useEffect(() => {
    speakRef.current = speakReplies
  }, [speakReplies])

  const { status, messages, busy, sendUserMessage, clearMessages } = useAgentSocket({
    enabled: hasOpened && Boolean(user),
    token,
    executeTool: actions.execute,
    getContext,
    getTools: getScreenTools,
    onAssistantDone: (text) => {
      if (speakRef.current) speak(text)
    },
    // Con el turno cerrado nadie espera la respuesta: una tarjeta que quedara abierta ejecutaría a ciegas.
    onTurnEnd: cancelConfirmation,
  })

  const connected = status === 'open'

  // Una confirmación pendiente no sobrevive al cierre del panel ni a la desconexión del socket.
  useEffect(() => {
    if (!open || status !== 'open') cancelConfirmation()
  }, [open, status, cancelConfirmation])
  useEffect(() => cancelConfirmation, [cancelConfirmation])

  // --- voz: un toque prende, otro apaga y envía --------------------------------
  const speech = useSpeechRecognition({ enabled: holding, source: 'agent' })
  const setAgentListening = useAgentStore((state) => state.setListening)
  const pendingVoiceSend = useRef(false)
  const holdingRef = useRef(false)
  const voiceText = useRef({ transcript: '', interim: '' })
  const sendRef = useRef(sendUserMessage)
  const resetTranscriptRef = useRef(speech.resetTranscript)
  useEffect(() => {
    voiceText.current = { transcript: speech.transcript, interim: speech.interimTranscript }
    sendRef.current = sendUserMessage
    resetTranscriptRef.current = speech.resetTranscript
  })

  // El dictado del carrito se calla mientras el agente tiene el micrófono (y hasta que termina de cerrarlo).
  const micActive = holding || speech.isListening
  useEffect(() => {
    setAgentListening(micActive)
    return () => setAgentListening(false)
  }, [micActive, setAgentListening])

  const flushVoice = useCallback(() => {
    if (!pendingVoiceSend.current) return
    pendingVoiceSend.current = false
    const { transcript, interim } = voiceText.current
    resetTranscriptRef.current()
    const text = `${transcript} ${interim}`.trim()
    if (!text) return
    const ok = sendRef.current(text)
    // Respaldo: si no se pudo enviar, el dictado no se pierde; queda en el input para enviarlo con Enter.
    if (!ok) setInput(text)
  }, [])

  // El navegador entrega el último resultado al cerrar el dictado: se envía cuando deja de escuchar.
  useEffect(() => {
    if (!speech.isListening) flushVoice()
  }, [speech.isListening, flushVoice])

  const canTalk = connected && !busy && speech.isSupported

  const beginHold = () => {
    if (holdingRef.current) return
    if (!open) {
      // Con el widget cerrado, F2 solo lo abre (el micrófono necesita el socket conectado).
      setOpen(true)
      setHasOpened(true)
      return
    }
    if (!canTalk) return
    stopSpeaking()
    pendingVoiceSend.current = false
    speech.resetTranscript()
    holdingRef.current = true
    setModalOpen(Boolean(document.querySelector('[role="dialog"]')))
    setHolding(true)
  }

  /** Apaga el micrófono. `send`: envía lo dictado; si no, lo descarta (panel cerrado o sin conexión). */
  const finishHold = (send = true) => {
    if (!holdingRef.current) return
    holdingRef.current = false
    setHolding(false)
    if (!send) {
      pendingVoiceSend.current = false
      resetTranscriptRef.current()
      return
    }
    pendingVoiceSend.current = true
    const { transcript, interim } = voiceText.current
    // Sin esperar el cierre del navegador (hasta 1,5 s): si ya hay texto, se envía al instante.
    if (`${transcript} ${interim}`.trim()) flushVoice()
    else window.setTimeout(flushVoice, VOICE_FLUSH_FALLBACK_MS)
  }

  /** Un toque prende el micrófono y otro lo apaga y envía. */
  const toggleHold = () => (holdingRef.current ? finishHold() : beginHold())

  // F2 = mismo interruptor, aunque haya un diálogo modal con el foco atrapado.
  const holdHandlers = useRef({ toggle: toggleHold, finish: finishHold })
  useEffect(() => {
    holdHandlers.current = { toggle: toggleHold, finish: finishHold }
  })
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== PUSH_TO_TALK_KEY) return
      event.preventDefault()
      if (!event.repeat) holdHandlers.current.toggle()
    }
    const onBlur = () => holdHandlers.current.finish()
    const onVisibility = () => {
      if (document.hidden) holdHandlers.current.finish()
    }
    // En el teléfono el aviso de permiso del micrófono quita el foco a la ventana: ahí solo
    // se apaga al salir de la página, o el micrófono se cerraría en cuanto se pide.
    const stopOnBlur = !isMobileBrowser()
    window.addEventListener('keydown', onKeyDown)
    if (stopOnBlur) window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      if (stopOnBlur) window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  // Con el interruptor, el micrófono podría quedar abierto: se apaga sin enviar al cerrar el panel o perder la conexión.
  useEffect(() => {
    if (!open || !connected) holdHandlers.current.finish(false)
  }, [open, connected])

  // --- chat -------------------------------------------------------------------
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, open, busy])

  const toggleOpen = () => {
    if (open) cancelConfirmation()
    setOpen((value) => !value)
    setHasOpened(true)
  }

  const toggleSpeak = () => {
    const next = !speakReplies
    setSpeakReplies(next)
    if (!next) stopSpeaking()
    try {
      localStorage.setItem(SPEAK_PREF_KEY, next ? '1' : '0')
    } catch {
      // Sin almacenamiento: la preferencia solo dura la sesión.
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    stopSpeaking()
    if (sendUserMessage(input)) setInput('')
  }

  if (!user) return null

  const statusText =
    status === 'connecting' || status === 'closed'
      ? 'Conectando…'
      : status === 'error'
        ? 'No disponible'
        : 'En línea'
  const statusDotClass =
    status === 'open'
      ? 'bg-emerald-500'
      : status === 'error'
        ? 'bg-destructive'
        : 'bg-amber-400 animate-pulse'
  const heard = `${speech.transcript} ${speech.interimTranscript}`.trim()
  /** El botón del micrófono crece con el volumen de la voz (audioLevel 0-100). */
  const micScale = holding ? 1 + Math.min(speech.audioLevel, 60) / 200 : 1

  return (
    <>
      <div
        data-agent-widget
        className={cn(
          'pointer-events-none fixed z-[70] flex gap-3',
          // El carrito ocupa el lado derecho/inferior y su pie queda tapado: el widget pasa arriba a la izquierda.
          cartOpen ? 'top-4 left-4 flex-col-reverse items-start' : 'right-4 bottom-20 flex-col items-end sm:right-5',
        )}
      >
        {open && (
          <section
            aria-label="Asistente"
            className="pointer-events-auto flex h-[min(72vh,34rem)] w-[min(92vw,24.5rem)] flex-col overflow-hidden rounded-3xl border border-border/80 bg-card/95 text-foreground shadow-elevated backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150"
          >
            <header className="flex items-center gap-2.5 border-b border-border/70 bg-muted/35 px-3.5 py-3">
              <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                <Bot className="size-4.5" aria-hidden="true" />
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-card',
                    statusDotClass,
                  )}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-sm font-semibold leading-tight text-foreground">
                  Asistente MZ
                </h2>
                <p className="text-[11px] font-medium text-muted-foreground">
                  {holding ? 'Escuchando tu voz…' : statusText}
                </p>
              </div>
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggleSpeak}
                  title={speakReplies ? 'Silenciar respuestas' : 'Leer respuestas en voz alta'}
                  aria-label={speakReplies ? 'Silenciar respuestas' : 'Leer respuestas en voz alta'}
                  aria-pressed={speakReplies}
                  className={cn(speakReplies && 'text-primary')}
                >
                  {speakReplies ? <Volume2 /> : <VolumeX />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={clearMessages}
                  disabled={messages.length === 0}
                  title="Limpiar conversación"
                  aria-label="Limpiar conversación"
                >
                  <Trash2 />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggleOpen}
                  title="Cerrar asistente"
                  aria-label="Cerrar asistente"
                >
                  <X />
                </Button>
              </div>
            </header>

            <div className="flex-1 space-y-2.5 overflow-y-auto px-3.5 py-3.5 text-sm" aria-live="polite">
              {messages.length === 0 && (
                <div className="flex h-full flex-col justify-between gap-4 py-2">
                  <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/35 p-3.5">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                      <Sparkles className="size-3" aria-hidden="true" />
                      Voz y chat
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Puedo navegar pantallas, consultar datos, filtrar tablas o agregar productos al carrito.
                      Escribe o toca el micrófono (<kbd className="rounded bg-card px-1 py-0.5 font-mono text-[10px] text-foreground shadow-2xs ring-1 ring-border">{PUSH_TO_TALK_KEY}</kbd>) para dictar.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <p className="px-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Sugerencias rápidas
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => {
                            setInput(prompt)
                            inputRef.current?.focus()
                          }}
                          className="cursor-pointer rounded-full border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-foreground/85 transition-colors hover:border-primary/40 hover:bg-primary/[0.06] hover:text-primary"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'whitespace-pre-wrap leading-relaxed',
                    message.role === 'user' &&
                      'ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-[0.84rem] text-primary-foreground shadow-xs',
                    message.role === 'assistant' &&
                      'max-w-[88%] rounded-2xl rounded-bl-md border border-border/60 bg-muted/60 px-3.5 py-2 text-[0.84rem] text-foreground',
                    message.role === 'action' &&
                      'inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground',
                    message.role === 'error' &&
                      'max-w-[90%] rounded-2xl border border-destructive/25 bg-destructive/10 px-3.5 py-2 text-xs font-medium text-destructive',
                  )}
                >
                  {message.role === 'action' && (
                    <Sparkles className="size-3 shrink-0 text-primary/75" aria-hidden="true" />
                  )}
                  <span>{message.text}</span>
                </div>
              ))}

              {busy && (
                <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-border/60 bg-muted/50 px-3.5 py-2 text-xs font-medium text-muted-foreground">
                  <span className="flex items-center gap-1" aria-hidden="true">
                    <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-primary" />
                  </span>
                  Pensando…
                </div>
              )}
              <div ref={endRef} />
            </div>

            {speech.error && (
              <p className="mx-3.5 mb-2 flex items-center gap-1.5 rounded-xl bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive">
                <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                {speech.error}
              </p>
            )}

            {pendingConfirm && (
              <div
                role="alertdialog"
                aria-label="Confirmar acción"
                className="border-t border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-sm dark:bg-amber-500/12"
              >
                <p className="mb-2.5 text-xs font-semibold leading-snug text-foreground">
                  {pendingConfirm.texto}
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => resolveConfirm(pendingConfirm.id, false)}>
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={(event) => {
                      // Solo cuenta un clic real del usuario: nunca uno generado por código.
                      if (!event.nativeEvent.isTrusted) return
                      resolveConfirm(pendingConfirm.id, true)
                    }}
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border/70 bg-muted/25 p-2.5">
              <input
                ref={inputRef}
                // Mientras se dicta, la caja muestra en gris lo que se va escuchando (no se edita).
                value={holding ? heard : input}
                onChange={(event) => setInput(event.target.value)}
                readOnly={holding}
                aria-live={holding ? 'polite' : undefined}
                placeholder={holding ? 'Escuchando…' : connected ? 'Escribe una instrucción…' : 'Conectando…'}
                disabled={!connected}
                maxLength={500}
                className={cn(
                  'h-10 min-w-0 flex-1 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/75 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/60 disabled:opacity-50',
                  holding && 'border-destructive/40 italic text-muted-foreground',
                )}
              />
              <Button
                type="button"
                variant={holding ? 'destructive' : 'outline'}
                size="icon-lg"
                disabled={!holding && (!connected || busy || !speech.isSupported)}
                title={
                  speech.isSupported
                    ? holding
                      ? `Toca para enviar (o ${PUSH_TO_TALK_KEY})`
                      : `Toca para hablar (o ${PUSH_TO_TALK_KEY})`
                    : 'Tu navegador no soporta dictado por voz'
                }
                aria-label={holding ? 'Detener y enviar dictado' : 'Hablar'}
                aria-pressed={holding}
                className={cn(
                  'select-none rounded-xl transition-transform duration-100',
                  holding && 'border-destructive bg-destructive text-white hover:bg-destructive/90',
                )}
                style={{ transform: `scale(${micScale})` }}
                onClick={toggleHold}
              >
                <Mic />
              </Button>
              <Button
                type="submit"
                size="icon-lg"
                className="rounded-xl"
                disabled={!connected || busy || !input.trim()}
                aria-label="Enviar"
              >
                <Send />
              </Button>
            </form>
          </section>
        )}

        <Button
          size="icon-lg"
          className={cn(
            'pointer-events-auto relative size-13 rounded-full shadow-elevated transition-transform duration-150 hover:scale-105 active:scale-95',
            holding && 'ring-4 ring-destructive/35',
          )}
          onClick={toggleOpen}
          aria-label={open ? 'Cerrar asistente' : 'Abrir asistente'}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Bot className="size-5" />}
          {!open && holding && (
            <span
              aria-hidden="true"
              className="absolute -top-0.5 -right-0.5 size-3.5 animate-ping rounded-full bg-destructive"
            />
          )}
        </Button>
      </div>

      {/* Fuera del contenedor del widget (otro contexto de apilamiento) para quedar sobre los diálogos (z-80). */}
      {holding && (modalOpen || !open) && (
        <button
          type="button"
          aria-live="polite"
          aria-label="Detener y enviar dictado"
          data-agent-widget
          // Sin esto el diálogo abierto lo tomaría como clic afuera y se cerraría (y el foco saldría de él).
          onPointerDown={(event) => {
            event.stopPropagation()
            event.preventDefault()
          }}
          onClick={() => finishHold()}
          className="pointer-events-auto fixed bottom-6 left-1/2 z-[90] flex max-w-[90vw] -translate-x-1/2 cursor-pointer items-center gap-2 truncate rounded-full border border-white/15 bg-slate-900/95 px-4 py-2.5 text-sm font-medium text-white shadow-elevated backdrop-blur-md"
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive text-white">
            <Mic className="size-3.5" style={{ transform: `scale(${micScale})` }} aria-hidden />
          </span>
          <span className="truncate">{heard || 'Escuchando…'}</span>
          <span className="shrink-0 text-xs text-white/60">· toca para enviar</span>
        </button>
      )}
    </>
  )
}
