import type { PropsWithChildren } from 'react'
import { BarChart3, Boxes, Moon, ShieldCheck, Sun, Users, Wallet } from 'lucide-react'
import logoImage from '@/assets/logo.jpg'
import SlideVertical from '@/components/motion/SlideVertical'
import { useThemeStore } from '@/features/core/store/theme-store'

const features = [
  { icon: Boxes, title: 'Inventario vivo', label: 'Control de existencias por sucursal' },
  { icon: Users, title: 'Clientes y créditos', label: 'Saldos, límites y precios pactados' },
  { icon: Wallet, title: 'Caja y cobros', label: 'Abonos y arqueos al instante' },
  { icon: BarChart3, title: 'Analítica comercial', label: 'Reportes de ventas y deudores' },
]

export default function LoginLayout({ children }: PropsWithChildren) {
  const year = new Date().getFullYear()
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden bg-primary bg-cover bg-center px-4 py-6 sm:px-6 sm:py-8"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      {/* Velo de marca para profundidad y contraste sobre el fondo */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-primary-complement/90 via-primary/78 to-primary-complement/95"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.55) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Zona central */}
      <div className="relative flex flex-1 items-center justify-center">
        <SlideVertical className="w-full max-w-[64rem]">
          <div className="grid w-full overflow-hidden rounded-[28px] border border-white/22 bg-white/8 shadow-2xl backdrop-blur-md lg:grid-cols-[1.12fr_1fr]">
            {/* Panel de marca — solo desktop */}
            <aside className="relative hidden flex-col justify-between gap-10 p-10 text-white xl:p-12 lg:flex">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex size-12 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-md ring-1 ring-white/30">
                    <img src={logoImage} alt="Logo Distribuidora MZ" className="h-full w-full object-contain" />
                  </div>
                  <div className="leading-tight">
                    <p className="font-heading text-sm font-bold uppercase tracking-[0.2em] text-white">
                      Distribuidora MZ
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-white/70">
                      Plataforma SalesNet
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/85">
                  <ShieldCheck className="size-3.5 text-emerald-300" aria-hidden="true" />
                  Acceso seguro
                </span>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <h2 className="font-heading text-3xl font-bold leading-[1.12] tracking-tight text-white xl:text-[2.35rem]">
                    Operación comercial con precisión en cada sucursal.
                  </h2>
                  <p className="max-w-md text-sm leading-relaxed text-white/72">
                    Centraliza ventas en mostrador, precios por cliente, cobranza y existencias en tiempo real.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {features.map(({ icon: Icon, title, label }) => (
                    <div
                      key={title}
                      className="rounded-2xl border border-white/18 bg-white/10 p-3.5 backdrop-blur-xs transition-colors hover:bg-white/15"
                    >
                      <span className="mb-2.5 inline-flex size-8 items-center justify-center rounded-xl bg-white/18 text-white">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <p className="text-xs font-semibold text-white">{title}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-white/80">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[11px] font-medium text-white/50">
                Guatemala · Punto de venta &amp; control administrativo
              </p>
            </aside>

            {/* Lado del formulario */}
            <main className="relative flex flex-col justify-center bg-card p-6 sm:p-10 lg:p-12">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                className="absolute top-4 right-4 inline-flex size-9 cursor-pointer items-center justify-center rounded-xl border border-border/80 bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {theme === 'dark' ? (
                  <Sun className="size-4 text-amber-400" aria-hidden="true" />
                ) : (
                  <Moon className="size-4" aria-hidden="true" />
                )}
              </button>

              {/* Marca compacta — solo mobile */}
              <div className="mb-6 flex flex-col items-center gap-2.5 lg:hidden">
                <div className="flex size-14 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white p-1.5 shadow-sm">
                  <img src={logoImage} alt="Logo Distribuidora MZ" className="h-full w-full object-contain" />
                </div>
                <div className="text-center leading-tight">
                  <p className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-primary">
                    Distribuidora MZ
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Plataforma SalesNet</p>
                </div>
              </div>

              <div className="mx-auto w-full max-w-sm">{children}</div>
            </main>
          </div>
        </SlideVertical>
      </div>

      {/* Footer */}
      <footer className="relative self-center pt-6 text-center text-[11px] font-medium text-white/65">
        &copy; {year} Code QX · Código que construye el futuro. Todos los derechos reservados.
      </footer>
    </div>
  )
}
