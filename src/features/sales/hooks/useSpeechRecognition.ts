import { useCallback, useEffect, useRef, useState } from 'react'

/** Máximo de caracteres que se conservan del dictado (se trunca al llegar aquí). */
export const MAX_TRANSCRIPT_LENGTH = 1500

export type SpeechRecognitionResult = {
  transcript: string
  interimTranscript: string
  isListening: boolean
  error: string | null
  isSupported: boolean
  /** Nivel de audio 0-100 para la barra indicadora. */
  audioLevel: number
  /** true cuando transcript alcanzó MAX_TRANSCRIPT_LENGTH. */
  isAtLimit: boolean
  resetTranscript: () => void
  startListening: () => void
  stopListening: () => void
}

// ---------------------------------------------------------------------------
// Constantes de afinación
// ---------------------------------------------------------------------------

/** Idiomas a intentar, en orden. Si Google rechaza uno pasa al siguiente. */
const LANG_CHAIN = ['es-GT', 'es']
/** Nivel 0-100 por encima del cual consideramos que hay voz. */
const AUDIO_THRESHOLD = 8
/** Tick del watchdog en ms. */
const WATCHDOG_TICK = 120
/** Audio sostenido sin resultados durante este tiempo → sesión zombie. */
const ZOMBIE_MS = 3500
/** Rotación preventiva de sesión durante silencio (evita cortes a mitad de frase). */
const ROTATE_MS = 40000
/** Guard contra loops: máximo de reinicios en la ventana sin recibir resultados. */
const STORM_MAX = 8
const STORM_WINDOW_MS = 10000

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCtor(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null
  return (window.SpeechRecognition ?? window.webkitSpeechRecognition) ?? null
}

function isLocalhost(): boolean {
  const hn = window.location.hostname
  return hn === 'localhost' || hn === '127.0.0.1'
}

type AudioMonitor = {
  ctx: AudioContext
  stream: MediaStream
  level: number // 0-100, actualizado por rAF
  raf: number
  destroyed: boolean
}

/**
 * Abre el micrófono sin procesamiento 
 */
async function createMonitor(): Promise<AudioMonitor> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  })

  const ctx = new AudioContext()
  const source = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  analyser.smoothingTimeConstant = 0.3
  source.connect(analyser)

  const data = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount))
  const monitor: AudioMonitor = { ctx, stream, level: 0, raf: 0, destroyed: false }

  const tick = () => {
    if (monitor.destroyed) return
    analyser.getByteFrequencyData(data)
    let sum = 0
    for (let i = 0; i < data.length; i++) sum += data[i]
    monitor.level = Math.round((sum / data.length / 255) * 100)
    monitor.raf = requestAnimationFrame(tick)
  }
  tick()

  return monitor
}

function destroyMonitor(m: AudioMonitor | null) {
  if (!m || m.destroyed) return
  m.destroyed = true
  cancelAnimationFrame(m.raf)
  m.stream.getTracks().forEach((t) => t.stop())
  m.ctx.close().catch(() => {})
}


/**
 * Transcripción de voz a texto

 */
