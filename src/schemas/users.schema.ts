import z from 'zod'

export const userInputSchema = z.object({
  id: z.number().optional(),
  user_name: z.string('El nombre de usuario es obligatorio'),
  role: z.string('El rol de usuario es obligatorio'),
  last_activity: z.string(),
  is_active: z.boolean(),
  email: z.string('El email es obligatorio'),
  full_name: z.string('El nombre completo es obligatorio'),
  phone: z.string().optional()
})

export type UserInput = z.infer<typeof userInputSchema>
