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

const weekDayEnum = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])

const FrequencyOnce = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD') })
const FrequencyWeekly = z.array(weekDayEnum).min(1, 'Selecciona al menos un día')
const FrequencyMonthly = z.object({ day: z.number().int().min(1).max(31) })

export const promotionsInputSchema = z
  .object({
    name: z.string('Dato requerido.').min(1, 'Dato requerido.'),
    promo_type: z.enum(['category', 'product'], { error: 'Dato requerido.' }),
    category: z.coerce.number().optional(),
    subcategory: z.coerce.number().optional(),
    product: z.number().optional(),
    discount_type: z.enum(['season', 'code'], { error: 'Dato requerido.' }),
    frequency: z.enum(['once', 'weekly', 'monthly', 'select']).optional(),
    frequency_value: z.union([FrequencyOnce, FrequencyWeekly, FrequencyMonthly]).nullable().optional(),

    // date: z.array(z.string()).optional(),
    // week_days: z.array(z.string()).optional(),
    // day_month: z.array(z.string()).optional(),

    code: z.string().min(2, 'El código debe tener al menos 4 caracteres.').optional(),
    mode: z.enum(['fixed', 'percentage', 'free'], { error: 'Dato requerido.' }),
    mode_value: z.number('Dato requerido.'),

    valid_until: z
      .custom<DateValue>((v) => !!toJSDate(v), {
        message: 'Selecciona una fecha válida'
      })
      .transform((v) => toJSDate(v) as Date) // ahora es Date nativo
      .refine((d) => d >= new Date(), { message: 'La fecha debe ser futura.' }),

    is_active: z.boolean().optional(),
    is_limited: z.boolean().optional(),
    limit_type: z.enum(['user', 'global']).optional().nullable(),
    limit: z.coerce.number().optional(),
    is_conditioned: z.boolean().optional(),
    condition_type: z.enum(['min_sale', 'quantity']).optional(),
    condition: z.coerce.number().optional(),
    promo_type_target_id: z.coerce.number('Debes seleccionar un elemento')
  })
  .superRefine((val, ctx) => {
    // Reglas solo si el descuento es por temporada
    if (val.discount_type === 'season') {
      if (!val.frequency) {
        ctx.addIssue({ code: 'custom', message: 'La frecuencia es obligatoria', path: ['frequency'] })
        return
      }
      if (val.frequency_value == null) {
        ctx.addIssue({ code: 'custom', message: 'Debes definir frequency_value', path: ['frequency_value'] })
        return
      }
      // Chequeo de coherencia entre frequency y frequency_value:
      const fv = val.frequency_value as unknown
      if (val.frequency === 'once' && !('date' in (fv as any))) {
        ctx.addIssue({ code: 'custom', message: 'Se espera {"date":"YYYY-MM-DD"}', path: ['frequency_value'] })
      }
      if (val.frequency === 'weekly' && !Array.isArray(fv)) {
        ctx.addIssue({ code: 'custom', message: 'Se espera ["mon","tue",…]', path: ['frequency_value'] })
      }
      if (val.frequency === 'monthly' && !('day' in (fv as any))) {
        ctx.addIssue({ code: 'custom', message: 'Se espera {"day":1..31}', path: ['frequency_value'] })
      }
    } else {
      // Si no es season, asegúrate de no mandar basura
      if (val.frequency_value != null) {
        ctx.addIssue({ code: 'custom', message: 'frequency_value debe estar vacío si no es por temporada', path: ['frequency_value'] })
      }
    }
  })

export type PromotionsFormValues = z.input<typeof promotionsInputSchema> // valid_until: DateValue
export type PromotionsInput = z.output<typeof promotionsInputSchema> // valid_until: Date

export const promotionSchema = z.object({
  id: z.number(),
  name: z.string(),
  promo_type: z.enum(['category', 'product']),
  promo_type_target_id: z.coerce.number(),
  discount_type: z.enum(['season', 'code']),
  code: z.string().optional(),
  frequency: z.enum(['once', 'weekly', 'monthly', 'select']),
  frequency_value: z.object().optional(),
  mode: z.enum(['percentage', 'fixed', 'free']),
  mode_value: z.number(),
  valid_until: z.string().optional(),
  is_active: z.boolean(),
  is_limited: z.boolean(),
  limit_type: z.enum(['user', 'global']).optional(),
  limit: z.number().optional(),
  is_conditioned: z.boolean(),
  condition_type: z.enum(['min_sale', 'quantity']).optional(),
  condition: z.number().optional(),
  condition_product: z.number().optional(),
  created_at: z.string()
})

export type Promotion = z.infer<typeof promotionSchema>
