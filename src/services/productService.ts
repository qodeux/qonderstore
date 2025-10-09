import supabase from '../lib/supabase'
import type { ProductBulkInput, ProductDataInput, ProductUnitInput } from '../schemas/products.schema'

export const productService = {
  fetchProducts: async () => {
    const { data: products, error } = await supabase.from('products_view').select('*')
    if (error) {
      console.error('Error fetching products:', error)
    }
    return products
  },
  createProduct: async (productData: ProductDataInput) => {
    const { data: productInserted, error: productError } = await supabase
      .from('products')
      .insert([
        {
          name: productData.name,
          slug: productData.slug,
          sku: productData.sku,
          category: productData.category,
          sale_type: productData.type_unit,
          is_active: productData.is_active,
          featured: productData.featured || false,
          description: productData.description,
          //tags: productData.tags,
          brand: productData.brand || null
          //images: productData.images
        }
      ])
      .select()
      .single()

    if (productError) {
      console.error('Error inserting product:', productError)
      return
    }
    return productInserted
  },
  insertProductUnit: async (productId: string, dataProductUnit: ProductUnitInput) => {
    const { data: productUnitInserted, error: productUnitError } = await supabase
      .from('products_unit')
      .insert([
        {
          product_id: productId,
          unit: dataProductUnit.sale_unit,
          base_cost: dataProductUnit.base_cost,
          public_price: dataProductUnit.public_price,
          min_sale: dataProductUnit.min_sale,
          max_sale: dataProductUnit.max_sale,
          low_stock: dataProductUnit.low_stock,
          wholesale_prices: dataProductUnit.wholesale_prices
        }
      ])
      .select()
      .single()

    if (productUnitError) {
      console.error('Error inserting unit data:', productUnitError)
      return
    }
    return productUnitInserted
  },
  insertProductBulk: async (productId: string, dataProductBulk: ProductBulkInput) => {
    const { data: productBulkInserted, error: productBulkError } = await supabase
      .from('products_bulk')
      .insert([
        {
          product_id: productId,
          bulk_units_available: dataProductBulk.bulk_units_available,
          base_unit: dataProductBulk.base_unit,
          base_unit_price: dataProductBulk.base_unit_price,
          min_sale: dataProductBulk.min_sale,
          max_sale: dataProductBulk.max_sale,
          units: dataProductBulk.units
        }
      ])
      .select()
      .single()

    if (productBulkError) {
      console.error('Error inserting bulk data:', productBulkError)
      return
    }
    return productBulkInserted
  },

  deleteProduct: async (productId: string) => {
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (error) {
      console.error('Error deleting product:', error)
    }
  }
}
