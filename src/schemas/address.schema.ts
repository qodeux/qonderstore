import z from 'zod'

export const addressSchema = z.object({
  postal_code: z.string(),
  state: z.string(),
  locality: z.string(),
  sublocality: z.string(),
  street_address: z.string(),
  street_number: z.string(),
  interior_number: z.string().optional()
})

export type Address = z.infer<typeof addressSchema>
