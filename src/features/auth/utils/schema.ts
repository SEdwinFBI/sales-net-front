import z from 'zod'

export const loginSchema = z.object({
  username: z.string().min(4, 'Ingresa un usuario valido'),
  password: z.string().min(4, 'La clave demo requiere minimo 4 caracteres'),
})
