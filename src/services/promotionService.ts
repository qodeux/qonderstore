import supabase from '../lib/supabase'
import type { Promotions } from '../schemas/promotions.schema'

export const promotionsService = {
  fetchPromotion: async () => {
    const { data: promotions, error } = await supabase.from('promos').select('*')
    if (error) {
      console.error('Error fetching prpmotions:', error)
    }
    return promotions
  },
  createPromotion: async (promotionsData: Promotions) => {
    const { data: promotionInserted, error: promotionError } = await supabase
      .from('promos')
      .insert([
        {
          discount_type: promotionsData.discount_type,
          frequency: promotionsData.frequency,
          mode: promotionsData.mode,
          value: promotionsData.value,
          color: promotionsData.color,
          is_active: true
          //featured: false
        }
      ])
      .select()
      .single()

    if (promotionError) {
      console.error('Error inserting promotion:', promotionError)
      return
    }
    return promotionInserted
  },
  deletePromotion: async (promoID: string) => {
    console.log('Deleting promotion with ID:', promoID)
    const { error } = await supabase.from('promos').delete().eq('id', promoID)
    if (error) {
      console.error('Error deleting promotion:', error)
    }
  }
}
