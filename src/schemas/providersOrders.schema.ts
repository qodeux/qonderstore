import z from 'zod'

export const OrderItemSchema = z.object({
  id: z.number().int().positive(),
  qty: z.number().int().nonnegative()
})

export type OrderItem = z.infer<typeof OrderItemSchema>

export const supplyOrderSchema = z.object({
  id: z.number().int().positive(),
  provider_id: z.number().optional(),
  provider_name: z.string(),
  items: z.array(OrderItemSchema),
  created_at: z.string(),
  status: z.string(),
  last_payment: z.string().optional(),
  received_items: z.string().optional(),
  updated_at: z.string().optional()
})

export type SupplyOrder = z.infer<typeof supplyOrderSchema>
