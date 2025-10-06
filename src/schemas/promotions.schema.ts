import z from 'zod'

export const promotionsSchema = z.object({
  id: z.string().optional(),
  promo_type: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  discount_type: z.string().min(1, 'Obligatorio'),
  frequency: z.string().optional(),
  mode: z.string().optional(),
  value: z.string().min(0, 'Define el porcentaje o cantidad del descuento'),
  //zona para definir vigencia
  is_active: z.boolean().optional(),
  color: z.string().optional()
  //   id: z.string().optional(),
  //   name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  //   slug_id: z.string().min(1, 'Obligatorio'),
  //   parent: z.number().optional(),
  //   featured: z.boolean().optional(),
  //   is_active: z.boolean().optional(),
  //   color: z.string().optional()
})
export type Promotions = z.infer<typeof promotionsSchema>
