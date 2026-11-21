import { useMemo, useState } from 'react'
import { Headphones, Mic, MicOff, Radio, Search, Users, Wifi, WifiOff, X } from 'lucide-react'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useSucursales } from '@/features/admin/branches/hooks/useSucursales'
import { useUsuarios } from '@/features/admin/users/hooks/useUsuarios'
import { useAuthStore } from '@/features/core/store/auth-store'
import AuditUserCard from '../components/AuditUserCard'
import LiveAudioBar from '../components/LiveAudioBar'
import { useAdminAudit } from '../hooks/useAdminAudit'

type StatusFilter = 'all' | 'online' | 'offline'
type RoleFilter = 'vendedor' | 'all' | 'admin'
type MicFilter = 'all' | 'granted' | 'denied' | 'pending'

export default function AuditoriaPage() {
  const token = useAuthStore((state) => state.token)
  const { data: usuarios, isLoading: loadingUsers } = useUsuarios()
  const { data: sucursales } = useSucursales()
  const {
    liveUsers,
    presenceConnected,
    audioConnected,
    listeningSellerId,
    volume,
    muted,
    audioLevel,
    startListening,
    stopListening,
    setVolume,
    toggleMuted,
  } = useAdminAudit(token)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('vendedor')
  const [micFilter, setMicFilter] = useState<MicFilter>('all')

  const branchNames = useMemo(() => {
    const map = new Map<number, string>()
    for (const s of sucursales) {
      map.set(s.id, s.nombre)
    }
    return map
  }, [sucursales])

  const stats = useMemo(() => {
    const sellers = usuarios.filter((u) => u.role === 'vendedor')
    let onlineCount = 0
    let onlineSellers = 0
    let micGranted = 0
    let micDenied = 0

    for (const u of usuarios) {
      const live = liveUsers.get(u.id)
      const isOnline = Boolean(live && live.connections > 0)
      if (!isOnline || !live) continue
      onlineCount++
      if (u.role === 'vendedor') {
        onlineSellers++
        if (live.mic_status === 'granted' || live.mic_status === 'paused_for_speech') {
          micGranted++
        } else if (live.mic_status === 'denied') {
          micDenied++
        }
      }
    }

    return {
      totalUsers: usuarios.length,
      totalSellers: sellers.length,
      onlineCount,
      onlineSellers,
      micGranted,
      micDenied,
    }
  }, [usuarios, liveUsers])

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()

    const list = usuarios.filter((u) => {
      const live = liveUsers.get(u.id)
      const isOnline = Boolean(live && live.connections > 0)

      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (statusFilter === 'online' && !isOnline) return false
      if (statusFilter === 'offline' && isOnline) return false

      if (micFilter !== 'all') {
        if (!isOnline || !live || u.role !== 'vendedor') return false
        if (micFilter === 'granted' && live.mic_status !== 'granted') return false
        if (micFilter === 'denied' && live.mic_status !== 'denied') return false
        if (
          micFilter === 'pending' &&
          live.mic_status !== 'prompt' &&
          live.mic_status !== 'paused_for_speech' &&
          live.mic_status !== 'error' &&
          live.mic_status !== 'unsupported' &&
          live.mic_status !== 'unknown'
        ) {
          return false
        }
      }

      if (term) {
        const branchLabel = live?.sucursal || u.sucursales.map((id) => branchNames.get(id) ?? '').join(' ')
        const haystack = [
          u.fullName,
          u.username,
          branchLabel,
          live?.activity.module,
          live?.activity.entity_label,
          live?.activity.detail,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        if (!haystack.includes(term)) return false
      }

      return true
    })

    // Prioriza: en escucha actual -> vendedores online -> admins online -> offline.
    list.sort((a, b) => {
      if (a.id === listeningSellerId && b.id !== listeningSellerId) return -1
      if (b.id === listeningSellerId && a.id !== listeningSellerId) return 1

      const aOnline = Boolean(liveUsers.get(a.id)?.connections)
      const bOnline = Boolean(liveUsers.get(b.id)?.connections)
      if (aOnline !== bOnline) return aOnline ? -1 : 1

      if (a.role !== b.role) {
        if (a.role === 'vendedor') return -1
        if (b.role === 'vendedor') return 1
      }

      return (a.fullName || a.username).localeCompare(b.fullName || b.username, 'es')
    })

    return list
  }, [usuarios, liveUsers, search, statusFilter, roleFilter, micFilter, branchNames, listeningSellerId])

  const activeListeningUser = useMemo(() => {
    if (listeningSellerId === null) return null
    const user = usuarios.find((u) => u.id === listeningSellerId)
    const live = liveUsers.get(listeningSellerId)
    return {
      name: user?.fullName || user?.username || live?.full_name || `Vendedor #${listeningSellerId}`,
      live,
    }
  }, [listeningSellerId, usuarios, liveUsers])

  const hasFilters =
    search.trim().length > 0 || statusFilter !== 'all' || roleFilter !== 'vendedor' || micFilter !== 'all'

  return (
    <PageTemplateSimple
      title="Auditoría en vivo"
      description="Supervisa en tiempo real la actividad, estado del permiso de micrófono y audio en vivo de los vendedores."
    >
      <div className="space-y-4">
        {/* Cabecera de estado de conexión */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-heading text-lg font-bold text-foreground sm:text-xl">
              Auditoría en vivo
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Actividad en tiempo real por pantalla y audio efímero bajo demanda (sin grabación ni almacenamiento).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                presenceConnected
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
              }
            >
              {presenceConnected ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
              {presenceConnected ? 'Telemetría en línea' : 'Reconectando telemetría...'}
            </Badge>
            <Badge
              variant="outline"
              className={
                audioConnected
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border bg-muted text-muted-foreground'
              }
            >
              <Radio className="size-3.5" />
              {audioConnected ? 'Canal de audio listo' : 'Conectando audio...'}
            </Badge>
          </div>
        </div>

        {/* Barra de reproducción activa */}
        {activeListeningUser && (
          <LiveAudioBar
            sellerName={activeListeningUser.name}
            live={activeListeningUser.live}
            volume={volume}
            muted={muted}
            audioLevel={audioLevel}
            onVolumeChange={setVolume}
            onToggleMuted={toggleMuted}
            onStop={stopListening}
          />
        )}

        {/* KPIs en vivo */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="gap-1 p-4">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Conectados ahora</span>
              <Users className="size-4 text-primary" aria-hidden="true" />
            </div>
            <p className="font-heading text-2xl font-bold tabular-nums text-foreground">
              {stats.onlineCount}{' '}
              <span className="text-sm font-normal text-muted-foreground">/ {stats.totalUsers}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.onlineSellers} {stats.onlineSellers === 1 ? 'vendedor activo' : 'vendedores activos'}
            </p>
          </Card>

          <Card className="gap-1 p-4">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Micrófonos activos</span>
              <Mic className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            </div>
            <p className="font-heading text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
              {stats.micGranted}
            </p>
            <p className="text-xs text-muted-foreground">
              Vendedores con permiso concedido
            </p>
          </Card>

          <Card className="gap-1 p-4">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Permiso denegado</span>
              <MicOff className="size-4 text-destructive" aria-hidden="true" />
            </div>
            <p className="font-heading text-2xl font-bold tabular-nums text-destructive">
              {stats.micDenied}
            </p>
            <p className="text-xs text-muted-foreground">
              Bloquearon el micrófono en navegador
            </p>
          </Card>

          <Card className="gap-1 p-4">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Escuchando ahora</span>
              <Headphones className="size-4 text-primary" aria-hidden="true" />
            </div>
            <p className="truncate font-heading text-lg font-bold text-foreground sm:text-xl">
              {activeListeningUser ? activeListeningUser.name : 'Ninguno'}
            </p>
            <p className="text-xs text-muted-foreground">
              Un vendedor a la vez (cambio automático)
            </p>
          </Card>
        </div>

        {/* Barra de filtros */}
        <Card className="p-3.5 sm:p-4">
          <div className="grid gap-2.5 md:grid-cols-[minmax(220px,1fr)_160px_160px_190px_auto]">
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar vendedor, sucursal, pantalla o cliente..."
                className="pl-9"
              />
            </div>

            <Select
              aria-label="Filtrar por estado de conexión"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">Todos los estados</option>
              <option value="online">En línea</option>
              <option value="offline">Desconectados</option>
            </Select>

            <Select
              aria-label="Filtrar por rol"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            >
              <option value="vendedor">Solo vendedores</option>
              <option value="all">Todos los roles</option>
              <option value="admin">Solo administradores</option>
            </Select>

            <Select
              aria-label="Filtrar por permiso de micrófono"
              value={micFilter}
              onChange={(e) => setMicFilter(e.target.value as MicFilter)}
            >
              <option value="all">Todos los permisos mic</option>
              <option value="granted">Micrófono permitido</option>
              <option value="denied">Permiso denegado</option>
              <option value="pending">Pendiente / Pausa / Error</option>
            </Select>

            {hasFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('all')
                  setRoleFilter('vendedor')
                  setMicFilter('all')
                }}
              >
                <X />
                Limpiar
              </Button>
            )}
          </div>
        </Card>

        {/* Listado de usuarios */}
        {loadingUsers ? (
          <EmptyState title="Cargando usuarios para auditoría..." />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin usuarios con los filtros actuales"
            description="Ajusta el filtro de rol, estado o permiso de micrófono para ver otros usuarios."
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {filteredUsers.map((usuario) => (
              <AuditUserCard
                key={usuario.id}
                user={usuario}
                live={liveUsers.get(usuario.id)}
                branchNames={branchNames}
                isListeningThis={listeningSellerId === usuario.id}
                audioConnected={audioConnected}
                onListen={startListening}
                onStop={stopListening}
              />
            ))}
          </div>
        )}
      </div>
    </PageTemplateSimple>
  )
}
