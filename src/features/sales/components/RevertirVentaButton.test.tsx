import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/lib/api'
import type { Venta } from '../types/sales'
import RevertirVentaButton from './RevertirVentaButton'

const harness = vi.hoisted(() => ({
  mutation: undefined as undefined | { mutationFn: () => Promise<unknown> },
  isPending: false,
}))

vi.mock('@/lib/api', () => ({ api: { post: vi.fn().mockResolvedValue({}) } }))
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: (options: NonNullable<typeof harness.mutation>) => {
    harness.mutation = options
    return { mutateAsync: options.mutationFn, isPending: harness.isPending }
  },
}))

// Exponer el contenido de confirmación sin depender de un portal del navegador.
vi.mock('@/components/ui/dialog', () => {
  const Content = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  return {
    Dialog: Content, DialogContent: Content, DialogDescription: Content,
    DialogFooter: Content, DialogHeader: Content, DialogTitle: Content,
  }
})

const venta: Venta = {
  id: 12, fecha: '2026-09-24', total: 500, total_neto: 500, total_descuento: 0,
  estado: 'PENDIENTE', forma_pago: 'Crédito', abonado: 200, saldo: 300,
  sucursal: { id: 1, nombre: 'Central' }, vendedor: null,
  cliente_info: { id: 4, nombre_completo: 'Cliente', telefono: '12345678', balance: 300 },
  detalles: [],
}

describe('anular venta sin anular el pago distribuido completo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    harness.isPending = false
    harness.mutation = undefined
  })

  it.each(['PENDIENTE', 'PAGADA'] as const)('habilita el botón para una venta %s con abonos', estado => {
    const html = renderToStaticMarkup(<RevertirVentaButton venta={{ ...venta, estado }} />)
    const button = html.match(/<button\b[^>]*>/)?.[0]
    expect(button).toBeDefined()
    expect(button).not.toMatch(/\sdisabled(?:=|\s|>)/)
    expect(html).not.toContain('Anula primero los abonos')
  })

  it('solicita únicamente compensar las aplicaciones de la venta seleccionada', async () => {
    renderToStaticMarkup(<RevertirVentaButton venta={venta} />)
    await harness.mutation!.mutationFn()
    expect(api.post).toHaveBeenCalledExactlyOnceWith('/admin/venta/12/revertir/', { anular_abonos: true })
  })

  it('mantiene la petición existente cuando no hay abonos', async () => {
    renderToStaticMarkup(<RevertirVentaButton venta={{ ...venta, abonado: 0 }} />)
    await harness.mutation!.mutationFn()
    expect(api.post).toHaveBeenCalledExactlyOnceWith('/admin/venta/12/revertir/', undefined)
  })

  it('explica que conserva lo aplicado a otras ventas', () => {
    const html = renderToStaticMarkup(<RevertirVentaButton venta={venta} />)
    expect(html).toContain('El importe abonado a esta venta quedará en cero')
    expect(html).toContain('Los pagos aplicados a otras ventas se conservarán')
  })

  it.each(['CANCELADA', 'REVERTIDA', 'REVERSION'] as const)('no ofrece anular una venta %s', estado => {
    expect(renderToStaticMarkup(<RevertirVentaButton venta={{ ...venta, estado }} />)).toBe('')
  })

  it('deshabilita el botón mientras se procesa la anulación', () => {
    harness.isPending = true
    const html = renderToStaticMarkup(<RevertirVentaButton venta={venta} />)
    expect(html.match(/<button\b[^>]*>/)?.[0]).toMatch(/\sdisabled(?:=|\s|>)/)
  })
})
