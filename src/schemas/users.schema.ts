import z from 'zod'

export const userInputSchema = z.object({
  user_name: z.string('El nombre de usuario es obligatorio').min(3, 'Debe tener al menos 3 caracteres'),

  role: z.enum(['admin', 'staff', 'customer'], {
    message: 'El rol es obligatorio'
  }),
  last_activity: z.string().optional(),
  is_active: z.boolean(),
  email: z.email('El correo electrónico no es válido'),
  full_name: z.string().optional(),
  password: z.string('La contraseña es obligatoria').min(6, 'La contraseña debe tener al menos 6 caracteres'),
  phone: z.string().optional()
})

export type UserInput = z.infer<typeof userInputSchema>
