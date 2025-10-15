import supabase from '../lib/supabase'

export const locationService = {
  fetchPostalCodeData: async (postalCode: string) => {
    const { data, error } = await supabase.rpc('get_cp_data', { p_codigo: postalCode })

    if (error) {
      console.error('Error fetching postal code:', error)
      return null
    }
    return data
  }
}
