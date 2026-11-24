import { describe, expect, it, vi } from 'vitest'
import { actionLabel, applyAgentServerMessage } from './useAgentSocket'

describe('actionLabel', () => {
  it('nombra las consultas que ejecuta el back', () => {
    expect(actionLabel('consultar_ventas')).toBe('Consultando ventas…')
    expect(actionLabel('consultar_equipo_sucursal')).toBe('Consultando equipo de la sucursal…')
    for (const name of ['consultar_abonos', 'consultar_clientes', 'consultar_stock', 'consultar_precios_especiales', 'consultar_cajas']) {
      expect(actionLabel(name)).toMatch(/^Consultando/)
    }
    expect(actionLabel('consultar_otra_cosa')).toBe('Consultando…')
  })

  it('usa el prefijo para las tools de pantalla y un texto genérico para el resto', () => {
    expect(actionLabel('filtrar_cobros')).toBe('Aplicando filtros…')
    expect(actionLabel('algo_raro')).toBe('Ejecutando…')
  })
})

describe('applyAgentServerMessage', () => {
  it('muestra la etiqueta de tool_progress sin ejecutar tool ni enviar tool_result', () => {
    const pushMessage = vi.fn()
    const executeTool = vi.fn()
    const sendToolResult = vi.fn()
    const streamingId = { current: 4 }

    applyAgentServerMessage(
      { type: 'tool_progress', name: 'consultar_ventas' },
      {
        streamingId,
        assistantText: { current: '' },
        nextMessageId: () => 5,
        setMessages: vi.fn(),
        pushMessage,
        setBusy: vi.fn(),
        executeTool,
        getTools: () => [],
        sendToolResult,
      },
    )

    expect(streamingId.current).toBeNull()
    expect(pushMessage).toHaveBeenCalledWith('action', 'Consultando ventas…')
    expect(executeTool).not.toHaveBeenCalled()
    expect(sendToolResult).not.toHaveBeenCalled()
  })
})
