import z from 'zod'
import { emptyToNull } from '../utils/zod-helpers'

export const addressInputSchema = z.object({
  postal_code_lookup: z.string(),
  postal_code: z.string(),
  state: z.string().nonempty(),
  locality: z.string().nonempty(),
  sublocality: z.string(),
  street_address: z.string().nonempty(),
  street_number: z.string().nonempty(),
  has_marker: z.boolean().optional(),
  interior_number: emptyToNull(z.string().optional()),
  is_primary: z.boolean().optional().default(false),
  google_location: z.object({
    lat: z.number(),
    lng: z.number()
  })
})

export type AddressInput = z.infer<typeof addressInputSchema>

export const addressSchema = addressInputSchema.extend({
  id: z.number(),
  created_at: z.string(),
  d_asenta: z.string(),
  D_mnpio: z.string(),
  d_estado: z.string()
})

export type Address = z.infer<typeof addressSchema>
