import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MAX_TOOL_DESCRIPTION,
  toToolSpecs,
  useAgentToolRegistry,
  validateToolDef,
  waitForRegistryChange,
  type AgentToolDef,
} from './agent-tool-registry'
import { bindToLatest, toolsSignature } from './useAgentTools'

const def = (name: string, extra: Partial<AgentToolDef> = {}): AgentToolDef => ({
  name,
  description: `Descripcion de ${name}`,
  parameters: { type: 'object', properties: {} },
  run: async () => ({ ok: true, data: name }),
  ...extra,
})

const registry = () => useAgentToolRegistry.getState()

beforeEach(() => {
  useAgentToolRegistry.setState({ tools: new Map(), version: 0 })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('validateToolDef', () => {
  it('acepta una definición válida', () => {
    expect(validateToolDef(def('filtrar_clientes'))).toBeNull()
    expect(validateToolDef(def('abc'))).toBeNull()
    expect(validateToolDef(def('a' + 'b'.repeat(40)))).toBeNull()
  })

  it.each(['Filtrar', 'ab', '1abc', 'con-guion', 'con espacio', 'x'.repeat(42), ''])('rechaza el nombre %j', (name) => {
    expect(validateToolDef(def(name))).toMatch(/nombre inválido/)
  })

  it('rechaza descripciones vacías o de más de 300 caracteres', () => {
    expect(validateToolDef(def('abc', { description: 'd'.repeat(MAX_TOOL_DESCRIPTION) }))).toBeNull()
    expect(validateToolDef(def('abc', { description: 'd'.repeat(MAX_TOOL_DESCRIPTION + 1) }))).toMatch(/descripción/)
    expect(validateToolDef(def('abc', { description: '  ' }))).toMatch(/descripción/)
  })

  it('una tool con requiere_confirmacion debe definir validar y textoConfirmacion', () => {
    const completa = def('borrar_algo', {
      requiere_confirmacion: true,
      validar: () => null,
      textoConfirmacion: () => 'Borrar algo',
    })
    expect(validateToolDef(completa)).toBeNull()
    expect(validateToolDef({ ...completa, validar: undefined })).toMatch(/validar y textoConfirmacion/)
    expect(validateToolDef({ ...completa, textoConfirmacion: undefined })).toMatch(/validar y textoConfirmacion/)
    expect(validateToolDef(def('borrar_algo', { requiere_confirmacion: true }))).toMatch(/validar y textoConfirmacion/)
    // sin confirmación no hace falta
    expect(validateToolDef(def('leer_algo'))).toBeNull()
  })

  it('el registro descarta con warning la tool con confirmación que no valida', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    registry().register('a', [def('borrar_algo', { requiere_confirmacion: true }), def('leer_algo')])
    expect(registry().getAll().map((t) => t.name)).toEqual(['leer_algo'])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('validar'))
  })

  it('exige parameters de tipo object y un run', () => {
    expect(validateToolDef(def('abc', { parameters: { type: 'string' } }))).toMatch(/object/)
    expect(validateToolDef(def('abc', { parameters: {} }))).toMatch(/object/)
    expect(validateToolDef({ ...def('abc'), run: undefined as unknown as AgentToolDef['run'] })).toMatch(/run/)
  })
})

describe('registro', () => {
  it('register y unregister suben la versión', () => {
    registry().register('a', [def('tool_a')])
    expect(registry().version).toBe(1)
    expect(registry().getAll().map((t) => t.name)).toEqual(['tool_a'])

    registry().unregister('a')
    expect(registry().version).toBe(2)
    expect(registry().getAll()).toEqual([])
  })

  it('quitar un scope que no existe no cambia la versión', () => {
    registry().unregister('fantasma')
    expect(registry().version).toBe(0)
  })

  it('descarta las definiciones inválidas con un warning y conserva las válidas', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    registry().register('a', [def('Mala'), def('buena_tool')])
    expect(registry().getAll().map((t) => t.name)).toEqual(['buena_tool'])
    expect(warn).toHaveBeenCalledOnce()
  })

  it('si dos scopes repiten un nombre gana el último y se avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    registry().register('a', [def('repetida', { description: 'de a' })])
    registry().register('b', [def('repetida', { description: 'de b' })])

    expect(registry().getAll()).toHaveLength(1)
    expect(registry().getAll()[0].description).toBe('de b')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('repetida'))
  })

  it('volver a registrar un scope lo deja como el último', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    registry().register('a', [def('repetida', { description: 'de a' })])
    registry().register('b', [def('repetida', { description: 'de b' })])
    registry().register('a', [def('repetida', { description: 'de a otra vez' })])
    expect(registry().getAll()[0].description).toBe('de a otra vez')
  })

  it('toToolSpecs no incluye run y normaliza requiere_confirmacion', () => {
    const specs = toToolSpecs([def('abc', { requiere_confirmacion: true }), def('def')])
    expect(specs).toEqual([
      { name: 'abc', description: 'Descripcion de abc', parameters: { type: 'object', properties: {} }, requiere_confirmacion: true },
      { name: 'def', description: 'Descripcion de def', parameters: { type: 'object', properties: {} }, requiere_confirmacion: false },
    ])
  })
})

