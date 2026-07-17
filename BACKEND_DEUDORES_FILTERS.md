# Guia backend: filtros de deudores

Objetivo: que `/reportes/deudores` filtre solo por fecha de notificacion, nombre y lugar, y que el PDF use exactamente los mismos filtros.

## Parametros esperados

- `fecha_desde`: fecha inicial de `cliente.fecha_notificacion` en formato `YYYY-MM-DD`.
- `fecha_hasta`: fecha final de `cliente.fecha_notificacion` en formato `YYYY-MM-DD`.
- `nombre`: busqueda parcial por `cliente.nombre_completo`.
- `lugar`: busqueda parcial por `cliente.direccion`.
- `output=pdf`: mantiene el comportamiento actual de descarga.

El frontend ya envia `nombre`, `lugar`, `fecha_desde` y `fecha_hasta`. Tambien envia `search` con el mismo valor de `nombre` como compatibilidad temporal si el endpoint actual todavia usa ese parametro.

## Cambio minimo sugerido

En la vista/servicio que arma `/reportes/deudores`:

1. Mantener el filtro actual de saldo pendiente/deudores.
2. Aplicar `fecha_desde` y `fecha_hasta` sobre `fecha_notificacion`, no sobre fecha de venta.
3. Aplicar `nombre` con `icontains` sobre `nombre_completo`.
4. Aplicar `lugar` con `icontains` sobre `direccion`.
5. Incluir `direccion` en cada cliente del JSON de respuesta.
6. Usar la misma funcion de filtros para JSON y para PDF.

Ejemplo Django ORM:

```py
qs = Cliente.objects.filter(balance__gt=0)

fecha_desde = request.query_params.get("fecha_desde")
fecha_hasta = request.query_params.get("fecha_hasta")
nombre = request.query_params.get("nombre") or request.query_params.get("search")
lugar = request.query_params.get("lugar")

if fecha_desde:
    qs = qs.filter(fecha_notificacion__date__gte=fecha_desde)

if fecha_hasta:
    qs = qs.filter(fecha_notificacion__date__lte=fecha_hasta)

if nombre:
    qs = qs.filter(nombre_completo__icontains=nombre)

if lugar:
    qs = qs.filter(direccion__icontains=lugar)
```

Si `fecha_notificacion` es `DateField`, usar `fecha_notificacion__gte` y `fecha_notificacion__lte` en vez de `__date`.

## Respuesta JSON esperada

Cada item de `data.clientes` debe incluir:

```json
{
  "id": 1,
  "nombre_completo": "Cliente Demo",
  "direccion": "Calle principal, zona 1",
  "telefono": "12345678",
  "balance": 100,
  "fecha_notificacion": "2026-07-17",
  "ultima_compra": "2026-07-17T10:00:00",
  "total_ventas_pendientes": 100,
  "total_abonado": 0
}
```

## Criterio de aceptacion

- En el reporte de deudores, filtrar por nombre no debe buscar telefono ni ID.
- Filtrar por lugar debe comparar contra `direccion`.
- La tabla debe mostrar la columna `Lugar`.
- La descarga PDF debe respetar los mismos filtros activos.
