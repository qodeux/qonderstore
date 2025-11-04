import z from 'zod'

const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v)

// Filas de mayoreo
const WholesaleRowLoose = z.object({
  min: z.number().int().min(1, 'El mínimo debe ser mayor o igual a 1').optional(),
  price: z.number().min(0, 'El precio no puede ser negativo').optional()
})

const WholesaleRowStrict = z.object({
  min: z.number().int().min(1, 'El mínimo debe ser mayor o igual a 1'),
  price: z.number().min(0, 'El precio no puede ser negativo')
})

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

    sale_type: z
      .preprocess((v) => (v === undefined ? null : v), z.enum(['unit', 'bulk']).nullable())
      .refine((v) => v !== null, { message: 'Requerido' }),

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

export type ProductDataInput = z.input<typeof productDataInputSchema>
// - Valores que SALEN del schema (después del transform), listos para guardar:
export type ProductDataSubmit = z.output<typeof productDataInputSchema>

const toUndefIfEmpty = (v: unknown) => (v === '' || v === null || v === undefined ? undefined : v)

// Número opcional con mínimo 1, después de normalizar
const optionalPosInt = z.preprocess(toUndefIfEmpty, z.coerce.number('Ingresa un número válido').min(1, 'El mínimo es 1').optional())

export const productUnitInputSchema = z
  .object({
    unit: z.enum(['pz', 'pk', 'box'], {
      message: 'La unidad de venta es obligatoria'
    }),

    base_cost: z.coerce.number().optional(),
    public_price: z.coerce.number('Dato requerido').min(0, 'El precio no puede ser negativo'),

    // switches
    lowStockSwitch: z.preprocess((v) => v ?? false, z.coerce.boolean()).catch(false),
    minSaleSwitch: z.preprocess((v) => v ?? false, z.coerce.boolean()).catch(false),
    maxSaleSwitch: z.preprocess((v) => v ?? false, z.coerce.boolean()).catch(false),
    wholesaleSwitch: z.preprocess((v) => v ?? false, z.coerce.boolean()).catch(false),

    // numéricos opcionales
    low_stock: optionalPosInt,
    min_sale: optionalPosInt,
    max_sale: optionalPosInt,

    wholesale_prices: z.preprocess((v) => (typeof v === 'string' ? JSON.parse(v) : v), z.array(WholesaleRowLoose).default([]))
  })
  .superRefine((val, ctx) => {
    if (val.lowStockSwitch && (val.low_stock === undefined || Number.isNaN(val.low_stock))) {
      ctx.addIssue({ code: 'custom', path: ['low_stock'], message: 'Ingresa el nivel de alerta' })
    }
    if (val.minSaleSwitch && (val.min_sale === undefined || Number.isNaN(val.min_sale))) {
      ctx.addIssue({ code: 'custom', path: ['min_sale'], message: 'Ingresa el mínimo de compra' })
    }
    if (val.maxSaleSwitch && (val.max_sale === undefined || Number.isNaN(val.max_sale))) {
      ctx.addIssue({ code: 'custom', path: ['max_sale'], message: 'Ingresa el máximo por transacción' })
    }
    if (val.minSaleSwitch && val.maxSaleSwitch && val.min_sale != null && val.max_sale != null) {
      if (val.min_sale >= val.max_sale) {
        ctx.addIssue({ code: 'custom', path: ['max_sale'], message: 'El máximo no puede ser menor que el mínimo' })
      }
    }

    if (!val.wholesaleSwitch) return

    const rows = val.wholesale_prices as Array<z.infer<typeof WholesaleRowLoose>>
    if (!Array.isArray(rows) || rows.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['wholesale_prices'],
        message: 'Agrega al menos un precio de mayoreo'
      })
      return
    }

    // Todas las filas deben estar completas
    rows.forEach((r, i) => {
      if (r.min == null) {
        ctx.addIssue({ code: 'custom', path: ['wholesale_prices', i, 'min'], message: 'Requerido' })
      }
      if (r.price == null) {
        ctx.addIssue({ code: 'custom', path: ['wholesale_prices', i, 'price'], message: 'Requerido' })
      }
    })

    // Orden: min no decrece; price no crece
    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1]
      const curr = rows[i]
      if (prev.min != null && curr.min != null && curr.min <= prev.min) {
        ctx.addIssue({ code: 'custom', path: ['wholesale_prices', i, 'min'], message: `Debe ser mayor que ${prev.min}` })
      }
      if (prev.price != null && curr.price != null && curr.price > prev.price) {
        ctx.addIssue({ code: 'custom', path: ['wholesale_prices', i, 'price'], message: `Debe ser menor que ${prev.price}` })
      }
    }
  })
  .transform((val) => {
    let wholesale_prices: Array<z.infer<typeof WholesaleRowStrict>> | null = null

    if (val.wholesaleSwitch) {
      const clean = (val.wholesale_prices ?? [])
        .filter((r) => r.min != null && r.price != null)
        .map((r) => WholesaleRowStrict.parse({ min: r.min, price: r.price }))

      wholesale_prices = clean.length > 0 ? clean : null
    } else {
      wholesale_prices = null
    }

    return {
      ...val,
      wholesale_prices
    }
  })

