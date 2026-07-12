import { ShieldAlert } from 'lucide-react'
import { Link } from 'react-router'

export default function UnauthorizePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,var(--color-secondary)_0%,var(--color-background)_100%)] px-4 py-6">
      <div className="max-w-xl rounded-2xl border border-border/70 bg-card/95 p-8 text-center shadow-sm">
        <ShieldAlert className="mx-auto size-12 text-danger" />
        <h1 className="mt-6 text-5xl font-semibold text-neutral">
          Acceso denegado
        </h1>
        <p className="mt-4 text-sm leading-7 text-neutral/80">
          Tu usuario no tiene permisos para entrar a esta sección.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold transition hover:bg-primary-complement"
          >
            <p className='text-white'>
              Ir al inicio
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
