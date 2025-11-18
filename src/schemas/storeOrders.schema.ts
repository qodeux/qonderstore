import z from 'zod'

export const storeOrderSchema = z.object({
  id: z.string(),
  ci: z.number(),
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
  google_location: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  delivery_type: z.enum(['express', 'standard', 'custom', 'foreign']),
  order_status: z.enum(['pending', 'canceled', 'credited', 'paid', 'refunded', 'closed']),
  delivery_date: z.string(),
  items: z
    .object({
      id: z.number(),
      price: z.number(),
      quantity: z.number(),
      saleType: z.enum(['unit', 'bulk']),
      unitSelected: z.string()
    })
    .array(),
  delivery_route: z.enum(['12', '14', '16', '18', '20']),
  coupon_code: z.string(),
  user_id: z.uuid(),
  role: z.string(),
  user_name: z.string(),
  full_name: z.string(),
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
  total_price: z.number(),
  email: z.email(),
  payment_proof: z.string().optional(),
  confirm_proof: z.string().optional(),
  reference: z.string().optional()
})

export type StoreOrder = z.infer<typeof storeOrderSchema>
