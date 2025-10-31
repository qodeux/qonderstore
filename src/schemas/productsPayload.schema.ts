// schemas/products.ts
import z from 'zod'
import { productBulkInputSchema, productDataInputSchema, productUnitInputSchema, productUploadedImageSchema } from './products.schema'

// Helpers
const toNumOrNull = (v: unknown) => {
  if (v === '' || v === undefined || v === null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// ---------- product (base) ----------
const ProductBase = productDataInputSchema.pick({
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

const ImagesPart = productUploadedImageSchema.pick({ images: true, main_image: true }).default({ images: [], main_image: undefined })

export const productForPayloadSchema = ProductBase.and(ImagesPart) // <- reemplazo de .merge en Zod v4
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
    brand: p.brand ?? null, // si en DB es bigint, ajusta si necesitas string
    images: Array.isArray(p.images) ? p.images : [],
    main_image: p.main_image ?? null
  }))

// ---------- details: unit ----------
const unitDetailsForPayloadSchema = productUnitInputSchema.and(z.object({ type: z.literal('unit') })).transform((u) => ({
  type: 'unit' as const,
  unit: u.unit,
  base_cost: toNumOrNull(u.base_cost),
  public_price: toNumOrNull(u.public_price),
  min_sale: toNumOrNull(u.min_sale),
  max_sale: toNumOrNull(u.max_sale),
  low_stock: toNumOrNull(u.low_stock),
  wholesale_prices: u.wholesale_prices // Array<{min,price}> | null (ya transformado por el schema)
}))

// ---------- details: bulk ----------
const bulkDetailsForPayloadSchema = productBulkInputSchema.and(z.object({ type: z.literal('bulk') })).transform((b) => ({
  type: 'bulk' as const,
  bulk_units_available: Array.isArray(b.bulk_units_available) ? b.bulk_units_available : [],
  base_unit: b.base_unit,
  base_unit_price: toNumOrNull(b.base_unit_price),
  min_sale: toNumOrNull(b.min_sale),
  max_sale: toNumOrNull(b.max_sale),
  units: b.units && typeof b.units === 'object' ? b.units : {}
}))

// ---------- union (NO discriminatedUnion por ser Effects) ----------
const detailsUnion = z.union([unitDetailsForPayloadSchema, bulkDetailsForPayloadSchema])

// ---------- payload final ----------
export const CreateProductPayload = z
  .object({
    product: productForPayloadSchema, // tu schema base ya mostrado antes
    details: detailsUnion // <- usa union aquí
  })
  .superRefine((val, ctx) => {
    if (val.product.sale_type !== val.details.type) {
      ctx.addIssue({
        code: 'custom',
        message: `El sale_type del producto (${val.product.sale_type}) no coincide con details.type (${val.details.type}).`,
        path: ['details', 'type']
      })
    }
  })

// Tipos de salida (post-transform)
export type UnitDetailsForPayload = z.output<typeof unitDetailsForPayloadSchema>
export type BulkDetailsForPayload = z.output<typeof bulkDetailsForPayloadSchema>
export type DetailsForPayload = z.output<typeof detailsUnion>

// 👉 Este es el tipo que debes pasar a Supabase RPC:
export type ProductRpcPayload = z.output<typeof CreateProductPayload>
