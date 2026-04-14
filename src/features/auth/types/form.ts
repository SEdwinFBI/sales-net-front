import type z from 'zod'
import type { loginSchema } from '@/features/auth/utils/schema'

export type LoginFormValues = z.infer<typeof loginSchema>
