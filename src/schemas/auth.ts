import { z } from 'zod'
export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, { message: 'El identificador es obligatorio' })
    .min(3, { message: 'El identificador debe tener al menos 3 caracteres' })
    .max(20, { message: 'El identificador no debe exceder los 20 caracteres' }),
  password: z
    .string()
    .min(1, { message: 'La contraseña es obligatoria' })
    .min(4, { message: 'La contraseña debe tener al menos 6 caracteres' })
})

export type LoginData = z.infer<typeof loginSchema>
