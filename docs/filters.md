# Filtros backend para reporte de deudores

## Contexto del frontend

El reporte actual de deudores consume:

- `GET /reportes/deudores`
- `GET /reportes/deudores?output=pdf`

El response esperado no debe cambiar:

```ts
{
  status: 'success',
  data: {
    clientes: {
      id: number
      nombre_completo: string
      telefono: string
      balance: number
      ultima_compra: string | null
      total_ventas_pendientes: number
      total_abonado: number
    }[],
    resumen: {
      total_deudores: number
      total_adeudado: number
    }
  }
}
```

`/reportes/ventas` y `/ventas/historial` ya trabajan con query params. Para deudores conviene usar el mismo patron: los filtros llegan por query string, se aplican en backend y el PDF usa exactamente los mismos filtros mas `output=pdf`.

## Query params a soportar

### Obligatorios para paridad con historial/ventas

| Param | Tipo | Ejemplo | Logica backend |
| --- | --- | --- | --- |
| `fecha_desde` | `YYYY-MM-DD` | `2026-07-01` | Incluir deudas originadas en ventas con `fecha >= fecha_desde`. |
| `fecha_hasta` | `YYYY-MM-DD` | `2026-07-03` | Incluir deudas originadas en ventas con `fecha <= fecha_hasta`. Si la fecha de venta tiene hora, aplicar fin del dia. |
| `id_vendedor` | number | `4` | Incluir solo ventas pendientes del vendedor indicado. |

### Recomendados para completar filtros utiles de deudores

| Param | Tipo | Ejemplo | Logica backend |
| --- | --- | --- | --- |
| `id_cliente` | number | `18` | Incluir solo el cliente indicado. |
| `search` | string | `mendez` | Buscar por nombre completo, telefono o id del cliente. |
| `saldo_min` | number | `100` | Luego de agregar la deuda por cliente, incluir clientes con saldo pendiente `>= saldo_min`. |
| `saldo_max` | number | `1000` | Luego de agregar la deuda por cliente, incluir clientes con saldo pendiente `<= saldo_max`. |
| `output` | `json`/`pdf` | `pdf` | Si es `pdf`, generar el PDF con los mismos filtros aplicados. Si no viene, devolver JSON. |

## Semantica esperada

1. El reporte debe seguir mostrando solo clientes con deuda activa: saldo pendiente mayor a `0`.
2. Los filtros de fecha deben aplicarse sobre la fecha de la venta que genero la deuda, no sobre la fecha de creacion del cliente.
3. `total_ventas_pendientes`, `total_abonado`, `balance`, `ultima_compra`, `resumen.total_deudores` y `resumen.total_adeudado` deben calcularse despues de aplicar los filtros.
4. `ultima_compra` debe salir de la ultima venta pendiente dentro del rango filtrado.
5. Si no se manda ningun filtro, el endpoint debe mantener el comportamiento actual.
6. Si se manda solo `fecha_desde` o solo `fecha_hasta`, aplicar filtro abierto por el otro lado.
7. Ignorar params vacios (`''`, `null`, `undefined`) y validar tipos antes de filtrar.

## Ejemplos de llamadas

```http
GET /reportes/deudores?fecha_desde=2026-07-01&fecha_hasta=2026-07-03
```

```http
GET /reportes/deudores?fecha_desde=2026-07-01&fecha_hasta=2026-07-03&id_vendedor=4
```

```http
GET /reportes/deudores?search=lopez&saldo_min=100&saldo_max=500
```

```http
GET /reportes/deudores?fecha_desde=2026-07-01&fecha_hasta=2026-07-03&output=pdf
```

## Nota para frontend

Cuando backend soporte estos params, el frontend solo necesita pasar un objeto de filtros a `useReporteDeudores(filters)`, igual que `useReporteVentas(filters)`. La query key `queryKeys.reporting.deudores(filters)` ya existe y esta lista para cachear por combinacion de filtros.
