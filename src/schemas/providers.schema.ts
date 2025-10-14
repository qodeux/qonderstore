import z from 'zod'
import { rfcSchema } from './RFC.schema'

// ---------- Helpers reutilizables ----------
/** Convierte '', null, undefined → undefined y hace trim a strings. */
const emptyToUndefined = <T extends z.ZodTypeAny>(inner: T) =>
  z.preprocess((v) => {
    if (v == null || v === '') return undefined
    if (typeof v === 'string') {
      const t = v.trim()
      return t === '' ? undefined : t
    }
    return v
  }, inner.optional())

/** Igual que arriba pero luego valida con otro esquema (útil para email). */
const optionalVia = <T extends z.ZodTypeAny>(inner: T) => z.preprocess((v) => (v == null || v === '' ? undefined : v), inner.optional())

/** Limpia espacios internos de números de cuenta/teléfono, etc. */
const stripSpaces = (s: string) => s.replace(/\s+/g, '')

export const providerInputContactDataSchema = z.object({
  alias: z.coerce.string().min(1, 'Dato requerido').min(3, 'El alias debe tener al menos 3 caracteres'),
  name: z.string().min(1, 'Dato requerido').min(3, 'El nombre debe tener al menos 3 caracteres'),
  phone: z
    .string()
    .min(1, 'Dato requerido')
    .transform((s) => s.replace(/\D/g, '')) // deja solo dígitos
    .pipe(z.string().min(10, 'El teléfono debe tener al menos 10 dígitos')),
  email: optionalVia(z.string().email('Formato de correo inválido')),
  postal_code: emptyToUndefined(z.string().min(5, 'El código es invalido')),
  address: emptyToUndefined(z.string()),
  neighborhood: z.coerce.number().optional()
})
export type ProviderInputContactData = z.infer<typeof providerInputContactDataSchema>

export const providerInputBankDataSchema = z.object({
  bank: z.string('Selecciona un banco').min(1, 'Selecciona un banco'),
  account_type: z.enum(['clabe', 'cuenta', 'tarjeta']).default('clabe'),
  account: z.string().min(1, 'Dato requerido').min(6, 'Cuenta inválida').optional(),
  holder_name: z.string().min(5, 'El titular debe tener al menos 5 caracteres'),
  rfc: rfcSchema
})
export type ProviderInputBankData = z.infer<typeof providerInputBankDataSchema>

export const providerInputProductSelectionSchema = z.object({
  selected_products: z.array(z.coerce.number()).min(1, 'Selecciona al menos un producto')
})

export type ProviderInputProductSelection = z.infer<typeof providerInputProductSelectionSchema>

export const providerSchema = z.object({
  id: z.number(),
  alias: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  postal_code: z.string().optional(),
  address: z.string().optional(),
  neighborhood: z.number().optional(),
  bank: z.string(),
  account: z.string(),
  account_type: z.enum(['clabe', 'cuenta', 'tarjeta']),
  holder: z.string(),
  rfc: z.string(),
  created_at: z.string(),
  is_active: z.boolean(),
  orders: z.number().nullable().optional(),
  last_order: z.string().nullable().optional(),
  last_payment: z.string().nullable().optional(),
  selected_products: z.array(z.coerce.number()).optional()
})

export type Provider = z.infer<typeof providerSchema>
