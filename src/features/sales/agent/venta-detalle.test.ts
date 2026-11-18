import { describe, expect, it } from 'vitest'
import type { DetalleVenta, Venta } from '../types/sales'
import { describeVentaDetalle } from './venta-detalle'

const linea = (id: number, extra: Partial<DetalleVenta> = {}): DetalleVenta => ({
  id,
  id_variante: 100 + id,
  id_talla: 2,
  precio_unitario: 125,
  cantidad: 2,
  descuento: 10,
  total: 250,
  total_neto: 240,
  articulo: 'Huipil Coban',
  talla: 'M',
  ...extra,
})

const venta = (detalles: DetalleVenta[]): Venta => ({
  id: 44,
  fecha: '2026-11-10T15:30:00',
  total: 250,
  total_neto: 240,
  total_descuento: 10,
  estado: 'PENDIENTE',
  forma_pago: 'CREDITO',
  abonado: 100,
  saldo: 140,
  observacion: 'Entregar el viernes',
  foto_url: 'https://cdn.example.com/foto.jpg',
  sucursal: { id: 3, nombre: 'Xela centro' },
  vendedor: { id: 8, username: 'mlopez', full_name: 'Maria Lopez' },
  cliente_info: { id: 12, nombre_completo: 'Rosa Ixcoy', telefono: '55551234', balance: 140 },
  detalles,
})

describe('describeVentaDetalle', () => {
  it('devuelve los articulos y totales que se ven al expandir la venta', () => {
    expect(describeVentaDetalle(venta([linea(1)]))).toEqual({
      venta_id: 44,
      fecha: '2026-11-10T15:30:00',
      cliente: 'Rosa Ixcoy',
      vendedor: 'Maria Lopez',
      sucursal: 'Xela centro',
      estado: 'PENDIENTE',
      forma_pago: 'CREDITO',
      total: 250,
      descuento: 10,
      total_neto: 240,
      abonado: 100,
      saldo: 140,
      observacion: 'Entregar el viernes',
      total_articulos: 1,
      articulos: [{ articulo: 'Huipil Coban', talla: 'M', cantidad: 2, precio_unitario: 125, descuento: 10, total_neto: 240 }],
    })
  })

  it('no incluye la foto ni el telefono del cliente', () => {
    const text = JSON.stringify(describeVentaDetalle(venta([linea(1)])))
    expect(text).not.toContain('foto')
    expect(text).not.toContain('55551234')
  })

  it('acota los articulos a 30 y lo indica', () => {
    const detalle = describeVentaDetalle(venta(Array.from({ length: 35 }, (_, i) => linea(i + 1))))
    expect(detalle.articulos).toHaveLength(30)
    expect(detalle).toMatchObject({ total_articulos: 35, mostrando: 30 })
  })
})
