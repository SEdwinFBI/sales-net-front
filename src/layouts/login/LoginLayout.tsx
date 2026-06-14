import type { PropsWithChildren } from 'react'
import { BarChart3, Boxes, Users, Wallet } from 'lucide-react'
import logoImage from '@/assets/logo.jpg'
import SlideVertical from '@/components/motion/SlideVertical'

const features = [
  { icon: Boxes, label: 'Control de inventario por vendedor' },
  { icon: Users, label: 'Gestión de clientes y créditos' },
  { icon: Wallet, label: 'Cobros y abonos al instante' },
  { icon: BarChart3, label: 'Reportes de ventas y deudores' },
]

export default function LoginLayout({ children }: PropsWithChildren) {
  const year = new Date().getFullYear()

  return (
    <div
      className="relative flex min-h-screen flex-col bg-primary bg-cover bg-center px-4 py-8 sm:px-6"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      {/* Velo de marca para profundidad y contraste sobre el fondo */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-primary-complement/90 via-primary/75 to-primary-complement/95"
      />

      {/* Zona central */}
      <div className="relative flex flex-1 items-center justify-center">
        <SlideVertical className="w-full max-w-5xl">
          <div className="grid w-full overflow-hidden rounded-3xl border border-white/20 bg-white/5 shadow-2xl backdrop-blur-sm lg:grid-cols-[1.1fr_1fr]">
            {/* Panel de marca — solo desktop */}
            <aside className="relative hidden flex-col justify-center gap-10 p-10 text-white xl:p-14 lg:flex">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center overflow-hidden rounded-xl border border-white/25 bg-white/15 ring-1 ring-white/10">
                  <img src={logoImage} alt="Logo Distribuidora MZ" className="h-full w-full object-contain p-1" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em]">Distribuidora MZ</p>
                  <p className="text-xs text-white/70">Gestión de ventas</p>
                </div>
              </div>

              <div className="max-w-md">
                <h2 className="font-heading text-3xl font-semibold leading-tight xl:text-4xl">
                  Sistema de gestión de ventas
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-white/85">
                  Plataforma interna de Distribuidora MZ para administrar la operación diaria.
                </p>

                <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                  Módulos del sistema
                </p>
                <ul className="mt-3.5 space-y-3.5">
                  {features.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-3 text-sm text-white/90">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Lado del formulario */}
            <main className="flex flex-col justify-center bg-card p-6 sm:p-10 lg:p-12">
              {/* Marca compacta — solo mobile */}
              <div className="mb-6 flex flex-col items-center gap-3 lg:hidden">
                <div className="flex size-14 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                  <img src={logoImage} alt="Logo Distribuidora MZ" className="h-full w-full object-contain p-1.5" />
                </div>
                <div className="text-center leading-tight">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Distribuidora MZ</p>
                  <p className="text-xs text-muted-foreground">Gestión de ventas</p>
                </div>
              </div>

              <div className="mx-auto w-full max-w-sm">{children}</div>
            </main>
          </div>
        </SlideVertical>
      </div>

      {/* Footer */}
      <footer className="relative self-center pt-6 text-center text-[12px] text-white/70">
        &copy; {year} Code QX.  Código que construye el futuro, Todos los derechos reservados.
      </footer>
    </div>
  )
}
