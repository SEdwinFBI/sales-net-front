import { ShieldAlert } from 'lucide-react'
import { Link } from 'react-router'

export default function UnauthorizePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,var(--color-secondary)_0%,#ffffff_100%)] px-4 py-6">
      <div className="max-w-xl rounded-[36px] border border-(--color-secondary) bg-white/95 p-8 text-center shadow-[0_28px_80px_-42px_rgba(53,37,205,0.24)]">
        <ShieldAlert className="mx-auto size-12 text-(--color-danger)" />
        <h1 className="mt-6 text-5xl font-semibold text-(--color-neutral)">
          Acceso denegado
        </h1>
        <p className="mt-4 text-sm leading-7 text-(--color-neutral)/80">
          Tu usuario no tiene permisos para entrar a esta seccion.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex rounded-full bg-(--color-primary) px-5 py-3 text-sm font-semibold transition hover:opacity-90"
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
