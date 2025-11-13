import { z } from 'zod'
import { requiredString } from '../utils/zod-helpers'

export const checkoutSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  phone: z.string().min(7, 'El teléfono es obligatorio'),
  email: z.union([z.email('El correo electrónico no es válido'), z.literal('')]).optional(),
  postal_code_lookup: z.string().min(5, 'El código postal es obligatorio'),
  postal_code: z.string().min(5, 'El código postal es obligatorio'),
  state: requiredString(),
  locality: requiredString(),
  sublocality: requiredString(),
  street_address: requiredString(),
  street_number: requiredString(),
  interior_number: z.string().optional(),
  delivery_type: z.enum(['standard', 'custom', 'express', 'foreign'], 'Selecciona un tipo de entrega'),
  delivery_date: z.enum(['today', 'tomorrow']),
  delivery_route: requiredString('Selecciona la ruta').optional(),
  shipping_price: z
    .union([z.number().min(100, { message: 'Costo inválido' }).max(999, { message: 'Costo inválido' }), z.nan(), z.undefined(), z.null()])
    .refine((value) => typeof value === 'number' && !Number.isNaN(value), {
      message: 'Requerido'
    }),
  address_notes: z.string().trim().optional(),
  coupon_code: z.string().trim().max(10).optional()
})

export type CheckoutFormInput = z.infer<typeof checkoutSchema>