describe('waitForRegistryChange', () => {
  // Con fake timers: sin depender de la carga de la máquina (los tiempos son exactos).
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  const opts = { quietMs: 40, settleMs: 15, pollMs: 2, timeoutMs: 300 }
  const wait = (o = opts) => {
    let finishedAt: number | null = null
    const startedAt = Date.now()
    const promise = waitForRegistryChange(() => registry().version, registry().version, o).then((changed) => {
      finishedAt = Date.now()
      return changed
    })
    return { promise, elapsed: () => (finishedAt === null ? null : finishedAt - startedAt) }
  }

  it('devuelve false cuando no hay ningún cambio en quietMs', async () => {
    const { promise, elapsed } = wait()
    await vi.advanceTimersByTimeAsync(100)
    expect(await promise).toBe(false)
    expect(elapsed()).toBeGreaterThanOrEqual(40)
    expect(elapsed()).toBeLessThan(60)
  })

  it('devuelve true cuando el registro cambia y se estabiliza', async () => {
    const { promise, elapsed } = wait()
    setTimeout(() => registry().register('a', [def('tool_a')]), 10)
    await vi.advanceTimersByTimeAsync(100)
    expect(await promise).toBe(true)
    expect(elapsed()).toBeLessThan(40) // no espera el quietMs completo: ya hubo cambio
  })

  it('espera a que terminen los cambios en cascada (la pantalla vieja sale y la nueva se monta)', async () => {
    registry().register('vieja', [def('tool_vieja')])
    const { promise } = wait({ ...opts, settleMs: 40 })
    setTimeout(() => registry().unregister('vieja'), 5)
    setTimeout(() => registry().register('pagina', [def('tool_pagina')]), 30) // 25 ms después: dentro de settleMs
    await vi.advanceTimersByTimeAsync(200)

    expect(await promise).toBe(true)
    expect(registry().getAll().map((t) => t.name)).toEqual(['tool_pagina'])
  })

  it('con un único cambio y settleMs corto, devuelve apenas se estabiliza', async () => {
    registry().register('vieja', [def('tool_vieja')])
    const { promise, elapsed } = wait()
    setTimeout(() => registry().unregister('vieja'), 5)
    await vi.advanceTimersByTimeAsync(100)
    expect(await promise).toBe(true)
    expect(elapsed()).toBeLessThan(30)
  })

  it('respeta el tope absoluto aunque el registro cambie sin parar', async () => {
    const timer = setInterval(() => registry().register('a', [def('tool_a')]), 3)
    const { promise, elapsed } = wait({ ...opts, settleMs: 100, timeoutMs: 80 })
    await vi.advanceTimersByTimeAsync(300)
    clearInterval(timer)

    expect(await promise).toBe(true)
    expect(elapsed()).toBeGreaterThanOrEqual(80)
    expect(elapsed()).toBeLessThan(90)
  })
})

describe('useAgentTools (partes puras)', () => {
  it('la firma ignora run pero cambia con el nombre, el texto, el esquema o la confirmación', () => {
    const base = [def('abc')]
    expect(toolsSignature([def('abc', { run: async () => ({ ok: false, error: 'otro run' }) })])).toBe(toolsSignature(base))
    expect(toolsSignature([def('abd')])).not.toBe(toolsSignature(base))
    expect(toolsSignature([def('abc', { description: 'otra' })])).not.toBe(toolsSignature(base))
    expect(toolsSignature([def('abc', { parameters: { type: 'object', properties: { x: {} } } })])).not.toBe(toolsSignature(base))
    expect(toolsSignature([def('abc', { requiere_confirmacion: true })])).not.toBe(toolsSignature(base))
  })

  it('bindToLatest ejecuta siempre la versión más reciente de la tool', async () => {
    let latest: AgentToolDef[] | null = [def('abc', { run: async () => ({ ok: true, data: 'v1' }) })]
    const bound = bindToLatest(latest, () => latest)

    expect(await bound[0].run({})).toEqual({ ok: true, data: 'v1' })
    latest = [def('abc', { run: async () => ({ ok: true, data: 'v2' }) })]
    expect(await bound[0].run({})).toEqual({ ok: true, data: 'v2' })
  })

  it('bindToLatest consulta el texto de confirmación más reciente', () => {
    let latest: AgentToolDef[] | null = [def('abc', { textoConfirmacion: () => 'antes' })]
    const bound = bindToLatest(latest, () => latest)
    expect(bound[0].textoConfirmacion?.({})).toBe('antes')
    latest = [def('abc', { textoConfirmacion: () => 'despues' })]
    expect(bound[0].textoConfirmacion?.({})).toBe('despues')
  })

  it('bindToLatest consulta el validar más reciente y avisa si la tool ya no está', () => {
    let latest: AgentToolDef[] | null = [def('abc', { validar: () => 'antes' })]
    const bound = bindToLatest(latest, () => latest)
    expect(bound[0].validar?.({})).toBe('antes')
    latest = [def('abc', { validar: () => null })]
    expect(bound[0].validar?.({})).toBeNull()
    latest = [def('abc')] // la versión nueva ya no valida: no hay error
    expect(bound[0].validar?.({})).toBeNull()
    latest = null
    expect(bound[0].validar?.({})).toMatch(/ya no está disponible/)
  })

  it('bindToLatest no inventa validar ni textoConfirmacion donde no existían', () => {
    const bound = bindToLatest([def('abc')], () => null)
    expect(bound[0].validar).toBeUndefined()
    expect(bound[0].textoConfirmacion).toBeUndefined()
  })

  it('si la tool ya no está en la versión más reciente, devuelve un error claro', async () => {
    let latest: AgentToolDef[] | null = [def('abc')]
    const bound = bindToLatest(latest, () => latest)
    latest = null
    expect(await bound[0].run({})).toEqual({ ok: false, error: 'Esa acción ya no está disponible en esta pantalla.' })
  })
})
