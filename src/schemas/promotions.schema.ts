import z from 'zod'

export const promotionsSchema = z.object({
  id: z.string().optional(),

  promo_type: z.string('Dato requerido.'),
  category: z.number().optional(),
  subcategory: z.string().optional(),
  products: z.string('Dato necesario'),
  discount_type: z.string('Dato obligatorio'),
  frequency: z.string().optional(),

  date: z.array(z.string()).optional(),
  week_days: z.array(z.string()).optional(),
  day_month: z.array(z.string()).optional(),

  code: z.string().optional(),
  mode: z.string('Dato requerido.'),
  mode_value: z.number('Dato requerido.'),
  valid_until: z.string().optional(),
  is_active: z.boolean().optional(),
  is_limited: z.boolean().optional(),
  limit_type: z.string().optional().nullable(),
  limit: z.number().optional().nullable(),
  is_conditioned: z.boolean().optional(),
  condition_type: z.string().optional(),
  condition: z.string().optional()
})
export type Promotions = z.infer<typeof promotionsSchema>
