import { describe, expect, it, vi } from 'vitest'
import { validateToolDef, type AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import type { Cliente } from '../types/clientes'
import { buildClientesPageTools, MAX_ROWS, parseFilterArgs, type ClientesPageAgentContext } from './clientes-page-tools'
import { buildClienteDialogTools, fillClienteForm, type ClienteDialogAgentContext } from './cliente-dialog-tools'
import type { ClienteFormValues } from './cliente-form-values'

const cliente = (id: number, extra: Partial<Cliente> = {}): Cliente => ({
  id,
  permitir_credito: true,
  nombre_completo: `Cliente ${id}`,
  direccion: 'Zona 1',
  telefono: '55551234',
  balance: 0,
  fecha_creacion: '2026-01-01',
  activo: true,
  ...extra,
})

function pageContext(overrides: Partial<ClientesPageAgentContext> = {}) {
  const ctx = {
    readFilters: vi.fn(() => ({ texto: '', credito: 'todos' as const, estado: 'todos' as const })),
    readList: vi.fn(() => ({ clientes: [cliente(1), cliente(2, { balance: 80 })], total: 2, cargando: false })),
    setFilters: vi.fn(),
    isDialogOpen: vi.fn(() => false),
    isDeleteOpen: vi.fn(() => false),
    openNew: vi.fn(),
    openEdit: vi.fn(),
    openDelete: vi.fn(),
    fetchCliente: vi.fn(async (id: number) => cliente(id)),
    ...overrides,
  }
  return ctx satisfies ClientesPageAgentContext
}

const tool = (tools: AgentToolDef[], name: string) => {
  const found = tools.find((t) => t.name === name)
  if (!found) throw new Error(`falta la tool ${name}`)
  return found
}

describe('tools de /clientes/listado', () => {
  it('un vendedor solo ve las de lectura y filtros; el admin también las que abren formularios', () => {
    const vendedor = buildClientesPageTools(pageContext(), false).map((t) => t.name)
    const admin = buildClientesPageTools(pageContext(), true).map((t) => t.name)

    expect(vendedor).toEqual(['filtrar_clientes', 'leer_clientes'])
    expect(admin).toEqual([
      'filtrar_clientes',
      'leer_clientes',
      'abrir_nuevo_cliente',
      'abrir_editar_cliente',
      'abrir_eliminar_cliente',
    ])
  })

  it('todas las definiciones cumplen las reglas del registro y caben en los límites del back', () => {
    const defs = [
      ...buildClientesPageTools(pageContext(), true),
      ...buildClienteDialogTools({} as ClienteDialogAgentContext),
    ]
    for (const def of defs) {
      expect(validateToolDef(def), def.name).toBeNull()
      expect(JSON.stringify(def.parameters).length, def.name).toBeLessThanOrEqual(3000)
      // Las tools "abrir_*" y "llenar_*" jamás guardan: no piden confirmación propia ni se llaman guardar/enviar/eliminar.
      expect(def.name).not.toMatch(/^(guardar|enviar|eliminar|borrar|crear)_/)
    }
  })

  it('ninguna tool recibe ni pide contraseñas', () => {
    const defs = [
      ...buildClientesPageTools(pageContext(), true),
      ...buildClienteDialogTools({} as ClienteDialogAgentContext),
    ]
    expect(JSON.stringify(defs.map((d) => d.parameters)).toLowerCase()).not.toMatch(/password|contrase|passkey|patron/)
  })

  describe('filtrar_clientes', () => {
    it('aplica los filtros y devuelve el estado resultante', async () => {
      const ctx = pageContext()
      const result = await tool(buildClientesPageTools(ctx, false), 'filtrar_clientes').run({
        texto: ' ana ',
        credito: 'con',
        estado: 'activo',
      })
      expect(ctx.setFilters).toHaveBeenCalledWith({ texto: 'ana', credito: 'con', estado: 'activo' })
      expect(result).toMatchObject({ ok: true, data: { filtros: { texto: 'ana', credito: 'con', estado: 'activo' } } })
    })

    it('acepta texto vacío para quitar el filtro', async () => {
      const ctx = pageContext()
      await tool(buildClientesPageTools(ctx, false), 'filtrar_clientes').run({ texto: '' })
      expect(ctx.setFilters).toHaveBeenCalledWith({ texto: '' })
    })

    it('rechaza valores inválidos o la ausencia de filtros', async () => {
      const ctx = pageContext()
      const run = tool(buildClientesPageTools(ctx, false), 'filtrar_clientes').run
      for (const args of [{}, { credito: 'tal vez' }, { estado: 'borrado' }, { texto: 5 }]) {
        expect((await run(args)).ok).toBe(false)
      }
      expect(ctx.setFilters).not.toHaveBeenCalled()
    })

    it('parseFilterArgs recorta el texto a 100 caracteres', () => {
      expect(parseFilterArgs({ texto: 'x'.repeat(300) })).toEqual({ filters: { texto: 'x'.repeat(100) } })
    })
  })

  describe('leer_clientes', () => {
    it('resume la lista cargada sin pedir nada nuevo', async () => {
      const ctx = pageContext()
      const result = await tool(buildClientesPageTools(ctx, false), 'leer_clientes').run({})
      expect(result).toEqual({
        ok: true,
        data: {
          filtros: { texto: '', credito: 'todos', estado: 'todos' },
          total: 2,
          mostrando: 2,
          cargando: false,
          clientes: [
            { id: 1, nombre: 'Cliente 1', telefono: '55551234', direccion: 'Zona 1', credito: true, balance: 0, activo: true },
            { id: 2, nombre: 'Cliente 2', telefono: '55551234', direccion: 'Zona 1', credito: true, balance: 80, activo: true },
          ],
        },
      })
      expect(ctx.fetchCliente).not.toHaveBeenCalled()
    })

    it(`devuelve como máximo ${MAX_ROWS} filas e indica si aún carga`, async () => {
      const muchos = Array.from({ length: 50 }, (_, i) => cliente(i + 1))
      const ctx = pageContext({ readList: () => ({ clientes: muchos, total: 120, cargando: true }) })
      const result = await tool(buildClientesPageTools(ctx, false), 'leer_clientes').run({})
      expect(result).toMatchObject({ ok: true, data: { total: 120, mostrando: MAX_ROWS, cargando: true } })
      expect((result as { data: { clientes: unknown[] } }).data.clientes).toHaveLength(MAX_ROWS)
    })
  })

  describe('abrir_nuevo_cliente', () => {
    it('abre el formulario precargado y no guarda nada', async () => {
      const ctx = pageContext()
      const result = await tool(buildClientesPageTools(ctx, true), 'abrir_nuevo_cliente').run({
        valores: { nombre_completo: 'Ana López', telefono: '55551234', direccion: 'zona 1' },
      })
      expect(ctx.openNew).toHaveBeenCalledWith({
        nombre_completo: 'Ana López',
        telefono: '55551234',
        direccion: 'zona 1',
      })
      expect(result).toMatchObject({ ok: true })
      expect(ctx.openEdit).not.toHaveBeenCalled()
      expect(ctx.openDelete).not.toHaveBeenCalled()
    })

    it('sin valores abre el formulario vacío', async () => {
      const ctx = pageContext()
      await tool(buildClientesPageTools(ctx, true), 'abrir_nuevo_cliente').run({})
      expect(ctx.openNew).toHaveBeenCalledWith(undefined)
    })

    it('descarta campos ajenos (como password) y los reporta', async () => {
      const ctx = pageContext()
      const result = await tool(buildClientesPageTools(ctx, true), 'abrir_nuevo_cliente').run({
        valores: { nombre_completo: 'Ana', password: 'x' },
      })
      expect(ctx.openNew).toHaveBeenCalledWith({ nombre_completo: 'Ana' })
      expect(result).toMatchObject({ data: { campos_no_permitidos: ['password'] } })
    })

    it('no abre nada si los valores son inválidos', async () => {
      const ctx = pageContext()
      const result = await tool(buildClientesPageTools(ctx, true), 'abrir_nuevo_cliente').run({
        valores: { telefono: -5 },
      })
      expect(result.ok).toBe(false)
      expect(ctx.openNew).not.toHaveBeenCalled()
    })
  })

  describe('abrir_editar_cliente', () => {
    it('usa la fila ya cargada', async () => {
      const ctx = pageContext()
      const result = await tool(buildClientesPageTools(ctx, true), 'abrir_editar_cliente').run({
        cliente_id: 1,
        valores: { telefono: '55559999' },
      })
      expect(ctx.openEdit).toHaveBeenCalledWith(cliente(1), { telefono: '55559999' })
      expect(ctx.fetchCliente).not.toHaveBeenCalled()
      expect(result.ok).toBe(true)
    })

    it('si la fila no está en la página cargada, la pide por id', async () => {
      const ctx = pageContext()
      await tool(buildClientesPageTools(ctx, true), 'abrir_editar_cliente').run({ cliente_id: 99 })
      expect(ctx.fetchCliente).toHaveBeenCalledWith(99)
      expect(ctx.openEdit).toHaveBeenCalledWith(cliente(99), undefined)
    })

    it('si no existe, falla sin abrir nada', async () => {
      const ctx = pageContext({ fetchCliente: vi.fn(async () => { throw new Error('404') }) })
      const result = await tool(buildClientesPageTools(ctx, true), 'abrir_editar_cliente').run({ cliente_id: 99 })
      expect(result.ok).toBe(false)
      expect(ctx.openEdit).not.toHaveBeenCalled()
    })

    it('aplica la regla del crédito bloqueado por balance', async () => {
      const ctx = pageContext()
      const result = await tool(buildClientesPageTools(ctx, true), 'abrir_editar_cliente').run({
        cliente_id: 2, // balance 80
        valores: { permitir_credito: false, telefono: '55559999' },
      })
      expect(ctx.openEdit).toHaveBeenCalledWith(cliente(2, { balance: 80 }), { telefono: '55559999' })
      expect(result).toMatchObject({ data: { notas: [expect.stringMatching(/balance/)] } })
    })

    it.each([0, -1, 1.5, '1', undefined])('rechaza cliente_id %j', async (cliente_id) => {
      const ctx = pageContext()
      expect((await tool(buildClientesPageTools(ctx, true), 'abrir_editar_cliente').run({ cliente_id })).ok).toBe(false)
      expect(ctx.openEdit).not.toHaveBeenCalled()
    })
  })

  describe('con un diálogo ya abierto', () => {
    const FORM_ABIERTO = 'El formulario ya está abierto: usa llenar_formulario_cliente para cambiar campos.'

    it('abrir_nuevo_cliente no responde "precargado" si el formulario ya estaba abierto', async () => {
      const ctx = pageContext({ isDialogOpen: () => true })
      const result = await tool(buildClientesPageTools(ctx, true), 'abrir_nuevo_cliente').run({
        valores: { nombre_completo: 'Ana' },
      })
      expect(result).toEqual({ ok: false, error: FORM_ABIERTO })
      expect(ctx.openNew).not.toHaveBeenCalled()
    })

    it('abrir_editar_cliente tampoco, y no pide el cliente por la red', async () => {
      const ctx = pageContext({ isDialogOpen: () => true })
      const result = await tool(buildClientesPageTools(ctx, true), 'abrir_editar_cliente').run({
        cliente_id: 99,
        valores: { telefono: '55559999' },
      })
      expect(result).toEqual({ ok: false, error: FORM_ABIERTO })
      expect(ctx.openEdit).not.toHaveBeenCalled()
      expect(ctx.fetchCliente).not.toHaveBeenCalled()
    })

    it('con la confirmación de eliminar abierta no se abre un formulario encima', async () => {
      const ctx = pageContext({ isDeleteOpen: () => true })
      const tools = buildClientesPageTools(ctx, true)
      for (const [name, args] of [
        ['abrir_nuevo_cliente', {}],
        ['abrir_editar_cliente', { cliente_id: 1 }],
        ['abrir_eliminar_cliente', { cliente_id: 1 }],
      ] as const) {
        const result = await tool(tools, name).run(args)
        expect(result, name).toEqual({
          ok: false,
          error: 'Ya hay un diálogo abierto en esta pantalla: el usuario debe cerrarlo antes.',
        })
      }
      expect(ctx.openNew).not.toHaveBeenCalled()
      expect(ctx.openEdit).not.toHaveBeenCalled()
      expect(ctx.openDelete).not.toHaveBeenCalled()
    })

    it('con el formulario abierto tampoco se abre la confirmación de eliminar', async () => {
      const ctx = pageContext({ isDialogOpen: () => true })
      const result = await tool(buildClientesPageTools(ctx, true), 'abrir_eliminar_cliente').run({ cliente_id: 1 })
      expect(result.ok).toBe(false)
      expect(ctx.openDelete).not.toHaveBeenCalled()
    })
  })

  describe('abrir_eliminar_cliente', () => {
    it('solo abre la confirmación existente; el usuario presiona Eliminar', async () => {
      const ctx = pageContext()
      const result = await tool(buildClientesPageTools(ctx, true), 'abrir_eliminar_cliente').run({ cliente_id: 1 })
      expect(ctx.openDelete).toHaveBeenCalledWith(cliente(1))
      expect(result).toMatchObject({ ok: true, data: { mensaje: expect.stringContaining('debe presionar Eliminar') } })
    })

    it('un cliente inexistente no abre nada', async () => {
      const ctx = pageContext({ fetchCliente: vi.fn(async () => { throw new Error('404') }) })
      expect((await tool(buildClientesPageTools(ctx, true), 'abrir_eliminar_cliente').run({ cliente_id: 7 })).ok).toBe(false)
      expect(ctx.openDelete).not.toHaveBeenCalled()
    })

    it('abrir_* están marcadas abreUi para esperar a que el diálogo registre sus tools', () => {
      const tools = buildClientesPageTools(pageContext(), true)
      for (const name of ['abrir_nuevo_cliente', 'abrir_editar_cliente', 'abrir_eliminar_cliente']) {
        expect(tool(tools, name).abreUi).toBe(true)
        expect(tool(tools, name).requiere_confirmacion).toBeUndefined()
      }
    })
  })
})

describe('llenar_formulario_cliente (dentro de ClienteDialog)', () => {
  const valoresActuales: ClienteFormValues = {
    dias_notificacion: [],
    permitir_credito: true,
    nombre_completo: 'Ana López',
    direccion: '',
    telefono: '55559999',
    balance: 0,
    activo: true,
  }

  function dialogContext(overrides: Partial<ClienteDialogAgentContext> = {}) {
    return {
      isAdmin: () => true,
      getCliente: () => null,
      getValues: () => valoresActuales,
      setValues: vi.fn(),
      ...overrides,
    } satisfies ClienteDialogAgentContext
  }

  it('escribe los campos en el formulario y devuelve cómo quedó, sin guardar', () => {
    const ctx = dialogContext()
    const result = fillClienteForm({ telefono: '55559999', nombre_completo: 'Ana López' }, ctx)
    expect(ctx.setValues).toHaveBeenCalledWith({ telefono: '55559999', nombre_completo: 'Ana López' })
    expect(result).toMatchObject({
      ok: true,
      data: { aplicado: { telefono: '55559999' }, valores_actuales: valoresActuales, mensaje: expect.stringContaining('presionar el boton') },
    })
  })

  it('solo el admin puede llenar el formulario', () => {
    const ctx = dialogContext({ isAdmin: () => false })
    expect(fillClienteForm({ telefono: '55559999' }, ctx).ok).toBe(false)
    expect(ctx.setValues).not.toHaveBeenCalled()
  })

  it('descarta password y otros campos no permitidos, avisando', () => {
    const ctx = dialogContext()
    const result = fillClienteForm({ nombre_completo: 'Ana', password: '1234' }, ctx)
    expect(ctx.setValues).toHaveBeenCalledWith({ nombre_completo: 'Ana' })
    expect(result).toMatchObject({ data: { campos_no_permitidos: ['password'] } })
  })

  it('si no hay nada válido, falla y explica por qué', () => {
    const ctx = dialogContext()
    expect(fillClienteForm({ password: '1234' }, ctx)).toEqual({
      ok: false,
      error: 'No hay ningun campo valido para llenar.',
    })
    const malo = fillClienteForm({ balance: -1 }, ctx)
    expect(malo.ok).toBe(false)
    expect(ctx.setValues).not.toHaveBeenCalled()
  })

  it('respeta el crédito bloqueado cuando el cliente editado tiene balance', () => {
    const ctx = dialogContext({ getCliente: () => cliente(2, { balance: 80 }) })
    const result = fillClienteForm({ permitir_credito: false, direccion: 'Zona 5' }, ctx)
    expect(ctx.setValues).toHaveBeenCalledWith({ direccion: 'Zona 5' })
    expect(result).toMatchObject({ data: { notas: [expect.stringMatching(/balance/)] } })
  })

  it('el balance de un cliente nuevo no bloquea el crédito', () => {
    const ctx = dialogContext()
    fillClienteForm({ permitir_credito: false }, ctx)
    expect(ctx.setValues).toHaveBeenCalledWith({ permitir_credito: false })
  })

  it('la tool del diálogo se registra con el nombre del plan', () => {
    expect(buildClienteDialogTools(dialogContext()).map((t) => t.name)).toEqual(['llenar_formulario_cliente'])
  })
})
