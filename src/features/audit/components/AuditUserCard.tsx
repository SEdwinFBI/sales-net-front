import {
  Activity,
  Bot,
  Headphones,
  Mic,
  MicOff,
  Monitor,
  ShoppingCart,
  Square,
  Store,
  UserRound,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Usuario } from '@/features/admin/users/types/usuario-types'
import { formatCurrency } from '@/helpers/money'
import { cn } from '@/lib/utils'
import type { AuditUserSummary, MicPermissionStatus } from '../types/audit-types'

const DIALOG_LABELS: Record<string, string> = {
  checkout: 'En diálogo de cobro',
  summary: 'Viendo resumen de venta',
  'clear-cart': 'Vaciando carrito',
  'customer-prices': 'Viendo precios de cliente',
  'existencias-tiendas': 'Consultando existencias',
}

function formatRelativeTime(timestampSec: number): string {
  if (!timestampSec) return 'Hace un momento'
  const diffSec = Math.max(0, Math.round(Date.now() / 1000 - timestampSec))
  if (diffSec < 10) return 'En este instante'
  if (diffSec < 60) return `Hace ${diffSec} s`
  const mins = Math.floor(diffSec / 60)
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  return `Hace ${hours} h`
}

function getMicBadgeMeta(
  status: MicPermissionStatus,
  detail: string | null,
  speaking: boolean,
  isOnline: boolean,
  isSeller: boolean,
) {
  if (!isSeller) {
    return {
      label: 'Rol administrativo',
      sub: 'No transmite audio',
      className: 'border-border bg-muted/50 text-muted-foreground',
      icon: 'off' as const,
    }
  }
  if (!isOnline) {
    return {
      label: 'Sin conexión',
      sub: 'Micrófono inactivo',
      className: 'border-border bg-muted/50 text-muted-foreground',
      icon: 'off' as const,
    }
  }
  switch (status) {
    case 'granted':
      return {
        label: speaking ? 'Micrófono permitido · Voz detectada' : 'Micrófono permitido',
        sub: detail ?? 'Listo para escuchar en vivo',
        className: 'border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
        icon: 'on' as const,
      }
    case 'denied':
      return {
        label: 'Permiso denegado',
        sub: detail ?? 'Bloqueado desde el navegador',
        className: 'border-destructive/35 bg-destructive/12 text-destructive',
        icon: 'off' as const,
      }
    case 'paused_for_speech':
      return {
        label: 'Pausado por dictado',
        sub: detail ?? 'Usando reconocimiento de voz',
        className: 'border-primary/30 bg-primary/12 text-primary',
        icon: 'on' as const,
      }
    case 'prompt':
      return {
        label: 'Permiso pendiente',
        sub: detail ?? 'Esperando aceptación del usuario',
        className: 'border-amber-500/35 bg-amber-500/14 text-amber-800 dark:text-amber-300',
        icon: 'on' as const,
      }
    case 'unsupported':
      return {
        label: 'Sin soporte de audio',
        sub: detail ?? 'Navegador no compatible o sin HTTPS',
        className: 'border-border bg-muted text-muted-foreground',
        icon: 'off' as const,
      }
    case 'error':
      return {
        label: 'Error de micrófono',
        sub: detail ?? 'Hardware no disponible',
        className: 'border-destructive/30 bg-destructive/10 text-destructive',
        icon: 'off' as const,
      }
    default:
      return {
        label: 'Comprobando permiso...',
        sub: 'Esperando reporte del navegador',
        className: 'border-border bg-muted/60 text-muted-foreground',
        icon: 'on' as const,
      }
  }
}

type AuditUserCardProps = {
  user: Usuario
  live: AuditUserSummary | undefined
  branchNames: Map<number, string>
  isListeningThis: boolean
  audioConnected: boolean
  onListen: (sellerId: number) => void
  onStop: () => void
}

