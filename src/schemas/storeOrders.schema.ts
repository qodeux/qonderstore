import z from 'zod'

export const storeOrdersSchema = z.object({
  id: z.string(),
  name: z.string(),
  postal_code: z.string(),
  delivery_type: z.string(),
  delivery_date: z.string(),
  total_price: z.number(),
  order_status: z.string()
})

export type storeOrders = z.infer<typeof storeOrdersSchema>
