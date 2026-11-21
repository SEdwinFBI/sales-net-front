import type { MicPermissionStatus } from '@/features/core/store/useMicArbitratorStore'

export type { MicPermissionStatus }

export type AuditActivity = {
  route: string
  section: string | null
  module: string
  detail: string | null
  entity_type: string | null
  entity_id: number | null
  entity_label: string | null
  cart_open: boolean
  cart_count: number
  cart_total: number
  active_dialog: string | null
  agent_listening: boolean
  updated_at: number
}

export type AuditUserSummary = {
  user_id: number
  username: string
  full_name: string
  role: string | null
  connections: number
  sucursal: string | null
  activity: AuditActivity
  mic_status: MicPermissionStatus
  mic_detail: string | null
  audio_streaming: boolean
  audio_listeners: number
  speaking: boolean
  connected_at: number
  last_seen: number
}

export type AuditSnapshotMessage = {
  type: 'snapshot'
  online: Record<string, number>
  users?: Record<string, AuditUserSummary>
}

export type AuditPresenceUpdateMessage = {
  type: 'presence.update'
  user_id: number
  username?: string
  status: 'online' | 'offline'
  connections: number
  summary?: AuditUserSummary | null
}
