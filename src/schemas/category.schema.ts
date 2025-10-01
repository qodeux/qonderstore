import z from 'zod'

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  slug_id: z.string().min(1, 'Obligatorio'),
  parent: z.number().optional(),
  featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
  color: z.string().optional()
})
export type Category = z.infer<typeof categorySchema>
