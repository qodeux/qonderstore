import supabase from '../lib/supabase'
import type { Category } from '../schemas/category.schema'

export const categoryService = {
  fetchCategories: async () => {
    const { data: products, error } = await supabase.from('categories_view').select('*')
    if (error) {
      console.error('Error fetching categories:', error)
    }
    return products
  },
  createCategory: async (categoryData: Category) => {
    const { data: categoryInserted, error: categoryError } = await supabase
      .from('categories')
      .insert([
        {
          name: categoryData.name,
          parent: categoryData.parent,
          color: categoryData.color,
          slug_id: categoryData.slug_id,
          is_active: true,
          featured: false
        }
      ])
      .select()
      .single()

    if (categoryError) {
      console.error('Error inserting category:', categoryError)
      return
    }
    return categoryInserted
  },
  deleteCategory: async (productId: string) => {
    console.log('Deleting category with ID:', productId)
    const { error } = await supabase.from('categories').delete().eq('id', productId)
    if (error) {
      console.error('Error deleting category:', error)
    }
  }
}
