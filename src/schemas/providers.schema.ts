import z from 'zod'

export const providerInputSchema = z.object({
  id: z.number().optional(),
  alias: z.string().min(3, 'El alias debe tener al menos 3 caracteres'),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 caracteres'),
  email: z.email('Email inválido'),
  postal_code: z.string().optional(),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres').optional(),
  neighborhood: z.number().optional(),
  is_active: z.boolean().optional()
})
export type ProviderInput = z.infer<typeof providerInputSchema>

export const providerSchema = z.object({
  id: z.number(),
  alias: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  postal_code: z.string().optional(),
  address: z.string().optional(),
  neighborhood: z.string().optional(),
  bank: z.string(),
  account: z.string().optional(),
  holder: z.string().optional(),
  rfc: z.string().optional(),
  created_at: z.string(),
  is_active: z.boolean(),
  orders: z.number().nullable().optional(),
  last_order: z.string().nullable().optional(),
  last_payment: z.string().nullable().optional()
})

export type Provider = z.infer<typeof providerSchema>
