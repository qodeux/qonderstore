import { useCallback } from 'react'

const emptyToNull = (v: unknown) => (v === '' || v === undefined ? null : v)

const toNumOrNull = (v: unknown) => {
  if (v === '' || v === undefined || v === null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

type Args = {
  productForm: any
  unitForm: any
  bulkForm: any
  uploadImagesForm: any
}

/**
 * Hook que unifica todos los valores de formularios del producto
 * en un payload estructurado { product, details } para RPCs.
 */
export const useGetCombinedPayload = ({ productForm, unitForm, bulkForm, uploadImagesForm }: Args) => {
  return useCallback(() => {
    const productValues = productForm.getValues()
    const imageValues = uploadImagesForm.getValues() ?? {}

    const saleType: 'unit' | 'bulk' = productValues.sale_type

    const product = {
      name: productValues.name?.trim(),
      slug: productValues.slug?.trim(),
      sku: emptyToNull(productValues.sku),
      category: Number(productValues.category),
      subcategory: productValues.subcategory != null ? Number(productValues.subcategory) : null,
      brand: emptyToNull(productValues.brand),
      description: productValues.description ?? '',
      is_active: Boolean(productValues.is_active ?? true),
      featured: Boolean(productValues.featured ?? false),
      sale_type: saleType,
      images: Array.isArray(imageValues.images) ? imageValues.images : [],
      main_image: emptyToNull(imageValues.main_image)
    }

    const details =
      saleType === 'unit'
        ? (() => {
            const unit = unitForm.getValues()
            return {
              type: 'unit' as const,
              unit: unit.unit,
              base_cost: toNumOrNull(unit.base_cost),
              public_price: toNumOrNull(unit.public_price),
              min_sale: toNumOrNull(unit.min_sale),
              max_sale: toNumOrNull(unit.max_sale),
              low_stock: toNumOrNull(unit.low_stock),
              wholesale_prices: Array.isArray(unit.wholesale_prices) ? unit.wholesale_prices : null
            }
          })()
        : (() => {
            const bulk = bulkForm.getValues()
            return {
              type: 'bulk' as const,
              bulk_units_available: Array.isArray(bulk.bulk_units_available) ? bulk.bulk_units_available : [],
              base_unit: bulk.base_unit,
              base_unit_price: toNumOrNull(bulk.base_unit_price),
              min_sale: toNumOrNull(bulk.min_sale),
              max_sale: toNumOrNull(bulk.max_sale),
              units: bulk.units && typeof bulk.units === 'object' ? bulk.units : null,
              wholesale_prices: bulk.wholesale_prices // ya viene transformado como { [unitKey]: Array<{min,price}> }
            }
          })()

    const payload = { product, details }

    // const parsed = CreateProductPayload.safeParse(payload)
    // if (!parsed.success) {
    //   console.error(parsed.error.flatten())
    //   throw new Error('Payload inválido: ' + parsed.error.message)
    // }

    return payload
  }, [productForm, unitForm, bulkForm, uploadImagesForm])
}
