import supabase from '../lib/supabase'
import type { Product, ProductBulkInput, ProductDataInput, ProductUnitInput } from '../schemas/products.schema'
import type { ProductDetails } from '../types/products'

export const productService = {
  fetchProducts: async () => {
    const { data: products, error } = await supabase.from('products_view').select('*')
    if (error) {
      console.error('Error fetching products:', error)
    }
    return products
  },
  fetchProductDetails: async (product: Product) => {
    const table = product.sale_type === 'unit' ? 'products_unit' : 'products_bulk'

    const { data: productDetails, error } = await supabase.from(table).select('*').eq('product_id', product.id).single()
    if (error) {
      console.error('Error fetching product details:', error)
    }
    return productDetails
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
          subcategory: productData.subcategory || null,
          sale_type: productData.sale_type,
          is_active: productData.is_active,
          featured: productData.featured || false,
          description: productData.description,
          brand: productData.brand || null
        }
      ])
      .select()
      .single()

    if (productError) {
      console.error('Error inserting product:', productError)

      return { error: productError }
    }
    return productInserted
  },
  insertProductUnit: async (productId: string, dataProductUnit: ProductUnitInput) => {
    const { data: productUnitInserted, error: productUnitError } = await supabase
      .from('products_unit')
      .insert([
        {
          product_id: productId,
          unit: dataProductUnit.unit,
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

  updateProduct: async (id: number, product: ProductDataInput, details: ProductDetails) => {
    const payload = details.sale_type === 'unit' ? { p_unit: details.details, p_bulk: null } : { p_unit: null, p_bulk: details.details }

    console.log(product, details)

    const { data, error } = await supabase.rpc('update_product_and_details', {
      p_id: id,
      p_product: product,
      ...payload
    })

    if (error) {
      console.error('Error inserting product:', error)

      return { error }
    }
    return data
  },

  deleteProduct: async (productId: string) => {
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (error) {
      console.error('Error deleting product:', error)
    }
  }
}
