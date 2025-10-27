// schemas/products.ts
import z from 'zod'
import { productBulkInputSchema, productDataInputSchema, productUnitInputSchema, productUploadedImageSchema } from './products.schema' // importa desde donde tengas tus step-schemas
// import type { WholeSaleRow } from '...'; // si quieres el tipo

// --- helpers ---
const toNumOrNull = (v: unknown) => {
  if (v === '' || v === undefined || v === null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const emptyToNull = (v: unknown) => (v === '' || v === undefined ? null : v)

// 1) PRODUCT (base) para el payload
//    Reusa tu productDataInputSchema y mezcla imágenes del step de uploads.
//    Aplica transform para normalizar tipos (subcategory null, etc.)
export const productForPayloadSchema = productDataInputSchema
  .pick({
    name: true,
    slug: true,
    sku: true,
    category: true,
    subcategory: true,
    sale_type: true,
    description: true,
    featured: true,
    is_active: true,
    brand: true
  })
  .merge(
    // imágenes (usa tu schema existente para conservar reglas)
    productUploadedImageSchema.pick({ images: true, main_image: true }).default({ images: [], main_image: undefined })
  )
  .transform((p) => ({
    name: p.name.trim(),
    slug: p.slug.trim(),
    sku: p.sku ?? null,
    category: Number(p.category),
    subcategory: p.subcategory != null ? Number(p.subcategory) : null,
    sale_type: p.sale_type, // 'unit' | 'bulk'
    description: p.description ?? '',
    featured: Boolean(p.featured ?? false),
    is_active: Boolean(p.is_active ?? true),
    // si tu columna brand es bigint en DB, puedes enviar number o string
    brand: p.brand ?? null,
    images: Array.isArray(p.images) ? p.images : [],
    main_image: p.main_image ?? null
  }))

// 2) DETAILS (unit) para el payload
const unitDetailsForPayloadSchema = productUnitInputSchema
  .extend({
    type: z.literal('unit') // 👈 el discriminador debe estar en el input
  })
  .transform((u) => {
    let wholesale: unknown = null
    if (Array.isArray(u.wholesale_prices)) {
      wholesale = u.wholesale_prices
    } else if (typeof u.wholesale_prices === 'string') {
      try {
        const parsed = JSON.parse(u.wholesale_prices)
        wholesale = Array.isArray(parsed) ? parsed : null
      } catch {
        wholesale = null
      }
    } else if (u.wholesale_prices == null) {
      wholesale = null
    }

    return {
      type: 'unit' as const,
      unit: u.unit,
      base_cost: toNumOrNull(u.base_cost),
      public_price: toNumOrNull(u.public_price),
      min_sale: toNumOrNull(u.min_sale),
      max_sale: toNumOrNull(u.max_sale),
      low_stock: toNumOrNull(u.low_stock),
      wholesale_prices: wholesale
    }
  })

// 3) DETAILS (bulk) para el payload
const bulkDetailsForPayloadSchema = productBulkInputSchema
  .extend({
    type: z.literal('bulk') // 👈 idem
  })
  .transform((b) => ({
    type: 'bulk' as const,
    bulk_units_available: Array.isArray(b.bulk_units_available) ? b.bulk_units_available : [],
    base_unit: b.base_unit,
    base_unit_price: toNumOrNull(b.base_unit_price),
    min_sale: toNumOrNull(b.min_sale),
    max_sale: toNumOrNull(b.max_sale),
    units: b.units && typeof b.units === 'object' ? b.units : {}
  }))

// 4) DETAILS discriminado
const detailsDiscriminated = z.discriminatedUnion('type', [unitDetailsForPayloadSchema, bulkDetailsForPayloadSchema])

// 5) PAYLOAD FINAL { product, details }
//    Además, verificamos coherencia: product.sale_type === details.type
export const CreateProductPayload = z
  .object({
    product: productForPayloadSchema,
    details: detailsDiscriminated
  })
  .superRefine((val, ctx) => {
    if (val.product.sale_type !== val.details.type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `El sale_type del producto (${val.product.sale_type}) no coincide con details.type (${val.details.type}).`,
        path: ['details', 'type']
      })
    }
  })

export type ProductRpcPayload = z.infer<typeof CreateProductPayload>
