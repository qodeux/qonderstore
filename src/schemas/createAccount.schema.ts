import z from 'zod'

export const createAccountInputSchema = z
  .object({
    email: z.email(),
    phone: z.string(),
    user_name: z.string(),
    password: z.coerce.string('Requerido').min(6, 'Mínimo 6 caracteres.'),
    password_confirm: z.coerce.string().min(1, 'Requerido'),
    email_verified: z.coerce.boolean()
  })
  .refine((data) => data.password === data.password_confirm, {
    path: ['password_confirm'], // marca el error en este campo
    message: 'Las contraseñas no coinciden.'
  })
export type CreateAccountInput = z.infer<typeof createAccountInputSchema>
