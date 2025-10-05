import z from 'zod'

// util: '' | null | undefined -> undefined, otro -> Number(valor)
const toNumberOrUndef = (v: unknown) => (v === '' || v === null || v === undefined ? undefined : Number(v))

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string('Obligatorio').min(3, 'El nombre debe tener al menos 3 caracteres'),
  slug: z.string('Obligatorio').min(3, 'El slug debe tener al menos 3 caracteres'),
  sku: z.string().optional(),
  category: z.coerce.number('La categoría es obligatoria').nonnegative().positive(),
  //price: z.number().min(0, 'El precio no puede ser negativo'),
  type_unit: z.enum(['unit', 'bulk'], {
    message: 'La unidad de venta es obligatoria'
  }),
  //stock: z.number().min(0, 'El stock no puede ser negativo'),
  description: z.string().optional(),
  tags: z.string().optional(),
  featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
  brand: z.string().optional()
  //images: z.array(z.string().url('Cada imagen debe ser una URL válida')).optional()
})
export type Product = z.infer<typeof productSchema>

export const productUnitSchema = z
  .object({
    sale_unit: z.enum(['pz', 'pk', 'box'], {
      message: 'La unidad de venta es obligatoria'
    }),

    // 🔑 switches controlados por el form
    lowStockSwitch: z.boolean().default(false),
    minSaleSwitch: z.boolean().default(false),
    maxSaleSwitch: z.boolean().default(false),

    // 🔑 campos numéricos: OPCIONALES; los exigimos abajo si el switch está activo
    low_stock: z.preprocess(toNumberOrUndef, z.number('Ingresa un número válido').min(1, 'El mínimo es 1').optional()),
    min_sale: z.preprocess(toNumberOrUndef, z.number('Ingresa un número válido').min(1, 'El mínimo es 1').optional()),
    max_sale: z.preprocess(toNumberOrUndef, z.number('Ingresa un número válido').min(1, 'El mínimo es 1').optional()),

    base_cost: z.coerce.number('Dato requerido').min(0, 'El costo base no puede ser negativo'),
    public_price: z.coerce.number('Dato requerido').min(0, 'El precio no puede ser negativo')
  })
  .superRefine((val, ctx) => {
    // Reglas condicionales
    if (val.lowStockSwitch && (val.low_stock === undefined || Number.isNaN(val.low_stock))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['low_stock'], message: 'Ingresa el nivel de alerta' })
    }
    if (val.minSaleSwitch && (val.min_sale === undefined || Number.isNaN(val.min_sale))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['min_sale'], message: 'Ingresa el mínimo de compra' })
    }
    if (val.maxSaleSwitch && (val.max_sale === undefined || Number.isNaN(val.max_sale))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['max_sale'], message: 'Ingresa el máximo por transacción' })
    }

    // (opcional) coherencia entre mínimos y máximos si ambos están activos
    if (val.minSaleSwitch && val.maxSaleSwitch && val.min_sale != null && val.max_sale != null) {
      if (val.min_sale > val.max_sale) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['max_sale'], message: 'El máximo debe ser ≥ al mínimo' })
      }
    }
  })

export type ProductUnitFormData = z.infer<typeof productUnitSchema>
