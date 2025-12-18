import z from 'zod'

export const paymentMethodSchema = z.object({
  id: z.number(),
  type: z.string(),
  bank: z.string(),
  account: z.string(),
  holder_name: z.string()
})
export type PaymentMethod = z.infer<typeof paymentMethodSchema>

export const FAQSchema = z.object({
  id: z.number().optional(),
  question: z.string(),
  answer: z.string(),
  is_active: z.boolean().optional().default(true),
  order: z.number().optional(),
  type: z.string()
})
export type FAQ = z.infer<typeof FAQSchema>

export const ContactValueSchema = z.object({
  section: z.string(),
  key: z.string(),
  label: z.string(),
  value: z.string(),
  order: z.number()
})
export type ContactValue = z.infer<typeof ContactValueSchema>

export const configSchema = z.object({
  id: z.number(),
  module: z.string(),
  data: z.union([paymentMethodSchema, FAQSchema, ContactValueSchema]),
  created_at: z.string(),
  last_update: z.string().optional()
})
export type ConfigDB = z.infer<typeof configSchema>

export const inputPaymentMethodSchema = z.object({
  id: z.number().optional(),
  type: z.string(),
  bank: z.string(),
  account: z.string(),
  holder_name: z.string()
})
export type InputPaymentMethod = z.infer<typeof inputPaymentMethodSchema>

export const inputFAQSchema = z.object({
  id: z.number(),
  question: z.string(),
  answer: z.string(),
  is_active: z.boolean(),
  order: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().min(1, 'Orden debe ser >= 1').optional()
  ),
  type: z.string()
})
export type InputFAQ = z.infer<typeof inputFAQSchema>
