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

export const productDataInputSchema = z
  .object({
    name: z.string({ error: 'Obligatorio' }).min(3, { error: 'El nombre debe tener al menos 3 caracteres' }),
    slug: z.string({ error: 'Obligatorio' }).min(3, { error: 'El slug debe tener al menos 3 caracteres' }),
    sku: z.string().optional(),

    category: z.coerce
      .number({ error: 'La categoría es obligatoria' })
      .int({ error: 'Selecciona una categoría válida' })
      .positive({ error: 'Selecciona una categoría válida' }),

    hasChildren: z.boolean().default(false),

    subcategory: z.optional(
      z.preprocess(
        (v) => (v === '' || v === null ? undefined : v),
        z.coerce
          .number({ error: 'La subcategoría es obligatoria' })
          .int({ error: 'Selecciona una subcategoría válida' })
          .positive({ error: 'Selecciona una subcategoría válida' })
      )
    ),

    sale_type: z.enum(['unit', 'bulk'], { error: 'La unidad de venta es obligatoria' }),

    description: z.string().optional(),
    // tags: z.string().optional(),
    featured: z.boolean().optional(),
    is_active: z.boolean().optional(),
    brand: z.coerce.number().optional()
  })
  .superRefine((val, ctx) => {
    if (val.hasChildren && val.subcategory == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['subcategory'],
        message: 'Selecciona una subcategoría'
      })
    }
  })

export type ProductDataInput = z.infer<typeof productDataInputSchema>

const toUndefIfEmpty = (v: unknown) => (v === '' || v === null || v === undefined ? undefined : v)

// Número opcional con mínimo 1, después de normalizar
const optionalPosInt = z.preprocess(toUndefIfEmpty, z.coerce.number('Ingresa un número válido').min(1, 'El mínimo es 1').optional())

export const productUnitInputSchema = z
  .object({
    unit: z.enum(['pz', 'pk', 'box'], {
      message: 'La unidad de venta es obligatoria'
    }),

    base_cost: z.coerce.number('Dato requerido').min(0, 'El costo base no puede ser negativo'),
    public_price: z.coerce.number('Dato requerido').min(0, 'El precio no puede ser negativo'),
    // switches: si no vienen de la DB, blíndalos a false
    lowStockSwitch: z.preprocess((v) => v ?? false, z.coerce.boolean()).catch(false),
    minSaleSwitch: z.preprocess((v) => v ?? false, z.coerce.boolean()).catch(false),
    maxSaleSwitch: z.preprocess((v) => v ?? false, z.coerce.boolean()).catch(false),
    wholesaleSwitch: z.preprocess((v) => v ?? false, z.coerce.boolean()).catch(false),

    // numéricos opcionales, sin union/literal
    low_stock: optionalPosInt,
    min_sale: optionalPosInt,
    max_sale: optionalPosInt,

    wholesale_prices: z.preprocess(toNullIfEmptyJson, z.string().nullable()).default(null)
  })
  .superRefine((val, ctx) => {
    // Reglas condicionales
    if (val.lowStockSwitch && (val.low_stock === undefined || Number.isNaN(val.low_stock))) {
      ctx.addIssue({ code: 'custom', path: ['low_stock'], message: 'Ingresa el nivel de alerta' })
    }
    if (val.minSaleSwitch && (val.min_sale === undefined || Number.isNaN(val.min_sale))) {
      ctx.addIssue({ code: 'custom', path: ['min_sale'], message: 'Ingresa el mínimo de compra' })
    }
    if (val.maxSaleSwitch && (val.max_sale === undefined || Number.isNaN(val.max_sale))) {
      ctx.addIssue({ code: 'custom', path: ['max_sale'], message: 'Ingresa el máximo por transacción' })
    }

    // (opcional) coherencia entre mínimos y máximos si ambos están activos
    if (val.minSaleSwitch && val.maxSaleSwitch && val.min_sale != null && val.max_sale != null) {
      if (val.min_sale > val.max_sale) {
        ctx.addIssue({ code: 'custom', path: ['max_sale'], message: 'El máximo debe ser ≥ al mínimo' })
      }
    }

    // 🔹 Validación genérica de mayoreo (un solo mensaje)
    if (!val.wholesaleSwitch) return

    let rows: Array<{ min?: unknown; price?: unknown }>
    try {
      rows = JSON.parse(val.wholesale_prices ?? '[]')
    } catch {
      ctx.addIssue({
        code: 'custom',
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
        code: 'custom',
        path: ['wholesale_prices'],
        message: 'Datos de mayoreo incompletos o inválidos'
      })
    }
  })

