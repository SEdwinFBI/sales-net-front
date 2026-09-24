import type { ReactElement, ReactNode } from 'react'
import { isValidElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import HorarioCobrosSection from './HorarioCobrosSection'

const state = vi.hoisted(() => ({
  slots: [] as unknown[], cursor: 0,
  data: {
    dias_notificacion: [4], hora_notificacion: '07:15',
    horas_notificacion: ['07:15', '12:00'], zona_horaria: 'America/Guatemala',
    ultima_fecha_envio: '2026-09-24', ultimo_envio: null,
  },
  save: vi.fn(),
}))
vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useState: (initial: unknown) => {
    const index = state.cursor++
    if (!(index in state.slots)) state.slots[index] = initial
    return [state.slots[index], (value: unknown) => { state.slots[index] = value }]
  },
}))
vi.mock('../hooks/useHorarioCobros', () => ({
  useHorarioCobros: () => ({ data: state.data, isPending: false, isError: false }),
  useUpdateHorarioCobros: () => ({ mutateAsync: state.save, isPending: false }),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }))

// Inspección del árbol y de los eventos del componente sin montar los controles de UI.
type Props = { children?: ReactNode; [key: string]: unknown }
function elements(node: ReactNode): ReactElement<Props>[] {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!isValidElement<Props>(node)) return []
  return [node, ...elements(node.props.children)]
}
function render() {
  state.cursor = 0
  return elements(HorarioCobrosSection())
}
function control(label: string) {
  return render().find(node => node.props['aria-label'] === label)!
}
function click(label: string) {
  (control(label).props.onClick as () => void)()
}
function change(label: string, value: string) {
  (control(label).props.onChange as (event: { target: { value: string } }) => void)({ target: { value } })
}

describe('horarios de cobros en el formulario existente', () => {
  beforeEach(() => {
    state.slots = []
    vi.clearAllMocks()
    state.save.mockResolvedValue(state.data)
  })

  it('carga cada alarma y permite agregar una hora próxima y guardarla', async () => {
    expect(control('Hora de envío 1').props.value).toBe('07:15')
    expect(control('Hora de envío 2').props.value).toBe('12:00')
    click('Agregar horario')
    change('Hora de envío 3', '07:20')
    const form = render().find(node => node.type === 'form')!
    ;(form.props.onSubmit as (event: { preventDefault: () => void }) => void)({ preventDefault: vi.fn() })
    expect(state.save).toHaveBeenCalledWith({ dias_notificacion: [4], horas_notificacion: ['07:15', '07:20', '12:00'] })
  })

  it('bloquea el guardado con horas vacías o duplicadas', () => {
    click('Agregar horario')
    const submit = () => render().find(node => node.props.type === 'submit')!
    expect(submit().props.disabled).toBe(true)
    change('Hora de envío 3', '07:15')
    expect(submit().props.disabled).toBe(true)
    change('Hora de envío 3', '17:30')
    expect(submit().props.disabled).toBe(false)
  })

  it('quita un horario sin alterar el otro y permite descartar cambios', () => {
    click('Quitar horario 1')
    expect(control('Hora de envío 1').props.value).toBe('12:00')
    expect(control('Quitar horario 1').props.disabled).toBe(true)
    const discard = render().find(node => node.props.children === 'Descartar cambios')!
    ;(discard.props.onClick as () => void)()
    expect(control('Hora de envío 1').props.value).toBe('07:15')
    expect(control('Hora de envío 2').props.value).toBe('12:00')
  })
})
