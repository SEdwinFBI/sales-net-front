import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { Link, useRouteError } from 'react-router'

export default function ErrorPage() {
  const error = useRouteError() as { statusText?: string; message?: string } | undefined

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-8 text-center shadow-elevated sm:p-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive">
          <AlertTriangle className="size-7" aria-hidden="true" />
        </div>
        <h1 className="mt-6 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Ruta no disponible
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {error?.statusText ?? error?.message ?? 'La ruta solicitada no existe o ocurrió un problema durante la carga.'}
        </p>
        <Link
          to="/"
          className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-complement focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