export type ProductUnitInput = z.infer<typeof productUnitInputSchema>

const unitValueSchema = z.object({
  margin: z.number('Margen requerido').refine((v) => !Number.isNaN(v), 'Margen inválido'),
  price: z
    .number('Precio requerido')
    .min(0, 'El precio no puede ser negativo')
    .refine((v) => !Number.isNaN(v), 'Precio inválido')
})

const unitsSchema = z.preprocess((v) => (v == null ? {} : v), z.record(z.string(), unitValueSchema))

// NOTA: no restrinjas la llave del record con enum, usa string “libre”
export const productBulkInputSchema = z
  .object({
    bulk_units_available: z.array(z.string(), 'Declara al menos una unidad disponible').min(1, 'Declara al menos una unidad disponible'),
    base_unit: z.string('La unidad base es obligatoria'),
    base_unit_price: z.number('El precio es obligatorio').min(0, 'El precio no puede ser negativo'),

    minSaleSwitch: z.preprocess((v) => v ?? false, z.coerce.boolean()).catch(false),
    min_sale: optionalPosInt,

    maxSaleSwitch: z.preprocess((v) => v ?? false, z.coerce.boolean()).catch(false),
    max_sale: optionalPosInt,

    // <-- SOLO OBJETO
    units: unitsSchema
  })
  .superRefine((val, ctx) => {
    if (val.minSaleSwitch && (val.min_sale == null || Number.isNaN(val.min_sale))) {
      ctx.addIssue({
        code: 'custom',
        path: ['min_sale'],
        message: 'Campo requerido al activar'
      })
    }
    if (val.maxSaleSwitch && (val.max_sale == null || Number.isNaN(val.max_sale))) {
      ctx.addIssue({
        code: 'custom',
        path: ['max_sale'],
        message: 'Campo requerido al activar'
      })
    }
    if (val.minSaleSwitch && val.maxSaleSwitch && val.min_sale != null && val.max_sale != null && val.min_sale > val.max_sale) {
      ctx.addIssue({
        code: 'custom',
        path: ['min_sale'],
        message: 'No puede ser mayor que el máximo'
      })
    }
    if (val.minSaleSwitch && val.maxSaleSwitch && val.min_sale != null && val.max_sale != null && val.min_sale == val.max_sale) {
      ctx.addIssue({
        code: 'custom',
        path: ['min_sale'],
        message: 'Los valores no pueden ser iguales'
      })
    }

    // 3) Validación CONDICIONAL de units
    const selected = new Set(val.bulk_units_available)
    const expectedKeys = [...selected].filter((u) => u !== val.base_unit)
    const unitKeys = Object.keys(val.units)

    if (expectedKeys.length === 0) {
      // Solo base seleccionada -> units debe venir vacío
      if (unitKeys.length > 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['units'],
          message: 'No se esperan ajustes por unidad cuando solo está la unidad base.'
        })
      }
      return
    }

    // Hay ≥ 2 unidades seleccionadas -> exigir EXACTAMENTE las no base
    for (const k of expectedKeys) {
      if (!val.units[k]) {
        ctx.addIssue({
          code: 'custom',
          path: ['units'],
          message: `Falta configuración para la unidad "${k}".`
        })
      }
    }
    for (const k of unitKeys) {
      if (!expectedKeys.includes(k)) {
        ctx.addIssue({
          code: 'custom',
          path: ['units', k],
          message: `Unidad "${k}" no corresponde a las unidades seleccionadas (debe ser alguna de: ${expectedKeys.join(', ')}).`
        })
      }
    }

    // 4) Error genérico si algún item carece de margen/precio (defensa extra)
    const hasGenericIssue = Object.values(val.units).some(
      (u) => u == null || u.margin == null || u.price == null || Number.isNaN(u.margin) || Number.isNaN(u.price)
    )
    if (hasGenericIssue) {
      ctx.addIssue({
        code: 'custom',
        path: ['units'],
        message: 'Completa margen y precio en cada unidad.'
      })
    }
  })

export type ProductBulkInput = z.infer<typeof productBulkInputSchema>

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
