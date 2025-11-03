import supabase from '../lib/supabase'

export const supplyOrdersService = {
  fetchSupplyOrders: async () => {
    const { data, error } = await supabase.from('supply_orders').select('*')
    if (error) {
      console.error('Error fetching supply orders:', error)
      return { error }
    }
    return { data }
  }
}
