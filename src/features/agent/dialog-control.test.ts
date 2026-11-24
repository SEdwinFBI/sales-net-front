import { describe, expect, it } from 'vitest'
import { readDialogFields, type FieldLike } from './dialog-control'

const campo = (extra: FieldLike): FieldLike => ({ type: 'text', tagName: 'INPUT', ...extra })

describe('readDialogFields', () => {
  it('devuelve lo escrito con el nombre que ve el usuario y se salta lo vacio', () => {
    const fields = [
      campo({ labels: [{ textContent: ' Nombre completo ' }], value: 'Juan Perez' }),
      campo({ name: 'telefono', value: '' }),
      campo({ placeholder: 'Direccion', value: '  Zona 1 ' }),
    ]
    expect(readDialogFields(fields)).toEqual([
      { campo: 'Nombre completo', valor: 'Juan Perez' },
      { campo: 'Direccion', valor: 'Zona 1' },
    ])
  })

  it('nunca incluye contrasenas ni campos con nombre de credencial', () => {
    const fields = [
      campo({ type: 'password', name: 'password', value: 'Secreto123!' }),
      campo({ name: 'contrasena', value: 'Secreto123!' }),
      campo({ labels: [{ textContent: 'Patron de acceso' }], value: '1234' }),
      campo({ id: 'pin', value: '9999' }),
      campo({ name: 'username', value: 'ana' }),
    ]
    const result = readDialogFields(fields)
    expect(JSON.stringify(result)).not.toMatch(/Secreto|1234|9999/)
    expect(result).toEqual([{ campo: 'username', valor: 'ana' }])
  })

  it('checkbox solo si esta marcado, select con el texto elegido, y omite archivos y botones', () => {
    const fields = [
      campo({ type: 'checkbox', name: 'credito', checked: true }),
      campo({ type: 'checkbox', name: 'activo', checked: false }),
      campo({ type: 'file', name: 'foto', value: 'C:/foto.jpg' }),
      campo({ type: 'submit', value: 'Guardar' }),
      campo({ type: undefined, tagName: 'SELECT', name: 'rol', value: 'v', selectedOptions: [{ textContent: 'Vendedor' }] }),
    ]
    expect(readDialogFields(fields)).toEqual([
      { campo: 'credito', valor: 'si' },
      { campo: 'rol', valor: 'Vendedor' },
    ])
  })

  it('recorta valores largos y limita la cantidad de campos', () => {
    const largo = campo({ name: 'observacion', value: 'x'.repeat(200) })
    expect(readDialogFields([largo])[0].valor).toHaveLength(60)
    const muchos = Array.from({ length: 30 }, (_, i) => campo({ name: 'c' + i, value: 'v' }))
    expect(readDialogFields(muchos)).toHaveLength(12)
  })
})
