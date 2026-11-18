import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Bot, Loader2, Mic, Send, Trash2, Volume2, VolumeX, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/features/core/store/auth-store'
import { useSalesStore } from '@/features/sales/store/useSalesStore'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
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
  })

  const connected = status === 'open'

  // Una confirmación pendiente no sobrevive al cierre del panel ni a la desconexión del socket.
  useEffect(() => {
    if (!open || status !== 'open') cancelConfirmation()
  }, [open, status, cancelConfirmation])
  useEffect(() => cancelConfirmation, [cancelConfirmation])

  // --- voz: un toque prende, otro apaga y envía --------------------------------
  const speech = useSpeechRecognition({ enabled: holding })
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
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('blur', onBlur)
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
  }, [messages, open])

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
        : null
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
            className="pointer-events-auto flex h-[min(70vh,32rem)] w-[min(92vw,24rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-xl"
          >
            <header className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Bot className="size-4 text-primary" aria-hidden />
              <h2 className="flex-1 text-sm font-semibold">Asistente</h2>
              {statusText && <span className="text-xs text-muted-foreground">{statusText}</span>}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleSpeak}
                aria-label={speakReplies ? 'Silenciar respuestas' : 'Leer respuestas en voz alta'}
                aria-pressed={speakReplies}
              >
                {speakReplies ? <Volume2 /> : <VolumeX />}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={clearMessages}
                disabled={messages.length === 0}
                aria-label="Limpiar conversación"
              >
                <Trash2 />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={toggleOpen} aria-label="Cerrar asistente">
                <X />
              </Button>
            </header>

            <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3 text-sm" aria-live="polite">
              {messages.length === 0 && (
                <p className="text-muted-foreground">
                  Pídeme cosas como «ve a historial», «agrega 2 camisas M al carrito» o «abre el carrito». Escribe o
                  toca el micrófono (o la tecla {PUSH_TO_TALK_KEY}) para hablar y otra vez para enviar.
                </p>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2',
                    message.role === 'user' && 'ml-auto bg-primary text-primary-foreground',
                    message.role === 'assistant' && 'bg-muted text-foreground',
                    message.role === 'action' && 'bg-transparent px-1 py-0 text-xs text-muted-foreground italic',
                    message.role === 'error' && 'bg-destructive/10 text-destructive',
                  )}
                >
                  {message.text}
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" aria-hidden /> Pensando…
                </div>
              )}
              <div ref={endRef} />
            </div>

            {speech.error && <p className="px-3 pb-1 text-xs text-destructive">{speech.error}</p>}

            {pendingConfirm && (
              <div
                role="alertdialog"
                aria-label="Confirmar acción"
                className="border-t border-border bg-muted/60 px-3 py-2 text-sm"
              >
                <p className="mb-2 font-medium">{pendingConfirm.texto}</p>
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

            <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-2">
              <input
                // Mientras se dicta, la caja muestra en gris lo que se va escuchando (no se edita).
                value={holding ? heard : input}
                onChange={(event) => setInput(event.target.value)}
                readOnly={holding}
                aria-live={holding ? 'polite' : undefined}
                placeholder={holding ? 'Escuchando…' : connected ? 'Escribe una instrucción…' : 'Conectando…'}
                disabled={!connected}
                maxLength={500}
                className={cn(
                  'h-9 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50',
                  holding && 'italic text-muted-foreground',
                )}
              />
              <Button
                type="button"
                variant={holding ? 'default' : 'outline'}
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
                className="select-none transition-transform duration-100"
                style={{ transform: `scale(${micScale})` }}
                onClick={toggleHold}
              >
                <Mic />
              </Button>
              <Button type="submit" size="icon-lg" disabled={!connected || busy || !input.trim()} aria-label="Enviar">
                <Send />
              </Button>
            </form>
          </section>
        )}

        <Button
          size="icon-lg"
          className="pointer-events-auto size-12 rounded-full shadow-lg"
          onClick={toggleOpen}
          aria-label={open ? 'Cerrar asistente' : 'Abrir asistente'}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Bot className="size-5" />}
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
          className="pointer-events-auto fixed bottom-6 left-1/2 z-[90] max-w-[90vw] -translate-x-1/2 truncate rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg"
        >
          <Mic className="mr-1.5 inline size-3.5" style={{ transform: `scale(${micScale})` }} aria-hidden />
          {heard || 'Escuchando…'} <span className="opacity-60">· toca para enviar</span>
        </button>
      )}
    </>
  )
}
