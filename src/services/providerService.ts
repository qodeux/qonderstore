import supabase from '../lib/supabase'
import type { ProviderInput } from '../schemas/providers.schema'

export const providerService = {
  fetchProviders: async () => {
    const { data: products, error } = await supabase.from('providers_view').select('*')
    if (error) {
      console.error('Error fetching providers:', error)
    }
    return products
  },
  createProvider: async (providerData: ProviderInput) => {
    const { data: providerInserted, error: providerError } = await supabase
      .from('providers')
      .insert([
        {
          name: providerData.name,
          parent: providerData.parent,
          color: providerData.color,
          slug_id: providerData.slug_id,
          is_active: true,
          featured: false
        }
      ])
      .select()
      .single()

    if (providerError) {
      console.error('Error inserting provider:', providerError)
      return { error: providerError }
    }
    return providerInserted
  },
  updateProvider: async (providerData: ProviderInput) => {
    if (!providerData.id) {
      console.error('El id de la categoría es obligatorio para actualizar')
      return
    }
    const { data: providerUpdated, error: providerError } = await supabase
      .from('providers')
      .update({
        name: providerData.name,
        parent: providerData.parent,
        color: providerData.color,
        slug_id: providerData.slug_id,
        is_active: providerData.is_active,
        featured: providerData.featured
      })
      .eq('id', providerData.id)
      .select()
      .single()

    if (providerError) {
      console.error('Error updating provider:', providerError)
      return
    }
    return providerUpdated
  },
  deleteProvider: async (id: number) => {
    console.log('Deleting provider with ID:', id)
    const { error } = await supabase.from('providers').delete().eq('id', id)
    if (error) {
      console.error('Error deleting provider:', error)
    }
  }
}
