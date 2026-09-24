import axios from 'axios'
import { TriangleAlert } from 'lucide-react'
import { getPasskeyErrorMessage } from '../utils/passkey-error'

export default function PasskeyErrorAlert({ error }: { error: unknown }) {
  if (!error) return null
  const limited = axios.isAxiosError(error) && error.response?.status === 429

  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
      <div className="min-w-0 space-y-1">
        <p className="font-semibold text-destructive">{limited ? 'Límite de intentos alcanzado' : 'No se pudo completar la operación'}</p>
        <p className="whitespace-pre-line break-words text-muted-foreground">{getPasskeyErrorMessage(error)}</p>
      </div>
    </div>
  )
}
