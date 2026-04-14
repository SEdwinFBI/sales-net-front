import z from 'zod'

export type AuthCredentials = {
  username: string
  password: string
}

export const authRoleSchema = z.enum(['admin', 'vendedor'])


export const authSessionSchema = z.object({
  token: z.string().trim().min(1, 'La sesion no contiene token.'),
  username: z.string().trim().min(1, 'La sesion no contiene usuario.'),
  role: authRoleSchema,
  permissions: z.array(authRoleSchema).optional(),
  expiresIn: z.number().positive().nullish(),
})

export type AuthSession = z.infer<typeof authSessionSchema>

export type User = Pick<AuthSession, 'username' | 'role'>

export function parseAuthSession(session: unknown): AuthSession {
  return authSessionSchema.parse(session)
}
