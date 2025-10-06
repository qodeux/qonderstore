import supabase from '../lib/supabase'
import type { CategoryInput } from '../schemas/category.schema'

export const categoryService = {
  fetchCategories: async () => {
    const { data: products, error } = await supabase.from('categories_view').select('*')
    if (error) {
      console.error('Error fetching categories:', error)
    }
    return products
  },
  createCategory: async (categoryData: CategoryInput) => {
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
      return { error: categoryError }
    }
    return categoryInserted
  },
  updateCategory: async (categoryData: CategoryInput) => {
    if (!categoryData.id) {
      console.error('El id de la categoría es obligatorio para actualizar')
      return
    }
    const { data: categoryUpdated, error: categoryError } = await supabase
      .from('categories')
      .update({
        name: categoryData.name,
        parent: categoryData.parent,
        color: categoryData.color,
        slug_id: categoryData.slug_id,
        is_active: categoryData.is_active,
        featured: categoryData.featured
      })
      .eq('id', categoryData.id)
      .select()
      .single()

    if (categoryError) {
      console.error('Error updating category:', categoryError)
      return
    }
    return categoryUpdated
  },
  deleteCategory: async (productId: string) => {
    console.log('Deleting category with ID:', productId)
    const { error } = await supabase.from('categories').delete().eq('id', productId)
    if (error) {
      console.error('Error deleting category:', error)
    }
  }
}
