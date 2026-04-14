import { AlertTriangle } from 'lucide-react'
import { Link, useRouteError } from 'react-router'

export default function ErrorPage() {
  const error = useRouteError() as { statusText?: string; message?: string } | undefined

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--color-primary) px-4 py-6 text-white">
      <div className="max-w-xl rounded-[36px] border border-white/10 bg-white/8 p-8 text-center shadow-[0_28px_80px_-42px_rgba(0,0,0,0.45)] backdrop-blur">
        <AlertTriangle className="mx-auto size-12 text-(--color-secondary)" />
        <h1 className="mt-6 text-5xl font-semibold">Ruta no disponible</h1>
        <p className="mt-4 text-sm leading-7 text-white/80">
          {error?.statusText ?? error?.message ?? 'La ruta solicitada no existe o fallo durante la carga.'}
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold  transition hover:opacity-90"
        >
          <p className='text-black'>
            Volver al inicio
          </p>
        </Link>
      </div>
    </div>
  )
}
