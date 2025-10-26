import supabase from '../lib/supabase'
import type { RequestInput } from '../schemas/request.schema'

export const requestAccessService = {
  fetchCategories: async () => {
    const { data: products, error } = await supabase.from('categories_view').select('*')
    if (error) {
      console.error('Error fetching categories:', error)
    }
    return products
  },
  createRequest: async (requestAccessData: RequestInput) => {
    //Quitar la propiedad acceptTerms antes de insertar en la base de datos
    const { acceptTerms: _omit, ...insertData } = requestAccessData

    console.log(insertData)

    const { data: requestAccessInserted, error: requestAccessError } = await supabase.from('request_access').insert(insertData)

    if (requestAccessError) {
      console.error('Error inserting requestAccess:', requestAccessError)
      return { error: requestAccessError }
    }
    return {
      data: requestAccessInserted,
      error: null,
      status: 201,
      statusText: 'Created'
    }
  },
  updateRequestStatus: async (id: number, status: string) => {
    if (!id) {
      console.error('El id de la solicitud es obligatorio para actualizar.')
      return
    }
    const { data: requestAccessUpdated, error: requestAccessError } = await supabase
      .from('request_access')
      .update({
        status
      })
      .eq('id', id)
      .select()
      .single()

    if (requestAccessError) {
      console.error('Error updating requestAccess:', requestAccessError)
      return
    }
    return requestAccessUpdated
  },
  deleteRequest: async (id: number) => {
    console.log('Deleting requestAccess with ID:', id)
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      console.error('Error deleting requestAccess:', error)
    }
  }
}
