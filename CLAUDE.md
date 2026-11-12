# Agente de IA (voz y chat): manual para agregarle funciones

El asistente opera el front por el usuario. El modelo (OpenAI) vive en el back; **el front ejecuta
las tools, el back solo orquesta**. Back: `backend-tipicos/agent/` (tiene su propio `CLAUDE.md`).

## Cómo funciona

1. Cada pantalla o diálogo montado registra sus tools con `useAgentTools(scopeId, tools | null)`.
2. Con cada mensaje y cada `tool_result`, el front manda al back la lista vigente y el contexto
   (ruta actual, rutas permitidas con `acciones`, carrito).
3. El modelo pide una tool; el back la reenvía por WebSocket; el front valida, pide confirmación
   si toca, la ejecuta y devuelve `{ ok, data } | { ok: false, error }`.

Piezas, todas en `src/features/agent/`:

| Archivo | Para qué |
|---|---|
| `registry/agent-tool-registry.ts` | Tipo `AgentToolDef`, validación y registro |
| `registry/useAgentTools.ts` | Hook que registra mientras el componente está montado |
| `tool-helpers.ts` | `ok`, `fail`, `NO_PARAMS`, `positiveInt`, `cleanText`, `isIsoDate`, `mergeDateRange`, `matchOption`, `limitRows`, `isCredentialKey` |
| `commit-tools.ts` | `commitTool` y `submitForm`: tools que presionan Guardar/Cobrar/Anular/Eliminar |
| `pagination-tools.ts` | `paginationTool` (`paginar_<tabla>`), con adaptadores `tablePagination` y `slicePagination` |
| `agent-actions.ts` | Tools estáticas (navegar, carrito, tema, sesión) |
| `route-catalog.ts` | Rutas que ve el modelo; `acciones` sale de `meta.agentHint` |
| `agent-tools-contract.test.ts` | Contrato que recorre todas las tools de todas las pantallas |

## Kit de skills

Si tienes el kit de skills del agente, úsalo; tiene los pasos detallados con plantillas:

| Tarea | Skill |
|---|---|
| Que el agente lea, filtre, abra o llene algo en una pantalla | `agente-tool-pantalla` |
| Que el agente guarde, cobre, anule o elimine | `agente-accion-guardado` |
| Que el agente vea o cambie la página de una tabla | `agente-paginacion` |
| Tool estática, prompt o límites del back | `agente-tool-backend` |

## Receta: agregar tools a una pantalla

1. **Builder puro** en `src/features/<feature>/agent/<pantalla>-tools.ts`: una función
   `build…Tools(ctx): AgentToolDef[]`. `ctx` es un objeto de getters y acciones que presta el
   componente; el builder no importa React ni stores. Copia el estilo de
   `src/features/admin/agent/sucursales-tools.ts`.
2. **Cablear** en el componente: `useAgentTools('scope-unico', build…Tools({...}))`.
   - El hook va **antes de cualquier `return` temprano**.
   - Para un diálogo: `open ? build…(…) : null`.
   - Reutiliza los handlers que ya usan los botones; si devuelven `void`, hazlos devolver
     `boolean` (true = salió bien) sin cambiar lo que hace el botón.
3. **Tests** junto al builder (`*-tools.test.ts`) con un `ctx` de mocks.
4. **Contrato**: agrega la pantalla a `screens` en `agent-tools-contract.test.ts`.
5. **Ruta nueva**: ponle `agentHint` (una línea, máx. 160 caracteres) en su `routes.tsx`; un test
   falla si falta.

## Tipos de tool y sus reglas

