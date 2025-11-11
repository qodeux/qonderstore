import z from 'zod'

export const inventoryAdjustmentSchema = z.object({
  quantity: z
    .any() // acepta lo que venga…
    .refine((v) => v !== undefined && v !== null && String(v).trim() !== '', {
      message: 'Requerida'
    }),
  unit: z.enum(['pz', 'pk', 'box', 'gr', 'oz', 'lb', 'kg'], 'Requerido'),
  add_comment: z.boolean().optional(),
  comment: z.string().max(200).optional()
})

export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>
