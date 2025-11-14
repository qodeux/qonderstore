import z from 'zod'

export const brandInputSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z.string().min(2, 'El slug debe tener al menos 2 caracteres'),
  color: z.string().nullable().optional()
})

export type BrandInput = z.infer<typeof brandInputSchema>

export const brandSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  color: z.string().optional(),
  logo: z.string().optional(),
  total_products: z.number()
})

export type Brand = z.infer<typeof brandSchema>