export type ProductUnitInput = z.input<typeof productUnitInputSchema>
// - Valores que SALEN del schema (después del transform), listos para guardar:
export type ProductUnitSubmit = z.output<typeof productUnitInputSchema>

const unitValueSchema = z.object({
  margin: z.number('Margen requerido').refine((v) => !Number.isNaN(v), 'Margen inválido'),
  price: z
    .number('Precio requerido')
    .min(0, 'El precio no puede ser negativo')
    .refine((v) => !Number.isNaN(v), 'Precio inválido')
})

const unitsSchema = z.preprocess((v) => (v == null ? {} : v), z.record(z.string(), unitValueSchema))
export type BulkUnits = z.output<typeof unitsSchema>

// NOTA: no restrinjas la llave del record con enum, usa string “libre”
export const productBulkInputSchema = z
  .object({
    bulk_units_available: z.array(z.string(), 'Declara al menos una unidad disponible').min(1, 'Declara al menos una unidad disponible'),
    base_unit: z.coerce.string('La unidad base es obligatoria'),
    base_unit_price: z.coerce.number('El precio es obligatorio').min(0, 'El precio no puede ser negativo'),

    minSaleSwitch: z.preprocess((v) => v ?? false, z.coerce.boolean()).catch(false),
    min_sale: optionalPosInt,

    maxSaleSwitch: z.preprocess((v) => v ?? false, z.coerce.boolean()).catch(false),
    max_sale: optionalPosInt,

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

export type ProductBulkInput = z.input<typeof productBulkInputSchema>
// - Valores que SALEN del schema (después del transform), listos para guardar:
export type ProductBulkSubmit = z.output<typeof productBulkInputSchema>

export const productUploadedImageSchema = z
  .object({
    // ENTRADA: string | undefined  -> SALIDA: string | undefined (sin default aquí)
    main_image: z.preprocess(emptyToUndefined, z.coerce.string().min(1, 'Selecciona la imagen principal').optional()),

    // ENTRADA: string[] | undefined -> SALIDA: string[] (por el default)
    images: z.array(z.string().min(1, 'Ruta inválida')).default([]) // 👈 sin .optional()
  })
  .superRefine((val, ctx) => {
    const images = val.images ?? []
    const hasImages = images.length > 0

    // Duplicados
    if (images.length !== new Set(images).size) {
      ctx.addIssue({
        code: 'custom',
        message: 'No repitas imágenes.',
        path: ['images']
      })
    }

    if (hasImages) {
      // main_image obligatoria
      if (!val.main_image) {
        ctx.addIssue({
          code: 'custom',
          message: 'Selecciona la imagen principal.',
          path: ['main_image']
        })
      } else if (!images.includes(val.main_image)) {
        // main_image debe estar dentro de images
        ctx.addIssue({
          code: 'custom',
          message: 'La imagen principal debe estar dentro de "images".',
          path: ['main_image']
        })
      }
    } else {
      // Sin imágenes: no debe venir main_image
      // if (val.main_image) {
      //   ctx.addIssue({
      //     code: 'custom',
      //     message: 'No puedes elegir imagen principal si no has subido imágenes.',
      //     path: ['main_image']
      //   })
      // }
    }
  })

export type ProductUploadedImageInput = z.input<typeof productUploadedImageSchema>
export type ProductUploadedImageSubmit = z.output<typeof productUploadedImageSchema>

export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  sku: z.string(),
  category: z.string(),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  sale_type: z.enum(['unit', 'bulk']),
  units: unitsSchema.optional(),
  base_unit: z.string().optional(),
  unit: z.string().optional(),
  price: z.number(),
  stock: z.number(),
  featured: z.boolean(),
  is_active: z.boolean(),
  brand: z.string().optional(),
  created_at: z.string(),
  images: z.array(z.string()).optional(),
  main_image: z.string().optional()
})

export type Product = z.infer<typeof productSchema>
