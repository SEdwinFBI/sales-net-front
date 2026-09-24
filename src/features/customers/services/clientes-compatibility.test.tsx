import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/lib/api'
import ClienteInfo from '../components/ClienteInfo'
import type { Cliente, CreateClientePayload } from '../types/clientes'
import { createCliente, getClienteById, getClientes, updateCliente } from './clientes-service'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

const cliente: Cliente = {
  permitir_credito: true,
  id: 12, nombre_completo: 'Cliente de prueba', direccion: 'Zona 1',
  telefono: '12345678', balance: 150, activo: true, fecha_creacion: '2026-09-21',
}

describe('clientes con programación individual', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    [cliente],
    { count: 1, results: [cliente] },
  ])('acepta clientes sin días en el listado, conservando filtros y paginación', async (data) => {
    vi.mocked(api.get).mockResolvedValue({ data: { status: 'success', data } })
    await expect(getClientes(2, 10, 'Cliente', true)).resolves.toEqual({ count: 1, results: [cliente] })
    expect(api.get).toHaveBeenCalledWith('/admin/clientes/', {
      params: { page: 2, page_size: 10, search: 'Cliente', activo: true },
    })
  })

  it('consulta y renderiza el detalle sin exigir el campo eliminado', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { status: 'success', data: cliente } })
    const result = await getClienteById(cliente.id)
    const html = renderToStaticMarkup(<ClienteInfo cliente={result} />)
    expect(html).toContain('Cliente de prueba')
    expect(html).toContain('Q150.00')
    expect(html).toContain('Activo')
    expect(html).toContain('Días de notificación')
    expect(html).toContain('Sin asignar')
    expect(result).not.toHaveProperty('dias_notificacion')
  })

  it('guarda los días individuales al crear y editar sin modificar otros campos', async () => {
    const payload: CreateClientePayload = {
      nombre_completo: cliente.nombre_completo, direccion: cliente.direccion,
      telefono: cliente.telefono, balance: cliente.balance, dias_notificacion: [1, 3],
    }
    vi.mocked(api.post).mockResolvedValue({ data: { status: 'success', data: { ...cliente, dias_notificacion: [1, 3] } } })
    vi.mocked(api.put).mockResolvedValue({ data: { status: 'success', data: { ...cliente, dias_notificacion: [5] } } })
    await createCliente(payload)
    const result = await updateCliente(cliente.id, { dias_notificacion: [5] })
    expect(api.post).toHaveBeenCalledWith('/admin/clientes/', payload)
    expect(api.put).toHaveBeenCalledWith('/admin/clientes/12/', { dias_notificacion: [5] })
    expect(renderToStaticMarkup(<ClienteInfo cliente={result.data} />)).toContain('Viernes')
    expect(result.data.balance).toBe(cliente.balance)
  })

  it('crea y edita conservando saldo y estado, sin enviar días individuales', async () => {
    const payload: CreateClientePayload = {
      nombre_completo: cliente.nombre_completo, direccion: cliente.direccion,
      telefono: cliente.telefono, balance: cliente.balance, activo: cliente.activo,
    }
    vi.mocked(api.post).mockResolvedValue({ data: { status: 'success', data: cliente } })
    vi.mocked(api.put).mockResolvedValue({ data: { status: 'success', data: { ...cliente, balance: 75, activo: false } } })
    await createCliente(payload)
    const result = await updateCliente(cliente.id, { balance: 75, activo: false })
    expect(api.post).toHaveBeenCalledWith('/admin/clientes/', payload)
    expect(vi.mocked(api.post).mock.calls[0][1]).not.toHaveProperty('dias_notificacion')
    expect(api.put).toHaveBeenCalledWith('/admin/clientes/12/', { balance: 75, activo: false })
    expect(result.data.balance).toBe(75)
    expect(result.data.activo).toBe(false)
  })
})