export default function AuditUserCard({
  user,
  live,
  branchNames,
  isListeningThis,
  audioConnected,
  onListen,
  onStop,
}: AuditUserCardProps) {
  const isOnline = Boolean(live && live.connections > 0)
  const isSeller = user.role === 'vendedor'
  const displayName = user.fullName || user.username

  const assignedBranches = user.sucursales
    .map((id) => branchNames.get(id))
    .filter((name): name is string => Boolean(name))
  const branchText = live?.sucursal || (assignedBranches.length > 0 ? assignedBranches.join(', ') : null)

  const micMeta = getMicBadgeMeta(
    live?.mic_status ?? 'unknown',
    live?.mic_detail ?? null,
    Boolean(live?.speaking),
    isOnline,
    isSeller,
  )

  const canListen = isOnline && isSeller && live?.mic_status === 'granted' && audioConnected

  const activity = live?.activity
  const screenTitle = activity
    ? [activity.section, activity.module].filter(Boolean).join(' · ')
    : null
  const dialogLabel = activity?.active_dialog
    ? DIALOG_LABELS[activity.active_dialog] ?? activity.active_dialog
    : null

  return (
    <Card
      className={cn(
        'gap-3 p-4 transition-all duration-150',
        isListeningThis && 'border-primary/50 ring-2 ring-primary/20',
        !isOnline && 'opacity-75',
      )}
    >
      {/* Cabecera: identidad + estado */}
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5 shrink-0">
              {isOnline && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={cn(
                  'relative inline-flex size-2.5 rounded-full',
                  isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/35',
                )}
              />
            </span>
            <h3 className="truncate font-heading text-sm font-bold text-foreground sm:text-base">
              {displayName}
            </h3>
            <Badge
              variant={isSeller ? 'secondary' : 'default'}
              className="px-2 py-0 text-[10px] font-semibold uppercase tracking-wide"
            >
              {user.role ?? 'Sin rol'}
            </Badge>
            {live && live.connections > 1 && (
              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                {live.connections} sesiones
              </Badge>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>@{user.username}</span>
            {branchText && (
              <span className="inline-flex items-center gap-1 font-medium text-foreground/85">
                <Store className="size-3.5 text-primary/75" aria-hidden="true" />
                {branchText}
              </span>
            )}
            {isOnline && activity && (
              <span className="text-[11px] text-muted-foreground/80">
                {formatRelativeTime(activity.updated_at)}
              </span>
            )}
          </div>
        </div>

        {/* Botón escucha en vivo */}
        {isSeller && (
          <div className="shrink-0">
            {isListeningThis ? (
              <Button type="button" size="sm" variant="destructive" onClick={onStop}>
                <Square className="size-3.5 fill-current" />
                Detener
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant={canListen ? 'default' : 'outline'}
                disabled={!canListen}
                title={
                  canListen
                    ? 'Escuchar micrófono en vivo'
                    : micMeta.sub
                }
                onClick={() => onListen(user.id)}
              >
                <Headphones className="size-4" />
                {canListen
                  ? 'Escuchar'
                  : !isOnline
                    ? 'Sin conexión'
                    : live?.mic_status === 'denied'
                      ? 'Denegado'
                      : live?.mic_status === 'paused_for_speech'
                        ? 'En dictado'
                        : 'No disponible'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Estado de permiso de micrófono */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold',
            micMeta.className,
          )}
        >
          {micMeta.icon === 'off' ? (
            <MicOff className="size-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <Mic className={cn('size-3.5 shrink-0', live?.speaking && 'animate-pulse')} aria-hidden="true" />
          )}
          <span>{micMeta.label}</span>
        </span>
        {isOnline && isSeller && (
          <span className="text-[11px] text-muted-foreground">{micMeta.sub}</span>
        )}
        {live?.audio_streaming && (
          <Badge className="border-primary/30 bg-primary/12 text-primary">
            <Activity className="size-3" />
            Transmitiendo en vivo
          </Badge>
        )}
      </div>

      {/* Telemetría de actividad en vivo */}
      {isOnline && activity ? (
        <div className="rounded-xl border border-border/75 bg-muted/35 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Monitor className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="text-xs font-semibold text-foreground">
              {screenTitle || 'En aplicación'}
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              ({activity.route})
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {activity.entity_label && (
              <Badge variant="outline" className="border-primary/30 bg-card text-foreground">
                <UserRound className="size-3 text-primary" />
                Cliente: {activity.entity_label}
              </Badge>
            )}

            {activity.detail && (
              <Badge variant="outline" className="bg-card text-muted-foreground">
                {activity.detail}
              </Badge>
            )}

            {activity.cart_open ? (
              <Badge className="border-amber-500/35 bg-amber-500/15 text-amber-800 dark:text-amber-300">
                <ShoppingCart className="size-3" />
                Carrito abierto · {activity.cart_count} {activity.cart_count === 1 ? 'ud' : 'uds'} ·{' '}
                {formatCurrency(activity.cart_total)}
              </Badge>
            ) : activity.cart_count > 0 ? (
              <Badge variant="outline" className="bg-card text-muted-foreground">
                <ShoppingCart className="size-3" />
                {activity.cart_count} {activity.cart_count === 1 ? 'ud' : 'uds'} en carrito
              </Badge>
            ) : null}

            {dialogLabel && (
              <Badge className="border-indigo-500/30 bg-indigo-500/12 text-indigo-700 dark:text-indigo-300">
                {dialogLabel}
              </Badge>
            )}

            {activity.agent_listening && (
              <Badge className="border-primary/35 bg-primary/14 text-primary">
                <Bot className="size-3 animate-pulse" />
                Usando Agente IA
              </Badge>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Usuario desconectado. Sin sesión activa en este momento.
        </p>
      )}
    </Card>
  )
}
