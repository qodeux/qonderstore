import z from 'zod'

export const requestPhoneSchema = z.object({
  phone: z
    .string('El teléfono es obligatorio')
    .transform((s) => s.replace(/\D/g, '')) // deja solo dígitos
    .pipe(z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'))
})
export type RequestPhoneInput = z.infer<typeof requestPhoneSchema>

export const requestCodeSchema = z.object({
  code: z.string('Requerido').min(4, 'El código debe tener 4 caracteres').max(4, 'El código debe tener 4 caracteres')
})
export type RequestCodeInput = z.infer<typeof requestCodeSchema>

export const requestAccountDataSchema = z.object({
  alias: z.string('Requerido').min(3, 'Debe tener al menos 3 caracteres'),
  email: z.email('Correo inválido'),
  acceptTerms: z.boolean().refine((val) => val === true, { message: 'Debes aceptar los términos y condiciones' })
})
export type RequestAccountDataInput = z.infer<typeof requestAccountDataSchema>

export const requestDraftSchema = requestPhoneSchema.extend(requestAccountDataSchema.shape)
export type RequestInput = z.infer<typeof requestDraftSchema>

export type RequestDraftPartial = Partial<RequestInput>

export const requestSchema = z.object({
  id: z.number(),
  created_at: z.string(),
  phone: z.string(),
  alias: z.string(),
  email: z.email(),
  accepted_by: z.string().optional(),
  email_verified: z.boolean(),
  invite_code: z.string().optional(),
  status: z.enum(['pending', 'accepted', 'rejected']).optional()
})
