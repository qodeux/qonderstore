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
  switchAddAddress: z.boolean().optional(), // campo extra para el form, no se envía
  postal_code: emptyToUndefined(z.string().min(5, 'El código es invalido')),
  address: emptyToUndefined(z.string()),
  neighborhood: z.coerce.number().optional(),
  neighborhood_data: z.string().optional(), // campo oculto para guardar info extra de la colonia
  city_state: z.string().optional() // campo calculado, no se envia
})
export type ProviderInputContactData = z.infer<typeof providerInputContactDataSchema>

export const providerInputBankDataSchema = z
  .object({
    bank: z.string('Selecciona un banco').min(1, 'Selecciona un banco'),
    account_type: z.enum(['clabe', 'account', 'card']).default('clabe'),
    account: z.string().min(1, 'Dato requerido').min(6, 'Cuenta inválida').transform(stripSpaces),
    holder_name: z.string().min(5, 'El titular debe tener al menos 5 caracteres'),
    rfc: rfcSchema
  })
  .superRefine((val, ctx) => {
    const acc = val.account ?? ''
    if (!acc) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['account'], message: 'Dato requerido' })
      return
    }

    switch (val.account_type) {
      case 'clabe':
        if (acc.length !== 18) {
          ctx.addIssue({ code: 'custom', path: ['account'], message: 'La CLABE debe tener 18 dígitos' })
        }
        break
      case 'account':
        if (acc.length < 10) {
          ctx.addIssue({ code: 'custom', path: ['account'], message: 'La cuenta debe tener al menos 10 dígitos' })
        }
        break
      case 'card':
        if (acc.length !== 16) {
          ctx.addIssue({ code: 'custom', path: ['account'], message: 'La tarjeta debe tener 16 dígitos' })
        }
        break
    }
  })
export type ProviderInputBankData = z.infer<typeof providerInputBankDataSchema>

export const providerInputProductSelectionSchema = z.object({
  selected_products: z.array(z.coerce.number()).min(1, 'Selecciona al menos un producto')
})

export type ProviderInputProductSelection = z.infer<typeof providerInputProductSelectionSchema>

const contactClean = providerInputContactDataSchema.omit({
  switchAddAddress: true,
  neighborhood_data: true,
  city_state: true
})
export const providerCreateSchema = contactClean.and(providerInputBankDataSchema).and(providerInputProductSelectionSchema)

export type ProviderCreateInput = z.infer<typeof providerCreateSchema>

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
  account_type: z.enum(['clabe', 'account', 'card']),
  holder_name: z.string(),
  rfc: z.string(),
  created_at: z.string(),
  is_active: z.boolean(),
  orders: z.number().nullable().optional(),
  last_order: z.string().nullable().optional(),
  last_payment: z.string().nullable().optional(),
  selected_products: z.array(z.coerce.number()).optional()
})

export type Provider = z.infer<typeof providerSchema>
