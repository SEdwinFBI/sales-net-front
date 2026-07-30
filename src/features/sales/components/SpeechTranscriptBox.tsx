import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Eraser, Mic, MicOff, TriangleAlert } from 'lucide-react'

type Props = {
  transcript: string
  interimTranscript: string
  isListening: boolean
  error: string | null
  isSupported: boolean
  audioLevel: number
  isAtLimit: boolean
  onReset: () => void
  onStart: () => void
}

const SpeechTranscriptBox = ({
  transcript,
  interimTranscript,
  isListening,
  error,
  isSupported,
  audioLevel,
  isAtLimit,
  onReset,
  onStart,
}: Props) => {
  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 px-3 py-2 text-muted-foreground">
        <TriangleAlert className="size-4 shrink-0" />
        <p className="text-xs">Navegador no compatible con reconocimiento de voz.</p>
      </div>
    )
  }

  const hasText = transcript.length > 0 || interimTranscript.length > 0
  const hasError = error !== null
  const hasAudio = audioLevel > 8

  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3 py-2.5 transition-colors',
        isListening
          ? 'border-primary/30 bg-primary/5'
          : hasError
            ? 'border-destructive/30 bg-destructive/5'
            : 'border-muted-foreground/20 bg-muted/30',
      )}
    >
     
      <div className="flex flex-col items-center gap-1 shrink-0">
        {isListening ? (
          <Mic className={cn('size-4 text-primary', hasAudio && 'animate-pulse')} />
        ) : (
          <MicOff className="size-4 text-muted-foreground/60" />
        )}
        {/* Barrita de nivel */}
        {isListening && (
          <div className="w-4 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-[width] duration-75"
              style={{ width: `${audioLevel}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          {isListening && !hasText && (
            <p className="text-xs text-muted-foreground italic">
              {hasAudio ? 'Escuchando...' : 'Esperando voz...'}
            </p>
          )}

          {hasText && (
            <p className="text-sm leading-snug text-foreground flex-1">
              {transcript}
              {interimTranscript && (
                <span className="text-muted-foreground italic"> {interimTranscript}</span>
              )}
            </p>
          )}

          {!isListening && !hasError && !hasText && (
            <Button variant="ghost" size="sm" onClick={onStart} className="h-6 text-xs px-2">
              <Mic className="size-3 mr-1" />
              Tocar para dictar
            </Button>
          )}

          {!isListening && hasError && (
            <>
              <p className="text-xs text-destructive flex items-center gap-1 flex-1 min-w-0">
                <TriangleAlert className="size-3 shrink-0" />
                {error}
              </p>
              <Button variant="ghost" size="sm" onClick={onStart} className="h-6 text-xs px-2 shrink-0">
                Reintentar
              </Button>
            </>
          )}

          {!isListening && !hasError && hasText && (
            <Button variant="ghost" size="sm" onClick={onStart} className="h-6 text-xs px-2 shrink-0">
              <Mic className="size-3" />
            </Button>
          )}
        </div>

        {isAtLimit && (
          <p className="text-[10px] text-warning">Límite de 1500 caracteres alcanzado.</p>
        )}
      </div>

      {hasText && (
        <button
          type="button" onClick={onReset}
          className="shrink-0 rounded p-0.5 text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
          title="Limpiar transcripción"
        >
          <Eraser className="size-3.5" />
        </button>
      )}
    </div>
  )
}

export default SpeechTranscriptBox
