import type { DateValue } from '@internationalized/date'
import { getLocalTimeZone } from '@internationalized/date'
import z from 'zod'

const toJSDate = (v: DateValue): Date | null => {
  if (!v) return null
  // CalendarDate: .toDate(timeZone)
  if (typeof v.toDate === 'function') {
    try {
      // CalendarDate requiere zona; ZonedDateTime ignora el arg.
      return v.toDate(getLocalTimeZone?.())
    } catch {
      // Fallback por si es ZonedDateTime sin arg
      try {
        return v.toDate(getLocalTimeZone())
      } catch {
        return null
      }
    }
  }
  return null
}

export const promotionsInputSchema = z.object({
  id: z.string().optional(),

  promo_type: z.enum(['category', 'product'], { error: 'Dato requerido.' }),
  category: z.number().optional(),
  subcategory: z.number().optional(),
  product: z.number().optional(),
  discount_type: z.enum(['season', 'code'], { error: 'Dato requerido.' }),
  frequency: z.enum(['once', 'weekly', 'monthly']).optional(),

  // date: z.array(z.string()).optional(),
  // week_days: z.array(z.string()).optional(),
  // day_month: z.array(z.string()).optional(),

  code: z.string().optional(),
  mode: z.enum(['fixed', 'percentage'], { error: 'Dato requerido.' }),
  mode_value: z.number('Dato requerido.'),

  valid_until: z
    .custom<DateValue>((v) => !!toJSDate(v), {
      message: 'Selecciona una fecha válida'
    })
    .transform((v) => toJSDate(v) as Date) // ahora es Date nativo
    .refine((d) => d >= new Date(), { message: 'La fecha debe ser futura.' }),

  is_active: z.boolean().optional(),
  is_limited: z.boolean().optional(),
  limit_type: z.string().optional().nullable(),
  limit: z.number().optional().nullable(),
  is_conditioned: z.boolean().optional(),
  condition_type: z.string().optional(),
  condition: z.string().optional()
})

export type PromotionsFormValues = z.input<typeof promotionsInputSchema> // valid_until: DateValue
export type PromotionsInput = z.output<typeof promotionsInputSchema> // valid_until: Date
