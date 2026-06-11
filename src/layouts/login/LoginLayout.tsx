import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

export default function LoginLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-8">
      {/* TODO: Aun por definir tamaño de ancho para cada tipo de pantalla */}
      <div
        className={cn(
          'w-full max-w-sm',
        )}
      >
        <section className=''>
          {children}
        </section>
      </div>
    </div>
  )
}