| Prefijo | Qué hace | Reglas |
|---|---|---|
| `leer_*` | Devuelve lo que la pantalla ya cargó | Máx. 30 filas (`limitRows`); sin correos ni datos que no hagan falta |
| `filtrar_*`, `limpiar_filtros_*` | Cambia filtros | Respeta dónde vive el filtro (URL o estado local). Las fechas nunca quedan vacías |
| `abrir_*`, `ver_*`, `cambiar_pestana_*` | Abre diálogo o cambia de vista | `abreUi: true`; con un diálogo ya abierto falla con `dialogAlreadyOpenError` |
| `llenar_*` | Llena el formulario abierto | Solo existe con el diálogo abierto; valida con un `sanitize…` y nunca guarda |
| `editar_*` | Cambia un borrador | La descripción dice `BORRADOR` y qué botón de Guardar presiona el usuario |
| `paginar_*` | Lee la paginación y las filas visibles; cambia página o tamaño | Una por tabla, con `paginationTool`; el sufijo debe ser único en la pantalla |
| `guardar_*`, `confirmar_*` | Presiona el botón que guarda, cobra, anula o elimina | **Siempre con `commitTool`** (ver abajo) |

Reglas para todas:

- `name`: `^[a-z][a-z0-9_]{2,40}$`, en español, único entre las tools que conviven y distinto de
  las estáticas del back. `description` ≤ 300 caracteres, sin acentos. `parameters`: JSON Schema
  de tipo `object` con `additionalProperties: false`.
- Los ids se validan contra datos ya cargados (`validar`), nunca se confía en lo que diga el modelo.
- `requiere_confirmacion: true` obliga a definir `validar` y `textoConfirmacion`; el texto se arma
  con datos reales (nombre del cliente, monto), no con texto del modelo.
- Los mensajes de error le dicen al modelo qué hacer después (p. ej. "ver leer_usuarios").

## Acciones que guardan (`commitTool`)

```ts
useAgentTools('cliente-dialog-guardar', open ? [
  commitTool({
    name: 'guardar_cliente',
    description: 'Guarda el formulario de cliente abierto.',
    validar: () => (isPending ? 'Ya se esta guardando.' : null),
    texto: () => `Crear el cliente ${getValues('nombre_completo')}`,
    run: () => submitForm(handleSubmit, onSubmit), // o un handler que devuelva boolean
  }),
] : null)
```

- No reciben argumentos: guardan lo que hay en pantalla.
- Siempre piden un clic de confirmación en el widget.
- **Están apagadas por defecto.** Solo existen con `VITE_AGENT_COMMIT_ACTIONS=true` (front) **y**
  `AGENT_ALLOW_COMMIT_ACTIONS=true` (back). No cambies esos defaults.
- Al agregar una, súmala a `EXPECTED` en `commit-tools.test.ts`.

## Prohibido

- Aceptar, leer o devolver contraseñas, patrón de acceso, passkeys, PIN o tokens. Los `sanitize…`
  descartan esas claves con `isCredentialKey` y solo reportan el nombre de la clave.
- Registrar tools en `src/features/auth/**`, `PatronAccesoPage` o `PatternSetupForm`.
- Tomar la foto de entrega o elegir la imagen de un artículo: lo hace el usuario.
- Definir a mano una tool `guardar_*`/`confirmar_*` sin `commitTool`.
- Dependencias nuevas.

Los tests de contrato hacen cumplir casi todo lo anterior.

## Verificar antes de terminar

```bash
npx tsc -b
npx vitest run        # fallan siempre 2 tests de src/lib/api-passkeys.test.ts, ajenos al agente
npx eslint <archivos tocados>
npm run build
```

En el back: `venv/Scripts/python.exe manage.py test agent --settings=tipicos.test_settings --noinput`.

## Estado y pendientes

Las 23 rutas con página tienen tools, salvo `/administracion/passkeys` y
`/administracion/patron-acceso`, que son solo de navegación a propósito.

Interacciones que aún no existen:

- Cerrar o cancelar un diálogo abierto.
- Manejar el selector de tallas (`VariantSelectionDrawer`): no hace falta, `agregar_item` ya recibe
  la variante.
- Paginar las tablas de cobros por usuario (hay una por sucursal y chocarían los nombres);
  `leer_cobros` ya devuelve esos datos.
- `AddCustomerPriceDialog` no está montado en ninguna pantalla. Un precio nuevo se asigna con
  `abrir_editar_precio_cliente` sobre una variante sin precio.

Nada de esto se ha probado en navegador con el modelo real.
