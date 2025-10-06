import z from 'zod'

export const categoryInputSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  slug_id: z.string().min(1, 'Obligatorio'),
  parent: z.number().optional(),
  featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
  color: z.string().optional()
})
export type CategoryInput = z.infer<typeof categoryInputSchema>

export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug_id: z.string(),
  parent: z.number().optional(),
  parent_name: z.string().nullable().optional(),
  total_products: z.number().optional(),
  featured: z.boolean().optional(),
  is_active: z.boolean(),
  color: z.string().optional()
})

export type Category = z.infer<typeof categorySchema>
