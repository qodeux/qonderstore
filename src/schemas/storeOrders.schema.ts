import z from 'zod'

export const storeOrderSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  last_update: z.string(),
  name: z.string(),
  phone: z.string(),
  postal_code: z.string(),
  sublocality: z.number(),
  street_address: z.string(),
  street_number: z.string(),
  interior_number: z.string(),
  address_notes: z.string(),
  google_address: z.string(),
  delivery_type: z.enum(['express', 'standard', 'custom', 'foreign']),
  order_status: z.enum(['pending', 'canceled', 'credited', 'paid', 'refunded', 'closed']),
  delivery_date: z.string(),
  items: z.string(),
  delivery_route: z.string(),
  coupon_code: z.string(),
  user_id: z.uuid(),
  ip: z.string(),
  user_agent: z.string(),
  total_items: z.number(),
  shipping_price: z.number(),
  shipment_status: z.enum([
    'pending',
    'processing',
    'ready_for_pickup',
    'picked_up',
    'in_transit',
    'delivered',
    'delivery_failed',
    'canceled'
  ]),
  order_total: z.number(),
  total_price: z.number()
})

export type storeOrder = z.infer<typeof storeOrderSchema>
