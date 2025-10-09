import z from 'zod'
import type { WholeSaleRow } from '../components/forms/admin/ProductUnitForm'

const emptyToUndefined = z.literal('').transform(() => undefined)

const toNullIfEmptyJson = (v: unknown) => {
  if (v == null) return null
  if (Array.isArray(v)) return v.length ? JSON.stringify(v) : null
  if (typeof v === 'string') {
    const s = v.trim()
    if (!s || s === '[]') return null
    return s
  }
  return v
}

export const productDataInputSchema = z.object({
  name: z.string('Obligatorio').min(3, 'El nombre debe tener al menos 3 caracteres'),
  slug: z.string('Obligatorio').min(3, 'El slug debe tener al menos 3 caracteres'),
  sku: z.string().optional(),
  category: z.coerce.number('La categoría es obligatoria').nonnegative().positive(),
  subcategory: z.coerce.number('La subcategoría es obligatoria').nonnegative().positive().optional(),
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
export type ProductDataInput = z.infer<typeof productDataInputSchema>

export const productUnitInputSchema = z
  .object({
    sale_unit: z.enum(['pz', 'pk', 'box'], {
      message: 'La unidad de venta es obligatoria'
    }),

    base_cost: z.coerce.number('Dato requerido').min(0, 'El costo base no puede ser negativo'),
    public_price: z.coerce.number('Dato requerido').min(0, 'El precio no puede ser negativo'),
    // 🔑 switches controlados por el form
    lowStockSwitch: z.boolean().default(false),
    minSaleSwitch: z.boolean().default(false),
    maxSaleSwitch: z.boolean().default(false),
    wholesaleSwitch: z.boolean().default(false),

    // 🔑 campos numéricos: OPCIONALES; los exigimos abajo si el switch está activo
    low_stock: z.union([emptyToUndefined, z.number('Ingresa un número válido').min(1, 'El mínimo es 1').optional()]),
    min_sale: z.union([emptyToUndefined, z.number('Ingresa un número válido').min(1, 'El mínimo es 1').optional()]),
    max_sale: z.union([emptyToUndefined, z.number('Ingresa un número válido').min(1, 'El mínimo es 1').optional()]),

    wholesale_prices: z.preprocess(toNullIfEmptyJson, z.string().nullable()).default(null)
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

    // 🔹 Validación genérica de mayoreo (un solo mensaje)
    if (!val.wholesaleSwitch) return

    let rows: Array<{ min?: unknown; price?: unknown }>
    try {
      rows = JSON.parse(val.wholesale_prices ?? '[]')
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['wholesale_prices'],
        message: 'Datos de mayoreo incompletos o inválidos'
      })
      return
    }

    let invalid = false
    if (!Array.isArray(rows) || rows.length === 0) invalid = true

    let prevMin: number | null = null
    let prevPrice: number | null = null

    for (const r of rows) {
      const nMin = Number((r as WholeSaleRow)?.min)
      const nPrice = Number((r as WholeSaleRow)?.price)

      // requeridos y números válidos
      if (!Number.isFinite(nMin) || !Number.isFinite(nPrice)) {
        invalid = true
        break
      }
      // límites básicos (ajusta si quieres permitir 0)
      if (nMin < 1 || nPrice < 0) {
        invalid = true
        break
      }
      // orden: min no decrece, price no crece
      if (prevMin !== null && nMin < prevMin) {
        invalid = true
        break
      }
      if (prevPrice !== null && nPrice > prevPrice) {
        invalid = true
        break
      }

      prevMin = nMin
      prevPrice = nPrice
    }

    if (invalid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['wholesale_prices'],
        message: 'Datos de mayoreo incompletos o inválidos'
      })
    }
  })

export type ProductUnitInput = z.infer<typeof productUnitInputSchema>

export const productBulkInputSchema = z.object({
  base_unit: z.string('La unidad base es obligatoria'),
  base_unit_price: z.number('El precio es obligatorio').min(0, 'El precio no puede ser negativo')
})

export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  sku: z.string(),
  category: z.string(),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  sale_type: z.enum(['unit', 'bulk']),
  price: z.number(),
  stock: z.number().optional(),
  featured: z.boolean(),
  is_active: z.boolean(),
  brand: z.string().optional(),
  created_at: z.string()
})

export type Product = z.infer<typeof productSchema>
