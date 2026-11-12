import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UseFormHandleSubmit } from 'react-hook-form'
import { commitTool, submitForm } from './commit-tools'
import {
  commitActionsEnabled,
  toToolSpecs,
  useAgentToolRegistry,
  validateToolDef,
  type AgentToolDef,
} from './registry/agent-tool-registry'
import { toolsSignature } from './registry/useAgentTools'

const guardar = (over: Partial<Parameters<typeof commitTool>[0]> = {}) =>
  commitTool({
    name: 'guardar_cliente',
    description: 'Guarda el formulario de cliente abierto.',
    texto: () => 'Crear el cliente Ana',
    run: async () => true,
    ...over,
  })

const lectura: AgentToolDef = {
  name: 'leer_clientes',
  description: 'Lee clientes',
  parameters: { type: 'object', properties: {} },
  run: async () => ({ ok: true, data: null }),
}

beforeEach(() => {
  useAgentToolRegistry.setState({ tools: new Map(), version: 0 })
})
afterEach(() => {
  vi.unstubAllEnvs()
})

describe('commitTool', () => {
  it('siempre pide confirmación, va marcada como `ejecuta` y no recibe argumentos del modelo', () => {
    const def = guardar()
    expect(def.requiere_confirmacion).toBe(true)
    expect(def.ejecuta).toBe(true)
    expect(def.parameters).toEqual({ type: 'object', properties: {}, additionalProperties: false })
    expect(def.description).toMatch(/confirmarlo con un clic/)
    expect(validateToolDef(def)).toBeNull()
    expect(def.textoConfirmacion?.({})).toBe('Crear el cliente Ana')
  })

  it('valida antes de confirmar y traduce el resultado del botón', async () => {
    expect(guardar().validar?.({})).toBeNull()
    expect(guardar({ validar: () => 'Ya se esta guardando.' }).validar?.({})).toBe('Ya se esta guardando.')
    expect((await guardar().run({})).ok).toBe(true)
    const fallo = await guardar({ run: async () => false }).run({})
    expect(fallo).toMatchObject({ ok: false })
    expect(await guardar({ run: async () => ({ ok: false, error: 'campo invalido' }) }).run({})).toEqual({ ok: false, error: 'campo invalido' })
  })

  it('una tool que ejecuta sin pedir confirmación no es válida', () => {
    expect(validateToolDef({ ...guardar(), requiere_confirmacion: false })).toMatch(/debe pedir confirmación/)
  })
})

describe('interruptor VITE_AGENT_COMMIT_ACTIONS', () => {
  it('apagado por defecto: las tools que ejecutan ni se registran', () => {
    expect(commitActionsEnabled()).toBe(false)
    useAgentToolRegistry.getState().register('dialogo', [guardar(), lectura])
    expect(useAgentToolRegistry.getState().getAll().map((t) => t.name)).toEqual(['leer_clientes'])
  })

  it('solo el valor exacto "true" las activa', () => {
    for (const value of ['1', 'TRUE', 'si', '']) {
      vi.stubEnv('VITE_AGENT_COMMIT_ACTIONS', value)
      expect(commitActionsEnabled(), value).toBe(false)
    }
    vi.stubEnv('VITE_AGENT_COMMIT_ACTIONS', 'true')
    expect(commitActionsEnabled()).toBe(true)
  })

  it('encendido: se registran y viajan al back marcadas con `ejecuta`', () => {
    vi.stubEnv('VITE_AGENT_COMMIT_ACTIONS', 'true')
    useAgentToolRegistry.getState().register('dialogo', [guardar(), lectura])
    const specs = toToolSpecs(useAgentToolRegistry.getState().getAll())
    expect(specs.find((s) => s.name === 'guardar_cliente')).toMatchObject({ ejecuta: true, requiere_confirmacion: true })
    expect(specs.find((s) => s.name === 'leer_clientes')).not.toHaveProperty('ejecuta')
  })

  it('la marca `ejecuta` forma parte de la firma que decide si se re-registra', () => {
    expect(toolsSignature([guardar()])).not.toBe(toolsSignature([{ ...guardar(), ejecuta: undefined }]))
  })
})

describe('submitForm', () => {
  type Values = { nombre: string }
  const handleSubmit = (outcome: { values?: Values; errors?: Record<string, { message?: string }> }) =>
    ((onValid: (v: Values) => unknown, onInvalid?: (e: unknown) => unknown) => async () => {
      if (outcome.errors) await onInvalid?.(outcome.errors)
      else await onValid(outcome.values!)
    }) as unknown as UseFormHandleSubmit<Values>

  it('envía el formulario y refleja si el guardado salió bien', async () => {
    const onSubmit = vi.fn(async () => true)
    expect((await submitForm(handleSubmit({ values: { nombre: 'Ana' } }), onSubmit)).ok).toBe(true)
    expect(onSubmit).toHaveBeenCalledWith({ nombre: 'Ana' })
    expect((await submitForm(handleSubmit({ values: { nombre: 'Ana' } }), async () => false)).ok).toBe(false)
  })

  it('con errores de validación no envía y dice qué campos fallan', async () => {
    const onSubmit = vi.fn(async () => true)
    const result = await submitForm(handleSubmit({ errors: { nombre: { message: 'Requerido' } } }), onSubmit)
    expect(onSubmit).not.toHaveBeenCalled()
    expect(result).toMatchObject({ ok: false })
    expect('error' in result && result.error).toMatch(/nombre: Requerido/)
  })
})

describe('mapa de acciones que guardan, cobran, anulan o eliminan', () => {
  const SOURCES = import.meta.glob('/src/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
  const code = Object.entries(SOURCES).filter(([path]) => !/\.test\.tsx?$/.test(path))

  const EXPECTED = [
    'confirmar_abono', 'confirmar_ajuste', 'confirmar_anular_abono', 'confirmar_anular_venta', 'confirmar_cobro',
    'confirmar_desactivar_sucursal', 'confirmar_eliminar_articulo', 'confirmar_eliminar_cliente',
    'confirmar_eliminar_destinatario', 'confirmar_eliminar_usuario', 'confirmar_vaciar_carrito', 'confirmar_venta_cliente',
    'guardar_articulo', 'guardar_cliente', 'guardar_cliente_rapido', 'guardar_destinatario', 'guardar_mayoreo', 'guardar_movimiento_caja',
    'guardar_precio_cliente', 'guardar_precios_sucursal', 'guardar_precios_venta', 'guardar_preferencias_destinatarios',
    'guardar_programacion_cobros', 'guardar_stock', 'guardar_sucursal', 'guardar_usuario',
  ]

  it('todas pasan por commitTool: ninguna tool guardar_*/confirmar_* se define a mano', () => {
    const viaCommit: string[] = []
    const total: string[] = []
    for (const [, text] of code) {
      for (const m of text.matchAll(/commitTool\(\{\s*name: '([a-z_]+)'/g)) viaCommit.push(m[1])
      for (const m of text.matchAll(/name: '((?:guardar|confirmar|registrar|anular|cobrar|borrar|enviar|crear)_[a-z_]+)'/g)) total.push(m[1])
    }
    expect(total.sort()).toEqual(EXPECTED)
    expect(viaCommit.sort()).toEqual(EXPECTED)
  })

  it('ninguna vive en las pantallas de credenciales', () => {
    for (const [path, text] of code) {
      if (/\/features\/auth\/|PatronAccesoPage|PatternSetupForm/.test(path)) expect(text, path).not.toMatch(/commitTool/)
    }
  })
})
