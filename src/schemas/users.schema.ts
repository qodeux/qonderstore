import z from 'zod'

const baseUserInput = z.object({
  user_name: z.string('El nombre de usuario es obligatorio').min(3, 'Debe tener al menos 3 caracteres'),
  role: z.enum(['admin', 'staff', 'customer'], { message: 'El rol es obligatorio' }),
  is_active: z.boolean(),
  email: z.email('El correo electrónico no es válido'),
  full_name: z.string().optional(),
  phone: z.string().optional()
})

export const userInputCreateSchema = baseUserInput.extend({
  password: z.string('La contraseña es obligatoria').min(6, 'La contraseña debe tener al menos 6 caracteres')
})
export type UserInputCreate = z.infer<typeof userInputCreateSchema>

const passwordOptional = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional()
)

export const userInputUpdateSchema = baseUserInput.extend({
  password: passwordOptional
})
export type UserInputUpdate = z.infer<typeof userInputUpdateSchema>
