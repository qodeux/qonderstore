import z from 'zod'

export const providerOrderSchema = z.object({
  id: z.number().int().positive(),
  order: z.string().min(1).max(100),
  items: z.string().max(255).nullable().optional()
})

export type providersOrders = z.infer<typeof providerOrderSchema>
