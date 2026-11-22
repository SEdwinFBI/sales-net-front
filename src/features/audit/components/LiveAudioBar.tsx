import { Radio, Square, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { AuditUserSummary } from '../types/audit-types'

type LiveAudioBarProps = {
  sellerName: string
  live: AuditUserSummary | undefined
  volume: number
  muted: boolean
  audioLevel: number
  onVolumeChange: (value: number) => void
  onToggleMuted: () => void
  onStop: () => void
}

export default function LiveAudioBar({
  sellerName,
  live,
  volume,
  muted,
  audioLevel,
  onVolumeChange,
  onToggleMuted,
  onStop,
}: LiveAudioBarProps) {
  const pausedForSpeech = live?.mic_status === 'paused_for_speech'
  const moduleLabel = live?.activity
    ? [live.activity.section, live.activity.module].filter(Boolean).join(' · ')
    : 'Conectado'

  return (
    <Card
      role="region"
      aria-live="polite"
      aria-label="Reproducción de audio en vivo"
      className="border-primary/35 bg-primary/8 p-3.5 shadow-card sm:px-5 sm:py-4"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Radio className="size-5 animate-pulse" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                En vivo
              </span>
              <p className="truncate font-heading text-sm font-bold text-foreground sm:text-base">
                {sellerName}
              </p>
              {live?.sucursal && (
                <span className="truncate text-xs text-muted-foreground">· {live.sucursal}</span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {pausedForSpeech
                ? `En pausa temporal (${live?.mic_detail || 'Usando dictado por voz'})`
                : `Pantalla actual: ${moduleLabel}`}
              {live?.activity.entity_label ? ` — ${live.activity.entity_label}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Medidor VU en vivo */}
          <div className="flex items-center gap-2" aria-label={`Nivel de audio ${audioLevel}%`}>
            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted sm:w-28">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-75"
                style={{ width: `${muted ? 0 : Math.max(audioLevel, 4)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              onClick={onToggleMuted}
              aria-label={muted ? 'Activar sonido' : 'Silenciar reproducción'}
              title={muted ? 'Activar sonido' : 'Silenciar'}
            >
              {muted || volume === 0 ? <VolumeX /> : <Volume2 />}
            </Button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              aria-label="Volumen de escucha"
              className="h-1.5 w-20 cursor-pointer accent-primary sm:w-24"
            />
          </div>

          <Button type="button" size="sm" variant="destructive" onClick={onStop}>
            <Square className="size-3.5 fill-current" />
            Detener
          </Button>
        </div>
      </div>
    </Card>
  )
}
