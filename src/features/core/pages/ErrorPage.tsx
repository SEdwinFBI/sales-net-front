import { AlertTriangle } from 'lucide-react'
import { Link, useRouteError } from 'react-router'

export default function ErrorPage() {
  const error = useRouteError() as { statusText?: string; message?: string } | undefined

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-6">
      <div className="max-w-xl rounded-2xl border border-border/70 bg-card/95 p-8 text-center shadow-sm">
        <AlertTriangle className="mx-auto size-12 text-danger" />
        <h1 className="mt-6 text-3xl font-semibold text-neutral sm:text-4xl">Ruta no disponible</h1>
        <p className="mt-4 text-sm leading-7 text-neutral/75">
          {error?.statusText ?? error?.message ?? 'La ruta solicitada no existe o fallo durante la carga.'}
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-complement"
        >
          <p>
            Volver al inicio
          </p>
        </Link>
      </div>
    </div>
  )
}