export function useSpeechRecognition(options: {
  enabled: boolean
  lang?: string
}): SpeechRecognitionResult {
  const { enabled, lang } = options

  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)

  const r = useRef({
    rec: null as SpeechRecognition | null,
    monitor: null as AudioMonitor | null,
    acc: '',                 // final acumulado
    interimPending: '',      
    active: false,           
    generation: 0,           
    sessionStart: 0,         
    lastActivity: 0,         
    speakingMs: 0,           
    restarts: [] as number[],
    gotResultsSinceStorm: false,
    watchdog: null as ReturnType<typeof setInterval> | null,
    langChain: [...LANG_CHAIN],
    langIndex: 0,
  })

 
  useEffect(() => {
    if (lang && lang !== r.current.langChain[0]) {
      r.current.langChain = [lang, ...LANG_CHAIN.filter((l) => l !== lang)]
    }
  }, [lang])

  const isSupported = getCtor() !== null

  const teardown = useCallback((clearText: boolean) => {
    const s = r.current
    s.active = false
    s.generation++
    if (s.watchdog) { clearInterval(s.watchdog); s.watchdog = null }
    if (s.rec) {
      try { s.rec.abort() } catch { /* noop */ }
      s.rec = null
    }
    destroyMonitor(s.monitor)
    s.monitor = null
    s.speakingMs = 0
    s.restarts = []
    if (clearText) {
      s.acc = ''
      s.interimPending = ''
      setTranscript('')
      setInterimTranscript('')
    }
    setIsListening(false)
    setAudioLevel(0)
  }, [])

  // ---- crear una sesión de reconocimiento ----
  const spawnSession = useCallback(function spawn(gen: number) {
    const s = r.current
    if (!s.active || gen !== s.generation) return

    const Ctor = getCtor()
    if (!Ctor) return

    const rec = new Ctor()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = s.langChain[Math.min(s.langIndex, s.langChain.length - 1)]

    rec.onresult = (event: SpeechRecognitionEvent) => {
      if (gen !== s.generation) return
      s.lastActivity = Date.now()
      s.gotResultsSinceStorm = true

      let fin = ''
      let inter = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) fin += result[0].transcript + ' '
        else inter += result[0].transcript
      }

      if (fin) {
        s.acc = (s.acc + fin).slice(0, MAX_TRANSCRIPT_LENGTH)
        setTranscript(s.acc)
      }

      s.interimPending = inter
      setInterimTranscript(inter)
      setError(null)
    }

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (gen !== s.generation) return

      switch (event.error) {
        case 'not-allowed':
          teardown(false)
          setError('Permiso de micrófono denegado.')
          break
        case 'audio-capture':
          teardown(false)
          setError('No se detectó micrófono.')
          break
        case 'service-not-allowed':
          teardown(false)
          setError('Servicio de voz bloqueado por el navegador.')
          break
        case 'network':
          teardown(false)
          setError('Error de red en el reconocimiento de voz.')
          break
        case 'language-not-supported':
          //api
          if (s.langIndex < s.langChain.length - 1) s.langIndex++
          break
        //api
      }
    }

    rec.onend = () => {
      if (gen !== s.generation) return

      //api
      if (s.interimPending.trim()) {
        s.acc = (s.acc + s.interimPending.trim() + ' ').slice(0, MAX_TRANSCRIPT_LENGTH)
        s.interimPending = ''
        setTranscript(s.acc)
        setInterimTranscript('')
      }

      if (!s.active) {
        setIsListening(false)
        return
      }

      //api
      const now = Date.now()
      s.restarts = s.restarts.filter((t) => now - t < STORM_WINDOW_MS)
      s.restarts.push(now)
      if (s.restarts.length >= STORM_MAX && !s.gotResultsSinceStorm) {
        teardown(false)
        setError('El servicio de voz no responde. Reintentá en unos segundos.')
        return
      }
      if (s.restarts.length >= STORM_MAX) {
        //api
        s.restarts = []
        s.gotResultsSinceStorm = false
      }

      //api
      s.sessionStart = now
      try {
        rec.start()
      } catch {
        //api
        setTimeout(() => spawn(gen), 30)
      }
    }

    try {
      rec.start()
      s.rec = rec
      s.sessionStart = Date.now()
      s.lastActivity = Date.now()
    } catch (err: unknown) {
      const detail = err instanceof DOMException ? err.message : String(err)
      if (!detail.toLowerCase().includes('already started')) {
        teardown(false)
        setError(`No se pudo iniciar: ${detail}`)
      }
    }
  }, [teardown])

  //api

  const startListening = useCallback(async () => {
    const s = r.current

    if (!getCtor()) { setError('Navegador no compatible.'); return }
    if (!window.isSecureContext && !isLocalhost()) {
      setError('La API de voz requiere HTTPS o localhost.')
      return
    }

    
    s.generation++
    if (s.watchdog) { clearInterval(s.watchdog); s.watchdog = null }
    if (s.rec) { try { s.rec.abort() } catch { /* noop */ } s.rec = null }
    destroyMonitor(s.monitor)
    s.monitor = null

    
    let monitor: AudioMonitor
    try {
      monitor = await createMonitor()
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Permiso de micrófono denegado.')
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('No se detectó un micrófono.')
      } else if (err instanceof DOMException && err.name === 'NotReadableError') {
        setError('Micrófono en uso por otra app.')
      } else {
        setError('No se pudo acceder al micrófono.')
      }
      return
    }

    s.monitor = monitor
    s.active = true
    s.langIndex = 0
    s.restarts = []
    s.gotResultsSinceStorm = false
    s.speakingMs = 0
    setIsListening(true)
    setError(null)

    const gen = s.generation

    
    let lastLevel = -1
    s.watchdog = setInterval(() => {
      if (gen !== s.generation || !s.active || !s.monitor) return
      const level = s.monitor.level

      
      if (Math.abs(level - lastLevel) > 2) {
        lastLevel = level
        setAudioLevel(level)
      }

      
      if (level > AUDIO_THRESHOLD) s.speakingMs += WATCHDOG_TICK
      else s.speakingMs = 0

      const now = Date.now()
      const idleMs = now - s.lastActivity

      
      if (s.speakingMs >= ZOMBIE_MS && idleMs >= ZOMBIE_MS && s.rec) {
        s.lastActivity = now 
        try { s.rec.stop() } catch { /* noop */ } 
        return
      }

      
      if (
        now - s.sessionStart > ROTATE_MS &&
        level <= AUDIO_THRESHOLD &&
        !s.interimPending &&
        s.rec
      ) {
        s.sessionStart = now
        try { s.rec.stop() } catch { /* noop */ }
      }
    }, WATCHDOG_TICK)

    spawnSession(gen)
  }, [spawnSession])

  const stopListening = useCallback(() => {
    const s = r.current
    s.active = false
    if (s.watchdog) { clearInterval(s.watchdog); s.watchdog = null }
    destroyMonitor(s.monitor)
    s.monitor = null
    setAudioLevel(0)
    if (s.rec) {
      
      
      try { s.rec.stop() } catch { /* noop */ }
      s.rec = null
    } else {
      setIsListening(false)
    }
  }, [])

  const resetTranscript = useCallback(() => {
    r.current.acc = ''
    r.current.interimPending = ''
    setTranscript('')
    setInterimTranscript('')
  }, [])

  
  
  useEffect(() => {
    if (enabled) {
      startListening()
    } else {
      stopListening()
    }
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  
  useEffect(() => {
    return () => teardown(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    transcript,
    interimTranscript,
    isListening,
    error,
    isSupported,
    audioLevel,
    isAtLimit: transcript.length >= MAX_TRANSCRIPT_LENGTH,
    resetTranscript,
    startListening,
    stopListening,
  }
}
