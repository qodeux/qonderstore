import supabase from '../lib/supabase'

export const productService = {
  fetchProducts: async () => {
    const { data: products, error } = await supabase.from('products_view').select('*')
    if (error) {
      console.error('Error fetching products:', error)
    }
    return products
  },
  createProduct: async (productData) => {
    const { data: productInserted, error: productError } = await supabase
      .from('products')
      .insert([
        {
          name: productData.name,
          slug: productData.slug,
          sku: productData.sku,
          category: productData.category,
          //price: productData.price,
          //stock: productData.stock,
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
  InsertProductUnit: async (productId: string, dataProductUnit) => {
    const { data: productUnitInserted, error: productUnitError } = await supabase
      .from('products_unit')
      .insert([
        {
          product_id: productId,
          unit: dataProductUnit.sale_unit,
          base_cost: dataProductUnit.base_cost,
          public_price: dataProductUnit.public_price
          // Aquí van los datos específicos de la unidad
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
  deleteProduct: async (productId: string) => {
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (error) {
      console.error('Error deleting product:', error)
    }
  }
}
