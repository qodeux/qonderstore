import { z } from 'zod'
import { requiredString } from '../utils/zod-helpers'

export const checkoutSchema = z
  .object({
    name: z.string().min(2, 'El nombre es obligatorio'),
    phone: z.string().min(10, 'El teléfono es obligatorio'),
    email: z.union([z.email('El correo electrónico no es válido'), z.literal('')]).optional(),
    postal_code_lookup: z.string().min(5, 'El código postal es obligatorio'),
    postal_code: z.string().min(5, 'El código postal es obligatorio'),
    state: requiredString(),
    locality: requiredString(),
    sublocality: requiredString(),
    street_address: requiredString(),
    street_number: requiredString(),
    interior_number: z.string().optional(),
    google_location: z
      .object({
        lat: z.number(),
        lng: z.number()
      })
      .optional(),
    delivery_type: z.enum(['standard', 'custom', 'express', 'foreign', 'pickup'], 'Selecciona un tipo de entrega'),
    delivery_date: z.enum(['today', 'tomorrow']),
    delivery_route: z.enum(['12', '14', '16', '18', '20'], 'Selecciona una ruta de entrega').optional(),
    shipping_price: z
      .number()
      .min(0, 'Costo inválido') // 0 permitido aquí, luego afinamos
      .nullable()
      .optional(),
    address_notes: z.string().trim().optional(),
    coupon_code: z.string().trim().max(10).optional()
  })
  .superRefine((data, ctx) => {
    const { delivery_type, shipping_price } = data

    // Para todo menos pickup → requerido y mínimo 100
    if (delivery_type !== 'pickup') {
      if (shipping_price == null) {
        ctx.addIssue({
          code: 'custom',
          path: ['shipping_price'],
          message: 'Requerido'
        })
        return
      }

      if (shipping_price < 100) {
        ctx.addIssue({
          code: 'custom',
          path: ['shipping_price'],
          message: 'Costo inválido (mínimo 100)'
        })
      }
    }

    // Para pickup → puede ser 0 pero nunca negativo
    if (delivery_type === 'pickup') {
      if (shipping_price != null && shipping_price < 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['shipping_price'],
          message: 'Costo inválido'
        })
      }
    }
  })

export type CheckoutFormInput = z.infer<typeof checkoutSchema>
