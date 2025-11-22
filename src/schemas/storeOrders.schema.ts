import z from 'zod'
import { emptyToNull } from '../utils/zod-helpers'

// export const storeOrderItemSchema = z.object({
//   id: number;
//   discount: number;
//   quantity: number;
//   price: number;
//     saleType: SaleType;
//     unitSelected: string
// })

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
      discount: z.number(),
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
  reference: z.string().optional(),
  order_count: z.number(),
  has_order_rating: z.boolean().optional()
})

export type StoreOrder = z.infer<typeof storeOrderSchema>

export const storeOrderRatingSchema = z.object({
  order_id: z.string(),
  total_points: z.number(),
  rating_overall: z.number().min(1).max(5),
  rating_product_quality: z.number().min(1).max(5),
  comment: z.string().optional()
})
export type StoreOrderRating = z.infer<typeof storeOrderRatingSchema>

export const productRatingSchema = z.object({
  product_id: z.number(),
  order_id: z.string(),
  rating_score: z.number().min(1).max(5),
  rating_comment: emptyToNull(z.string().optional())
})

export type ProductRating = z.infer<typeof productRatingSchema>
