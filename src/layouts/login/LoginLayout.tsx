import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

export default function LoginLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {/* TODO: Aun por definir tamaño de ancho para cada tipo de pantalla */}
      <div
        className={cn(
          'w-[90%] xs:max-w-[55%] sm:max-w-[55%] md:max-w-[55%] lg:max-w-[35%] xl:max-w-[25%]',
        )}
      >
        <section className=''>
          {children}
        </section>
      </div>
    </div>
  )
}
