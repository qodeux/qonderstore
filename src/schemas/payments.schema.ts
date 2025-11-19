import z from 'zod'

export const confirmPaymentSchema = z.object({
  confirm_proof: z
    .union([z.array(z.string().min(1, 'Ruta inválida')), z.undefined()])
    .refine((val) => val !== undefined && val.length > 0, {
      message: 'Se debe cargar un comprobante de pago.'
    }),
  reference: z.string().optional()
})

export type confirmPayment = z.infer<typeof confirmPaymentSchema>

export const paymentsReceivedSchema = z.object({
  id: z.string(),
  order_id: z.string(),
  payment_proof: z.string(),
  reference: z.string().optional(),
  created_at: z.string()
})
export type paymentsReceived = z.infer<typeof paymentsReceivedSchema>
