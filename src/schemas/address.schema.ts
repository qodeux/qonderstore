import z from 'zod'

export const addressInputSchema = z.object({
  id: z.number().optional(),
  postal_code_lookup: z.string(),
  postal_code: z.string(),
  state: z.string().nonempty(),
  locality: z.string().nonempty(),
  sublocality: z.string(),
  street_address: z.string().nonempty(),
  street_number: z.string().nonempty(),
  has_marker: z.boolean().optional(),
  interior_number: z.string().optional(),
  is_primary: z.boolean(),
  google_location: z.object({
    lat: z.number(),
    lng: z.number()
  })
})

export type AddressInput = z.output<typeof addressInputSchema>

export const addressSchema = addressInputSchema.extend({
  id: z.number(),
  created_at: z.string(),
  d_asenta: z.string(),
  D_mnpio: z.string(),
  d_estado: z.string()
})

export type Address = z.infer<typeof addressSchema>
